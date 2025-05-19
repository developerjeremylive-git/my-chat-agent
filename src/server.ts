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
import type { ChatMessage, ChatData, LocalMessage, LocalChatData } from '@/types/chat';

// Almacenamiento temporal de chats (en producción debería usar una base de datos)
let chats: LocalChatData[] = [];

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
// Endpoints para la gestión de chats
app.get('/api/chats', async (c) => {
  return c.json(chats);
});

app.get('/api/chats/:id', async (c) => {
  const chatId = c.req.param('id');
  const chat = chats.find(c => c.id === chatId);
  if (!chat) {
    return c.json({ error: 'Chat no encontrado' }, 404);
  }
  return c.json(chat);
});

app.post('/api/chats', async (c) => {
  const { title } = await c.req.json();
  const newChat: ChatData = {
    id: generateId(),
    title: title || 'Nuevo Chat',
    messages: [],
    lastMessageAt: new Date()
  };
  chats.push(newChat);
  return c.json(newChat);
});

app.put('/api/chats/:id/title', async (c) => {
  const chatId = c.req.param('id');
  const { title } = await c.req.json();
  
  const chatIndex = chats.findIndex(chat => chat.id === chatId);
  if (chatIndex === -1) {
    return c.json({ error: 'Chat no encontrado' }, 404);
  }
  
  chats[chatIndex].title = title;
  return c.json({ success: true, chat: chats[chatIndex] });
});

app.delete('/api/chats/:id', async (c) => {
  const chatId = c.req.param('id');
  chats = chats.filter(c => c.id !== chatId);
  return c.json({ success: true });
});

app.use('/*', cors());

// Endpoint to check OpenAI key
app.get('/check-open-ai-key', async (c) => {
  const openAIKey = env.OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY || (import.meta as any).env.OPENAI_API_KEY;
  return c.json({
    success: !!openAIKey
  });
});

// Endpoint to get messages for a chat
class SimpleDurableObjectState implements DurableObjectState {
  private store: Map<string, any>;
  public storage: DurableObjectStorage;
  private webSocketAutoResponse: WebSocketRequestResponsePair | null = null;
  private webSocketAutoResponseTimestamp: number = 0;
  private hibernatableWebSocketEventTimeout: number = 0;
  private webSockets: Set<WebSocket> = new Set();

  constructor() {
    this.store = new Map<string, any>();
    this.storage = {
      get: async <T>(key: string | string[], options?: DurableObjectGetOptions): Promise<T | undefined> => {
        if (Array.isArray(key)) {
          const results = new Map<string, T>();
          for (const k of key) {
            const value = this.store.get(k) as T;
            if (value !== undefined) results.set(k, value);
          }
          return results as any;
        }
        return this.store.get(key) as T;
      },
      put: async <T>(key: string | Record<string, T>, value?: T, options?: DurableObjectPutOptions): Promise<void> => {
        if (typeof key === 'string') {
          this.store.set(key, value);
        } else {
          Object.entries(key).forEach(([k, v]) => this.store.set(k, v));
        }
      },
      delete: async (key: string | string[], options?: DurableObjectPutOptions): Promise<boolean | number> => {
        // Handle single key deletion
        if (typeof key === 'string') {
          return this.store.delete(key);
        }
        // Handle array of keys deletion
        if (Array.isArray(key)) {
          let deletedCount = 0;
          for (const k of key) {
            if (this.store.delete(k)) {
              deletedCount++;
            }
          }
          return deletedCount;
        }
        throw new Error('Invalid key type');
      },
      list: async <T = unknown>(options?: DurableObjectListOptions): Promise<Map<string, T>> => {
        if (!options?.prefix) return new Map(this.store);
        const entries = Array.from(this.store.entries())
          .filter(([key]) => key.startsWith(options.prefix!));
        
        if (options.reverse) entries.reverse();
        if (options.limit) entries.splice(options.limit);
        
        return new Map(entries);
      },
      deleteAll: async (): Promise<void> => {
        this.store.clear();
      },
      transaction: async <T>(closure: (txn: DurableObjectTransaction) => Promise<T>): Promise<T> => {
        const txn: DurableObjectTransaction = {
          get: this.storage.get.bind(this.storage),
          put: this.storage.put.bind(this.storage),
          delete: this.storage.delete.bind(this.storage),
          rollback: () => { throw new Error('Rollback not supported in simulated storage'); },
          list: this.storage.list.bind(this.storage),
          getAlarm: async () => null,
          setAlarm: async () => {},
          deleteAlarm: async () => {}
        };
        return closure(txn);
      }
    };
  }

