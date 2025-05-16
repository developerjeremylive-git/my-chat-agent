import { routeAgentRequest, type Schedule } from "agents";
import { unstable_getSchedulePrompt } from "agents/schedule";
import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  formatDataStreamPart,
  type StreamTextOnFinishCallback,
  type ToolSet,
} from "ai";
import { createWorkersAI } from 'workers-ai-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "cloudflare:workers";
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { GoogleGenAI } from "@google/genai";

const app = new Hono();
const workersai = createWorkersAI({ binding: env.AI });

// Variables globales para almacenar el modelo seleccionado, prompt del sistema y configuración de Gemini
let selectedModel = 'gemini-2.0-flash';
let geminiModel = 'gemini-2.0-flash';
// let systemPrompt = 'You are a helpful assistant that can do various tasks...';
let systemPrompt = 'Eres un asistente útil que puede realizar varias tareas...';

// Endpoint para actualizar el modelo
app.post('/api/model', async (c) => {
  const { model } = await c.req.json();
  selectedModel = model;
  return c.json({ success: true, model: selectedModel });
});

// Endpoint para actualizar el prompt del sistema
app.post('/api/system-prompt', async (c) => {
  const { prompt } = await c.req.json();
  systemPrompt = prompt;
  return c.json({ success: true, prompt: systemPrompt });
});

// Endpoint para obtener el prompt del sistema actual
app.get('/api/system-prompt', async (c) => {
  return c.json({ prompt: systemPrompt });
});

// Middleware CORS
app.use('/*', cors());

// Función para obtener el modelo actual
const getModel = () => workersai(selectedModel);

// Stream the AI response using GPT-4
import { config } from './contexts/config';
// error
// const model = workersai("@cf/meta/llama-4-scout-17b-16e-instruct");
// const model = workersai("@cf/mistralai/mistral-small-3.1-24b-instruct");
// const model = workersai("@cf/meta/llama-guard-3-8b");
// const model = workersai("@cf/meta/llama-3.2-11b-vision-instruct");
// const model = workersai("@cf/qwen/qwen2.5-coder-32b-instruct");
// const model = workersai("@cf/qwen/qwq-32b");

//funcionando
const model = getModel();
// const model = workersai("@cf/google/gemma-7b-it-lora");
// const model = workersai("@hf/mistral/mistral-7b-instruct-v0.2");
// const model = workersai("@cf/fblgit/una-cybertron-7b-v2-bf16");
// const model = workersai("@cf/meta/llama-3-8b-instruct");
// const model = workersai("@cf/meta/llama-3-8b-instruct-awq");
// const model = workersai("@hf/meta-llama/meta-llama-3-8b-instruct");
// const model = workersai("@cf/meta/llama-3.1-8b-instruct");
// const model = workersai("@cf/meta/llama-3.1-8b-instruct-fp8");
// const model = workersai("@cf/meta/llama-3.1-8b-instruct-awq");
// const model = workersai("@cf/meta/llama-3.2-3b-instruct");
// const model = workersai("@cf/meta/llama-3.2-1b-instruct");
// const model = workersai("@cf/meta/llama-3.3-70b-instruct-fp8-fast");


// Cloudflare AI Gateway
// const openai = createOpenAI({
//   apiKey: geminiApiKey,
//   baseURL: geminiModel,
// });
// const model = openai("gpt-4o-2024-11-20");

// we use ALS to expose the agent context to the tools
export const agentContext = new AsyncLocalStorage<Chat>();
/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    const allTools = {
      ...tools,
      // ...this.mcp.unstable_getAITools(),
    };

    // if (geminiApiKey !== '') {
    //gemini-2.0-flash
    if (selectedModel === "gemini-2.0-flash") {
      const geminiApiKey = env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not set in environment variables');
      }
      const ai = new GoogleGenAI({ apiKey: geminiApiKey });
      const response = await ai.models.generateContent({
        model: geminiModel,
        contents: [
          {
            parts: [
              { text: systemPrompt },
              ...this.messages.map(msg => ({ text: msg.content }))
            ]
          }
        ],
        // config: {
        //   // systemInstruction: "You are a cat. Your name is Neko.",
        //   // systemInstruction: systemPrompt,
        //   // maxOutputTokens: 500,
        //   temperature: config.temperature,
        //   topP: config.topP,
        //   topK: config.topK,
        //   frequencyPenalty: config.frequencyPenalty,
        //   presencePenalty: config.presencePenalty,
        //   seed: config.seed,
        //   // toolCallStreaming: true,
        // },
      });
      return createDataStreamResponse({
        execute: async (dataStream) => {
          dataStream.write(formatDataStreamPart('text', response.text ?? ''));
        }
      });
    } else {
      // Create a streaming response that handles both text and tool outputs
      return agentContext.run(this, async () => {
        const dataStreamResponse = createDataStreamResponse({
          execute: async (dataStream) => {
            // Process any pending tool calls from previous messages
            // This handles human-in-the-loop confirmations for tools
            const processedMessages = await processToolCalls({
              messages: this.messages,
              dataStream,
              tools: allTools,
              executions,
            });

            const result = streamText({
              model,
              temperature: config.temperature,
              maxTokens: config.maxTokens,
              topP: config.topP,
              topK: config.topK,
              frequencyPenalty: config.frequencyPenalty,
              presencePenalty: config.presencePenalty,
              seed: config.seed,
              // toolCallStreaming: true,
              system: `${systemPrompt}`,

              // ${unstable_getSchedulePrompt({ date: new Date() })}

              // Si el usuario solicita programar una tarea, utilice la herramienta de programación para programar las tareas
              // `,

              // If the user asks to schedule a task, use the schedule tool to schedule the task.
              messages: processedMessages,
              tools: allTools,
              onFinish: async (args) => {
                onFinish(
                  args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]
                );
                console.log('Stream finalizado');
              },
              onError: (error) => {
                console.error("Error while streaming:", error);
              },
              maxSteps: 10,
            });

            // Merge the AI response stream with tool execution outputs
            result.mergeIntoDataStream(dataStream);
          },
        });

        return dataStreamResponse;
      });
    }
  }
  async executeTask(description: string, task: Schedule<string>) {
    await this.saveMessages([
      ...this.messages,
      {
        id: generateId(),
        role: "user",
        content: `Running scheduled task: ${description}`,
        createdAt: new Date(),
      },
    ]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // Manejar las rutas de la API con Hono
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }

    if (url.pathname === "/check-open-ai-key") {
      const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
      return Response.json({
        success: hasOpenAIKey,
      });
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error(
        "OPENAI_API_KEY is not set, don't forget to set it locally in .dev.vars, and use `wrangler secret bulk .dev.vars` to upload it to production"
      );
    }
    return (
      // Route the request to our agent or return 404 if not found
      (await routeAgentRequest(request, env)) ||
      new Response("Not found", { status: 404 })
    );
  },
};



//
// Codigo que no se uso en estas funcionalidades.
//
// let geminiApiKey = '';
// let geminiModel = 'gemini-2.0-flash';
// Endpoint para configurar Gemini API
// app.post('/api/gemini-config', async (c) => {
//   const { apiKey, model } = await c.req.json();
//   geminiApiKey = apiKey;
//   ai = new GoogleGenAI({ apiKey: apiKey });
//   if (model) geminiModel = model;
//   return c.json({ success: true, model: geminiModel });
// });

// // Endpoint para obtener la configuración actual de Gemini
// app.get('/api/gemini-config', async (c) => {
//   return c.json({ model: geminiModel });
// });