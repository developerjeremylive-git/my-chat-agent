import { routeAgentRequest, type Schedule } from "agents";

import { unstable_getSchedulePrompt } from "agents/schedule";

import { AIChatAgent } from "agents/ai-chat-agent";
import {
  createDataStreamResponse,
  generateId,
  streamText,
  type StreamTextOnFinishCallback,
} from "ai";
import { createWorkersAI } from 'workers-ai-provider';
import { processToolCalls } from "./utils";
import { tools, executions } from "./tools";
import { AsyncLocalStorage } from "node:async_hooks";
import { env } from "cloudflare:workers";
const workersai = createWorkersAI({ binding: env.AI });

// error
// const model = workersai("@cf/meta/llama-4-scout-17b-16e-instruct");
// const model = workersai("@cf/mistralai/mistral-small-3.1-24b-instruct");
// const model = workersai("@cf/meta/llama-guard-3-8b");
// const model = workersai("@cf/meta/llama-3.2-11b-vision-instruct");
// const model = workersai("@cf/qwen/qwen2.5-coder-32b-instruct");
// const model = workersai("@cf/qwen/qwq-32b");

//funcionando
const model = workersai("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b");
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
//   apiKey: env.OPENAI_API_KEY,
//   baseURL: env.GATEWAY_BASE_URL,
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
  async onChatMessage(onFinish: StreamTextOnFinishCallback<{}>) {
    // Create a streaming response that handles both text and tool outputs
    return agentContext.run(this, async () => {
      const dataStreamResponse = createDataStreamResponse({
        execute: async (dataStream) => {
          // Process any pending tool calls from previous messages
          // This handles human-in-the-loop confirmations for tools
          const processedMessages = await processToolCalls({
            messages: this.messages,
            dataStream,
            tools,
            executions,
          });

          // Stream the AI response using GPT-4
          // Obtener la configuración guardada del modelo
          const savedConfig = localStorage.getItem('modelConfig');
          const modelConfig = savedConfig ? JSON.parse(savedConfig) : {
            temperature: 0.7,
            maxTokens: 2048,
            topP: 0.95,
            frequencyPenalty: 0.0,
            presencePenalty: 0.0
          };

          // Mapear los nombres de las propiedades al formato esperado por el modelo
          const mappedConfig = {
            temperature: modelConfig.temperature,
            maxTokens: modelConfig.max_tokens,
            topP: modelConfig.top_p,
            frequencyPenalty: modelConfig.frequency_penalty,
            presencePenalty: modelConfig.presence_penalty
          };

          const result = streamText({
            model,
            ...mappedConfig,
            system: `You are a helpful assistant that can do various tasks... 

${unstable_getSchedulePrompt({ date: new Date() })}

If the user asks to schedule a task, use the schedule tool to schedule the task.
`,
            messages: processedMessages,
            tools,
            onFinish,
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
} satisfies ExportedHandler<Env>;