  setWebSocketAutoResponse(maybeReqResp?: WebSocketRequestResponsePair): void {
    this.webSocketAutoResponse = maybeReqResp ?? null;
    this.webSocketAutoResponseTimestamp = Date.now();
  }

  getWebSocketAutoResponse(): WebSocketRequestResponsePair | null {
    return this.webSocketAutoResponse;
  }

  getWebSocketAutoResponseTimestamp(ws: WebSocket): Date | null {
    return this.webSocketAutoResponseTimestamp ? new Date(this.webSocketAutoResponseTimestamp) : null;
  }

  setHibernatableWebSocketEventTimeout(timeoutMs: number): void {
    this.hibernatableWebSocketEventTimeout = timeoutMs;
  }

  getHibernatableWebSocketEventTimeout(): number {
    return this.hibernatableWebSocketEventTimeout;
  }

  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
    return callback();
  }

  waitUntil(promise: Promise<any>): void {}

  id = {
    toString: () => 'mock-id',
    equals: (other: DurableObjectId) => this.id.toString() === other.toString()
  };

  getTags(): string[] {
    return [];
  }

  abort(): void {}

  acceptWebSocket(ws: WebSocket): void {
    this.webSockets.add(ws);
    ws.addEventListener('close', () => {
      this.webSockets.delete(ws);
    });
  }

  getWebSockets(): WebSocket[] {
    return Array.from(this.webSockets);
  }
}

