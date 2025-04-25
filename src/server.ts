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

type TextGenerationModels = "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" | "@cf/google/gemma-7b-it-lora" | "@hf/mistral/mistral-7b-instruct-v0.2" | "@cf/fblgit/una-cybertron-7b-v2-bf16" | "@cf/meta/llama-3-8b-instruct" | "@cf/meta/llama-3-8b-instruct-awq" | "@hf/meta-llama/meta-llama-3-8b-instruct" | "@cf/meta/llama-3.1-8b-instruct" | "@cf/meta/llama-3.1-8b-instruct-fp8" | "@cf/meta/llama-3.1-8b-instruct-awq" | "@cf/meta/llama-3.2-3b-instruct" | "@cf/meta/llama-3.2-1b-instruct" | "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const workersai = createWorkersAI({ binding: env.AI });

export const availableModels: { id: TextGenerationModels; name: string; status: string; }[] = [
  // Modelos con error
  // { id: "@cf/meta/llama-4-scout-17b-16e-instruct", name: "Llama 4 Scout 17B", status: "error" },
  // { id: "@cf/mistralai/mistral-small-3.1-24b-instruct", name: "Mistral Small 3.1 24B", status: "error" },
  // { id: "@cf/meta/llama-guard-3-8b", name: "Llama Guard 3.8B", status: "error" },
  // { id: "@cf/meta/llama-3.2-11b-vision-instruct", name: "Llama 3.2 11B Vision", status: "error" },
  // { id: "@cf/qwen/qwen2.5-coder-32b-instruct", name: "Qwen 2.5 Coder 32B", status: "error" },
  // { id: "@cf/qwen/qwq-32b", name: "QWQ 32B", status: "error" },

  // Modelos funcionando
  { id: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b", name: "Deepseek R1 Distill Qwen 32B", status: "active" },
  { id: "@cf/google/gemma-7b-it-lora", name: "Gemma 7B IT LoRA", status: "active" },
  { id: "@hf/mistral/mistral-7b-instruct-v0.2", name: "Mistral 7B Instruct v0.2", status: "active" },
  { id: "@cf/fblgit/una-cybertron-7b-v2-bf16", name: "Una Cybertron 7B v2", status: "active" },
  { id: "@cf/meta/llama-3-8b-instruct", name: "Llama 3 8B Instruct", status: "active" },
  { id: "@cf/meta/llama-3-8b-instruct-awq", name: "Llama 3 8B Instruct AWQ", status: "active" },
  { id: "@hf/meta-llama/meta-llama-3-8b-instruct", name: "Meta Llama 3 8B Instruct", status: "active" },
  { id: "@cf/meta/llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct", status: "active" },
  { id: "@cf/meta/llama-3.1-8b-instruct-fp8", name: "Llama 3.1 8B Instruct FP8", status: "active" },
  { id: "@cf/meta/llama-3.1-8b-instruct-awq", name: "Llama 3.1 8B Instruct AWQ", status: "active" },
  { id: "@cf/meta/llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct", status: "active" },
  { id: "@cf/meta/llama-3.2-1b-instruct", name: "Llama 3.2 1B Instruct", status: "active" },
  { id: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", name: "Llama 3.3 70B Instruct FP8 Fast", status: "active" },
];

export let model = workersai(availableModels[11].id as TextGenerationModels); // Default model

export function updateModel(modelId: TextGenerationModels) {
  model = workersai(modelId);
}


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
          const result = streamText({
            model,
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
