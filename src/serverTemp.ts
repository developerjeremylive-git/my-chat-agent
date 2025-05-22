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

// Configuración por defecto
const DEFAULT_MAX_STEPS = 5;
// const DEFAULT_TEMPERATURE = 0.7;
// const DEFAULT_MAX_TOKENS = 2048;
// const DEFAULT_TOP_P = 0.95;
// const DEFAULT_TOP_K = 40;
// const DEFAULT_FREQUENCY_PENALTY = 0;
// const DEFAULT_PRESENCE_PENALTY = 0;
// const DEFAULT_SEED = 42;

const app = new Hono();
const workersai = createWorkersAI({ binding: env.AI });

// Variables globales para almacenar el modelo seleccionado, prompt del sistema y configuración
let selectedModel = 'gemini-2.0-flash';
let geminiModel = 'gemini-2.0-flash';
let systemPrompt = 'Eres un asistente útil que puede realizar varias tareas...';
let maxSteps = DEFAULT_MAX_STEPS;
// let temperature = DEFAULT_TEMPERATURE;
// let maxTokens = DEFAULT_MAX_TOKENS;
// let topP = DEFAULT_TOP_P;
// let topK = DEFAULT_TOP_K;
// let frequencyPenalty = DEFAULT_FREQUENCY_PENALTY;
// let presencePenalty = DEFAULT_PRESENCE_PENALTY;
// let seed = DEFAULT_SEED;

// Endpoint para actualizar el modelo
app.post('/api/model', async (c) => {
  const { model } = await c.req.json();
  selectedModel = model;
  return c.json({ success: true, model: selectedModel });
});

// Endpoint para actualizar la configuración del asistente
app.post('/api/config', async (c) => {
  const config = await c.req.json();

  // Validar y actualizar cada parámetro
  if (typeof config.maxSteps === 'number' && config.maxSteps > 0) {
    maxSteps = config.maxSteps;
  }
  // if (typeof config.temperature === 'number' && config.temperature >= 0 && config.temperature <= 1) {
  //   temperature = config.temperature;
  // }
  // if (typeof config.maxTokens === 'number' && config.maxTokens > 0) {
  //   maxTokens = config.maxTokens;
  // }
  // if (typeof config.topP === 'number' && config.topP >= 0 && config.topP <= 1) {
  //   topP = config.topP;
  // }
  // if (typeof config.topK === 'number' && config.topK > 0) {
  //   topK = config.topK;
  // }
  // if (typeof config.frequencyPenalty === 'number') {
  //   frequencyPenalty = config.frequencyPenalty;
  // }
  // if (typeof config.presencePenalty === 'number') {
  //   presencePenalty = config.presencePenalty;
  // }
  // if (typeof config.seed === 'number') {
  //   seed = config.seed;
  // }

  // return c.json({
  //   success: true,
  //   config: {
  //     maxSteps,
  //     temperature,
  //     maxTokens,
  //     topP,
  //     topK,
  //     frequencyPenalty,
  //     presencePenalty,
  //     seed
  //   }
  // });
});

// Endpoint para obtener la configuración actual
// app.get('/api/config', async (c) => {
//   return c.json({
//     maxSteps,
//     temperature,
//     maxTokens,
//     topP,
//     topK,
//     frequencyPenalty,
//     presencePenalty,
//     seed
//   });
// });

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


// Función para obtener la configuración actual del modelo
// const getCurrentConfig = () => ({
//   temperature,
//   maxTokens,
//   topP,
//   topK,
//   frequencyPenalty,
//   presencePenalty,
//   seed
// });

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
      
      // Crear una promesa para manejar la finalización
      return createDataStreamResponse({
        execute: async (dataStream) => {
          let lastError = null;
          let currentStep = 0;

          while (currentStep < maxSteps) {
            try {
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
              });

              if (!response || !response.text) {
                throw new Error('No se pudo generar contenido en el paso ' + (currentStep + 1));
              }

              // Crear mensaje de respuesta
              const messageResponse = {
                id: generateId(),
                role: "assistant",
                content: response.text,
                createdAt: new Date(),
              };

              // Guardar el mensaje en la base de datos
              await this.saveMessages([
                ...this.messages,
                messageResponse,
              ]);

              // Enviar la respuesta al stream para actualizar la UI
              dataStream.write(formatDataStreamPart('text', `[Paso ${currentStep + 1}/${maxSteps}] ${response.text}`));

              currentStep++;
            } catch (error) {
              console.error(`Error en el paso ${currentStep + 1}:`, error);
              lastError = error;
              break;
            }
          }

          if (lastError) {
            throw lastError;
          }

          // Guardar mensajes y ejecutar callback de finalización
          // await this.saveMessages([
          //   ...this.messages,
          //   {
          //     id: generateId(),
          //     role: "assistant",
          //     content: response.text ?? '',
          //     createdAt: new Date(),
          //   },
          // ]);

          // Ejecutar el callback onFinish con los argumentos necesarios
          // onFinish({
          //   text: response.text ?? '',
          //   response: {
          //     id: generateId(),
          //     timestamp: new Date(),
          //     modelId: geminiModel,
          //     messages: [],
          //     body: response.text ?? ''
          //   },
          //   reasoning: 'Generated response using Gemini model',
          //   reasoningDetails: [{
          //     type: 'text',
          //     text: 'Processed user message and generated AI response'
          //   }],
          //   files: [],
          //   toolCalls: [],
          //   steps: [],
          //   finishReason: 'stop',
          //   sources: [],
          //   toolResults: [],
          //   usage: {
          //     promptTokens: 0,
          //     completionTokens: 0,
          //     totalTokens: 0
          //   },
          //   warnings: [],
          //   logprobs: undefined,
          //   request: {},
          //   providerMetadata: {},
          //   experimental_providerMetadata: {}
          // });

          console.log('Transmisión de Gemini finalizada');
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
              maxSteps,
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