app.get('/agents/chat/default/get-messages', async (c) => {
  try {
    const chatId = c.req.query('chatId') || 'default';

    // Obtener o crear instancia de Chat
    let chat = Chat.instance;
    if (!chat) {
      const state = new SimpleDurableObjectState();
      chat = new Chat(state, env);
    }

    // Cargar chats si es necesario
    if (chats.length === 0) {
      try {
        const savedChats = await chat.storage.get('chats') as LocalChatData[];
        if (savedChats?.length > 0) {
          chats = savedChats.map((chat: ChatData) => ({
            ...chat,
            lastMessageAt: new Date(chat.lastMessageAt),
            messages: chat.messages.map((msg: ChatMessage) => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            }))
          }));
        } else {
          await chat.initializeDefaultChat();
          return c.json({ success: true, messages: [] });
        }
      } catch (error) {
        console.error('Error al cargar chats:', error);
        return c.json({
          error: 'Error al cargar chats del almacenamiento',
          details: error instanceof Error ? error.message : 'Error desconocido'
        }, 500);
      }
    }

    // Buscar chat específico
    const currentChat = chats.find(c => c.id === chatId);
    if (!currentChat) {
      return c.json({
        error: 'Chat no encontrado',
        details: `No se encontró un chat con ID: ${chatId}`
      }, 404);
    }

    return c.json({
      success: true,
      messages: currentChat.messages || []
    });
  } catch (error) {
    console.error('Error al recuperar mensajes:', error);
    return c.json({
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, 500);
  }
});

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
  currentChatId: string | null = null;
  public static instance: Chat | null = null;
  public storage!: DurableObjectStorage;
  public messages: ChatMessage[] = [];

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    if (!Chat.instance) {
      Chat.instance = this;
      if (state instanceof SimpleDurableObjectState) {
        this.storage = state.storage;
      } else {
        this.storage = state.storage;
      }
      this.messages = [];
      this.initializeDefaultChat().catch(error => {
        console.error('Error initializing default chat:', error);
      });
    } else {
      Chat.instance.env = env;
    }
    return Chat.instance;
  }

  public async initializeDefaultChat() {
    const defaultChat: ChatData = {
      id: generateId(),
      title: '¡Bienvenido a tu Asistente Virtual! 🤖',
      messages: [],
      lastMessageAt: new Date()
    };

    // Initialize chats array with default chat if empty
    if (chats.length === 0) {
      chats.push(defaultChat);
      try {
        await this.storage.put('chats', chats);
        this.currentChatId = defaultChat.id;
        // Emitir evento para actualizar la interfaz
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatsUpdated', { 
            detail: { chats }
          }));
        }
      } catch (error) {
        console.error('Error saving default chat to storage:', error);
      }
    }
    return defaultChat;
  }

  /**
   * Establece el ID del chat actual
   */
  setCurrentChat(chatId: string) {
    this.currentChatId = chatId;
    // Cargar mensajes del chat seleccionado
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      this.messages = chat.messages;
    }
  }

  /**
   * Guarda los mensajes en el chat actual y actualiza el estado global
   */
  private async loadChatsFromStorage(): Promise<LocalChatData[]> {
    try {
      const savedChats = await this.storage.get('chats') as LocalChatData[];
      if (savedChats && savedChats.length > 0) {
        return savedChats.map((chat: ChatData) => ({
          ...chat,
          lastMessageAt: new Date(chat.lastMessageAt),
          messages: chat.messages.map(msg => ({
            ...msg,
            createdAt: new Date(msg.createdAt)
          }))
        }));
      }
    } catch (error) {
      console.error('Error loading chats from storage:', error);
    }
    return [];
  }

  private async saveToCurrentChat(messages: ChatMessage[]) {
    // Ensure all messages have a valid Date for createdAt
    const validatedMessages = messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt || new Date()
    }));
    if (this.currentChatId) {
      const chatIndex = chats.findIndex(c => c.id === this.currentChatId);
      if (chatIndex !== -1) {
        const updatedMessages = validatedMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt
        }));

        chats[chatIndex].messages = updatedMessages;
        chats[chatIndex].lastMessageAt = new Date();

        try {
          await this.storage.put('chats', chats);
        } catch (error) {
          console.error('Error saving chats to storage:', error);
        }
      }
    }
  }

  /**
   * Handles incoming chat messages and manages the response stream
   * @param onFinish - Callback function executed when streaming completes
   */

  // biome-ignore lint/complexity/noBannedTypes: <explanation>
  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    try {
      // Inicializar o cargar chats si es necesario
      await this.initializeOrLoadChats();

      // Asegurar que existe un chat activo
      await this.ensureActiveChat();

      const allTools = { ...tools };

      // Manejar la generación de respuesta según el modelo seleccionado
      if (selectedModel === "gemini-2.0-flash") {
        return await this.handleGeminiResponse(onFinish);
      } else {
        return await this.handleDefaultModelResponse(allTools, onFinish);
      }
    } catch (error) {
      console.error('Error en onChatMessage:', error);
      throw error;
    }
  }

  private async initializeOrLoadChats() {
    if (chats.length === 0) {
      chats = await this.loadChatsFromStorage();
      if (chats.length === 0) {
        await this.initializeDefaultChat();
      }
    }
  }

  private async ensureActiveChat() {
    if (!this.currentChatId) {
      const newChat: ChatData = {
        id: generateId(),
        title: 'Nuevo Chat',
        messages: [],
        lastMessageAt: new Date()
      };
      chats.push(newChat);
      this.currentChatId = newChat.id;
    }
  }

  private async handleGeminiResponse(onFinish: StreamTextOnFinishCallback<ToolSet>) {
    const geminiApiKey = env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || (import.meta as any).env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY no está configurada en las variables de entorno');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [{
        parts: [
          { text: systemPrompt },
          ...this.messages.map(msg => ({ text: msg.content }))
        ]
      }]
    });

    const message: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: response.text ?? '',
      createdAt: new Date(),
    };
    const messages = [...this.messages, message];

    await this.saveMessages(messages);
    await this.saveToCurrentChat(messages);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.write(formatDataStreamPart('text', response.text ?? ''));
        console.log('Transmisión de Gemini finalizada');
      }
    });
  }

  private async handleDefaultModelResponse(allTools: any, onFinish: StreamTextOnFinishCallback<ToolSet>) {
    return agentContext.run(this, async () => {
      return createDataStreamResponse({
        execute: async (dataStream) => {
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
            system: systemPrompt,
            messages: processedMessages,
            tools: allTools,
            onFinish: async (args) => {
              onFinish(args as Parameters<StreamTextOnFinishCallback<ToolSet>>[0]);
              console.log('Stream finalizado');
            },
            onError: (error) => {
              console.error("Error durante el streaming:", error);
            },
            maxSteps,
          });

          result.mergeIntoDataStream(dataStream);
        },
      });
    });
  }
  async executeTask(description: string, task: Schedule<string>) {
    const message: ChatMessage = {
      id: generateId(),
      role: "user",
      content: `Running scheduled task: ${description}`,
      createdAt: new Date(),
    };
    await this.saveMessages([...this.messages, message]);
  }
}

/**
 * Worker entry point that routes incoming requests to the appropriate handler
 */
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  }
};

const workerHandler = {
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