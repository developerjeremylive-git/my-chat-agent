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

interface WebSocketRequestResponsePair {
  request: string;
  response: string;
}
// Almacenamiento temporal de chats (en producción debería usar una base de datos)
let chats: LocalChatData[] = [{
  id: '3xytdwIhg9AimViz',
  title: '¡Bienvenido a tu Asistente Virtual! 🤖',
  messages: [],
  lastMessageAt: new Date('2025-05-19T23:36:05.129Z')
}];

// Configuración por defecto
const DEFAULT_MAX_STEPS = 5;
// const DEFAULT_TEMPERATURE = 0.7;
// const DEFAULT_MAX_TOKENS = 2048;
// const DEFAULT_TOP_P = 0.95;
// const DEFAULT_TOP_K = 40;
// const DEFAULT_FREQUENCY_PENALTY = 0;
// const DEFAULT_PRESENCE_PENALTY = 0;
// const DEFAULT_SEED = 42;

interface Env {
  DB: D1Database;
  AI: any;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();
const workersai = createWorkersAI({ binding: env.AI });

// WebSocket connections store
const wsConnections = new Map<string, Set<WebSocket>>();

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
  try {
    const chats = await c.env.DB.prepare(
      'SELECT * FROM chats ORDER BY last_message_at DESC'
    ).all();

    // Format the chats with proper date handling
    const formattedChats = chats.results.map(chat => {
      const lastMessageAt = typeof chat.last_message_at === 'string' ? 
        new Date(chat.last_message_at) : new Date();
      return {
        ...chat,
        lastMessageAt: lastMessageAt.toISOString(),
        messages: [] // Initialize empty messages array
      };
    });

    return c.json(formattedChats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return c.json({ error: 'Failed to fetch chats' }, 500);
  }
});

app.get('/api/chats/:id/messages', async (c) => {
  try {
    const chatId = c.req.param('id');

    // Primero verificar si el chat existe
    const chat = await c.env.DB.prepare(
      'SELECT * FROM chats WHERE id = ?'
    ).bind(chatId).first();

    if (!chat) {
      return c.json({ success: false, error: 'Chat not found' }, 404);
    }

    const messages = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    ).bind(chatId).all();

    // Format messages with proper date handling
    const formattedMessages = messages.results.map(msg => {
      const createdAt = msg.created_at && (typeof msg.created_at === 'string' || msg.created_at instanceof Date) ?
        new Date(msg.created_at) : 
        typeof msg.created_at === 'number' ? new Date(msg.created_at) : 
        new Date();
      return {
        id: msg.id as string,
        chatId: msg.chat_id as string,
        role: msg.role as 'assistant' | 'system' | 'user' | 'data',
        content: msg.content as string,
        createdAt: createdAt
      };
    });

    return c.json({
      success: true,
      messages: formattedMessages
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return c.json({ success: false, error: 'Failed to fetch chat messages' }, 500);
  }
});

app.get('/api/chats/:id', async (c) => {
  try {
    const chatId = c.req.param('id');
    const chat = await c.env.DB.prepare(
      'SELECT * FROM chats WHERE id = ?'
    ).bind(chatId).first();

    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    // Get messages for this chat
    const messages = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    ).bind(chatId).all();

    // Combine chat data with messages
    const chatWithMessages = {
      ...chat,
      messages: messages.results || []
    };

    // Notify WebSocket clients about the chat selection
    const connections = wsConnections.get(chatId) || new Set<WebSocket>();
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'chat_selected',
          chat: chatWithMessages
        }));
      }
    });

    return c.json(chatWithMessages);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return c.json({ error: 'Failed to fetch chat' }, 500);
  }
});

app.post('/api/chats', async (c) => {
  try {
    const { title } = await c.req.json();
    const newChat: ChatData = {
      id: generateId(),
      title: title || 'Nuevo Chat',
      messages: [],
      lastMessageAt: new Date()
    };

    // Insertar el nuevo chat en la base de datos D1
    await c.env.DB.prepare(
      'INSERT INTO chats (id, title, last_message_at) VALUES (?, ?, ?)'
    ).bind(
      newChat.id,
      newChat.title,
      newChat.lastMessageAt.toISOString()
    ).run();

    // Actualizar el estado en memoria
    chats.push(newChat);
    
    // Crear un nuevo conjunto de conexiones WebSocket para este chat
    wsConnections.set(newChat.id, new Set<WebSocket>());

    // Notificar a los clientes WebSocket sobre el nuevo chat
    const connections = wsConnections.get(newChat.id);
    if (connections) {
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'chat_created',
            chat: newChat
          }));
        }
      });
    }
    
    return c.json({
      success: true,
      chat: newChat
    });
  } catch (error) {
    console.error('Error al crear el chat:', error);
    return c.json({
      error: 'Error al crear el chat',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, 500);
  }
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

// Assistant configuration endpoint
// Handle chat messages
app.post('/api/chats/:id/messages', async (c) => {
  try {
    const chatId = c.req.param('id');
    const { content, role = 'user' } = await c.req.json();

    // Verificar primero si el chat existe en la base de datos
    const chatExists = await c.env.DB.prepare(
      'SELECT id FROM chats WHERE id = ?'
    ).bind(chatId).first();

    if (!chatExists) {
      return c.json({ error: 'Chat no encontrado' }, 404);
    }

    const newMessage = {
      id: generateId(),
      content,
      role,
      createdAt: new Date()
    };

    // Insertar el nuevo mensaje en la base de datos
    await c.env.DB.prepare(
      'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      newMessage.id,
      chatId,
      newMessage.role,
      newMessage.content,
      newMessage.createdAt.toISOString()
    ).run();

    // Actualizar el timestamp del último mensaje
    await c.env.DB.prepare(
      'UPDATE chats SET last_message_at = ? WHERE id = ?'
    ).bind(newMessage.createdAt.toISOString(), chatId).run();

    // Obtener todos los mensajes actualizados del chat
    const messagesResponse = await c.env.DB.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    ).bind(chatId).all();

    const formattedMessages = messagesResponse.results.map(msg => ({
      id: msg.id,
      chatId: msg.chat_id,
      role: msg.role,
      content: msg.content,
      createdAt: new Date(msg.created_at as string)
    }));

    // Actualizar el chat en memoria
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].messages = formattedMessages as LocalMessage[];
      chats[chatIndex].lastMessageAt = newMessage.createdAt;

      // Notificar a los clientes WebSocket
      const connections = wsConnections.get(chatId) || new Set<WebSocket>();
      connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'chat_updated',
            chatId,
            messages: formattedMessages
          }));
        }
      });
    }

    return c.json({
      success: true,
      message: newMessage,
      messages: formattedMessages,
      chat: chats[chatIndex]
    });
  } catch (error) {
    console.error('Error al procesar el mensaje:', error);
    return c.json({
      error: 'Error al procesar el mensaje',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, 500);
  }
});

app.post('/api/assistant', async (c) => {
  try {
    const { maxSteps: newMaxSteps } = await c.req.json();
    
    // Validate maxSteps
    if (typeof newMaxSteps === 'number' && newMaxSteps > 0) {
      maxSteps = newMaxSteps;
      return c.json({
        success: true,
        config: {
          maxSteps,
          selectedModel
        }
      });
    } else {
      return c.json({
        error: 'Invalid maxSteps value. Must be a positive number.',
        currentConfig: {
          maxSteps,
          selectedModel
        }
      }, 400);
    }
  } catch (error) {
    console.error('Error in /api/assistant:', error);
    return c.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// WebSocket endpoint
app.get('/api/ws', async (c) => {
  if (!c.req.header('upgrade')?.includes('websocket')) {
    return c.text('Expected websocket', 400);
  }

  const { 0: client, 1: server } = new WebSocketPair();

  server.accept();

  // Set up ping interval to keep connection alive
  const pingInterval = setInterval(() => {
    if (server.readyState === WebSocket.OPEN) {
      try {
        server.send(JSON.stringify({ type: 'ping' }));
      } catch (error) {
        console.error('Error sending ping:', error);
        clearInterval(pingInterval);
      }
    } else {
      clearInterval(pingInterval);
    }
  }, 30000); // Send ping every 30 seconds

  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data as string);
      
      // Handle pong response
      if (data.type === 'pong') {
        return;
      }

      if (data.type === 'subscribe' && data.chatId) {
        const connections = wsConnections.get(data.chatId) || new Set<WebSocket>();
        connections.add(server);
        wsConnections.set(data.chatId, connections);

        // Send current chat state
        const chat = chats.find(c => c.id === data.chatId);
        if (chat) {
          server.send(JSON.stringify({
            type: 'chat_selected',
            chat
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      // Send error message to client
      if (server.readyState === WebSocket.OPEN) {
        server.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message'
        }));
      }
    }
  });

  server.addEventListener('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(pingInterval);
  });

  server.addEventListener('close', (event) => {
    clearInterval(pingInterval);
    console.log(`WebSocket closed with code: ${event.code}, clean: ${event.wasClean}`);
    
    // Remove the connection from all chats
    for (const [chatId, connections] of wsConnections.entries()) {
      connections.delete(server);
      if (connections.size === 0) {
        wsConnections.delete(chatId);
      }
    }
  });


  return new Response(null, {
    status: 101,
    webSocket: client
  });
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
interface DurableObjectState {
  storage: DurableObjectStorage;
  id: DurableObjectId;
  waitUntil(promise: Promise<any>): void;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
  acceptWebSocket(ws: WebSocket): void;
  getWebSockets(): WebSocket[];
  setWebSocketAutoResponse(maybeReqResp?: WebSocketRequestResponsePair): void;
  getWebSocketAutoResponse(): WebSocketRequestResponsePair | null;
  getWebSocketAutoResponseTimestamp(ws: WebSocket): Date | null;
  setHibernatableWebSocketEventTimeout(timeoutMs: number): void;
  getHibernatableWebSocketEventTimeout(): number;
  getTags(): string[];
  abort(): void;
}

interface DurableObjectStorage {
  get(key: string): Promise<any>;
  put(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; reverse?: boolean }): Promise<Map<string, any>>;
  deleteAll(): Promise<void>;
  transaction<T>(closure: (txn: DurableObjectStorage) => Promise<T>): Promise<T>;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
  deleteAlarm(): Promise<void>;
  sync(): Promise<void>;
  database(name: string): D1Database;
  sql<T = unknown>(query: string): Promise<T>;
  transactionSync<T>(closure: (txn: DurableObjectStorage) => T): T;
  getCurrentBookmark(): string;
  getBookmarkForTime(timestamp: number): string;
  onNextSessionRestoreBookmark(bookmark: string): void;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStorage {
  get(key: string): Promise<any>;
  put(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string; limit?: number; reverse?: boolean }): Promise<Map<string, any>>;
  deleteAll(): Promise<void>;
  transaction<T>(closure: (txn: DurableObjectStorage) => Promise<T>): Promise<T>;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTime: number | Date): Promise<void>;
  deleteAlarm(): Promise<void>;
  sync(): Promise<void>;
  database(name: string): D1Database;
  sql<T = unknown>(query: string): Promise<T>;
  transactionSync<T>(closure: (txn: DurableObjectStorage) => T): T;
  getCurrentBookmark(): string;
  getBookmarkForTime(timestamp: number): string;
  onNextSessionRestoreBookmark(bookmark: string): void;
}

class SimpleDurableObjectState implements DurableObjectState {
  public storage: DurableObjectStorage;
  public id: DurableObjectId;
  private webSockets: Set<WebSocket>;
  private autoResponse: string | null = null;
  private autoResponseTimestamp: number | null = null;
  private hibernatableWebSocketEventTimeout: number = 0;
  private state: { [key: string]: any } = {};
  private _database: D1Database | null = null;

  constructor(id: DurableObjectId, storage: DurableObjectStorage) {
    this.id = id;
    this.storage = storage;
    this.webSockets = new Set();
  }
  setHibernatableWebSocketEventTimeout(timeoutMs: number): void {
    this.hibernatableWebSocketEventTimeout = timeoutMs;
  }

  getHibernatableWebSocketEventTimeout(): number {
    return this.hibernatableWebSocketEventTimeout;
  }

  getTags(): string[] {
    return [];
  }

  abort(): void { }

  async blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T> {
    try {
      return await callback();
    } catch (error) {
      console.error('Error en blockConcurrencyWhile:', error);
      throw error;
    }
  }

  waitUntil(promise: Promise<any>): void {
    promise.catch(error => {
      console.error('Error en waitUntil:', error);
    });
  }

  getWebSockets(): WebSocket[] {
    return Array.from(this.webSockets);
  }

  acceptWebSocket(ws: WebSocket): void {
    this.webSockets.add(ws);
    ws.addEventListener('close', () => {
      this.webSockets.delete(ws);
    });
  }

  setWebSocketAutoResponse(maybeReqResp?: WebSocketRequestResponsePair): void {
    if (!maybeReqResp) {
      this.autoResponse = null;
      this.autoResponseTimestamp = null;
      return;
    }
    // Parse the request and response strings
    const parsedRequest = JSON.parse(maybeReqResp.request);
    const parsedResponse = JSON.parse(maybeReqResp.response);

    // Convert Request and Response to serializable format
    const serializableReqResp = {
      request: {
        url: parsedRequest.url,
        method: parsedRequest.method,
        headers: parsedRequest.headers
      },
      response: {
        status: parsedResponse.status,
        statusText: parsedResponse.statusText,
        headers: parsedResponse.headers
      }
    };
    this.autoResponse = JSON.stringify(serializableReqResp);
    this.autoResponseTimestamp = Date.now();
  }

  getWebSocketAutoResponse(): WebSocketRequestResponsePair | null {
    if (!this.autoResponse) return null;
    try {
      const serializedData = JSON.parse(this.autoResponse);
      // Return serialized string data
      return {
        request: JSON.stringify(serializedData.request),
        response: JSON.stringify(serializedData.response)
      };
    } catch {
      return null;
    }
  }

  getWebSocketAutoResponseTimestamp(ws: WebSocket): Date | null {
    return this.autoResponseTimestamp ? new Date(this.autoResponseTimestamp) : null;
  }
}

app.get('/agents/chat/default/get-messages', async (c) => {
  try {
    const chatId = c.req.query('chatId');
    let chat = Chat.instance as Chat | null;

    // Verificar si ya existe una instancia de Chat
    if (!chat) {
      // Si no existe instancia, retornar error
      return c.json({
        error: 'Chat instance not initialized',
        details: 'The Chat instance has not been properly initialized.'
      }, 500);
    }
    // if (!chat) {
    //   const state = new DurableObjectState({
    //     id: new DurableObjectId('default-chat'),
    //     storage: new DurableObjectStorage()
    //   });
    //   chat = new Chat(state, { AI: (import.meta as any).env.AI, OPENAI_API_KEY: (import.meta as any).env.OPENAI_API_KEY, GEMINI_API_KEY: (import.meta as any).env.GEMINI_API_KEY });
    //   await chat.initializeDefaultChat();
    // }

    // If no chatId provided, create a new chat
    if (!chatId) {
      const defaultChat = await chat.initializeDefaultChat();
      return c.json({
        success: true,
        messages: [],
        chatId: defaultChat.id
      });
    }

    // Load chats from storage
    const savedChats = await chat.loadChatsFromStorage();
    if (savedChats.length > 0) {
      chats = savedChats;
    }

    // Find specific chat
    const specificChat = chats.find(c => c.id === chatId);
    if (!specificChat) {
      return c.json({
        error: 'Chat not found',
        details: `No chat found with ID: ${chatId}`
      }, 404);
    }

    // Set current chat and messages
    chat.setCurrentChat(chatId);
    chat.messages = specificChat.messages;

    // Validate and format messages
    const messages = specificChat.messages.map(msg => ({
      id: msg.id || generateId(),
      role: msg.role || 'user',
      content: msg.content || '',
      createdAt: new Date(msg.createdAt)
    }));

    return c.json({
      success: true,
      messages: messages
    });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    return c.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
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
  private _messages: ChatMessage[] = [];
  private db: D1Database;

  // Definición de la tabla de mensajes
  private readonly CREATE_MESSAGES_TABLE = `
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
    )
  `;

  private readonly CREATE_CHATS_TABLE = `
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.storage = state.storage;
    this.messages = [];
    this.currentChatId = null;
    
    // Inicialización segura de la base de datos D1
    try {
      if (!env.DB) {
        throw new Error('El binding de la base de datos D1 no está configurado en el entorno');
      }
      this.db = env.DB;
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      throw new Error('Error al inicializar la base de datos. Por favor, verifica la configuración de D1 en wrangler.toml');
    }
    
    // Initialize messages array with proper type checking
    this.messages = Array.isArray(this.messages) ? this.messages : [];

    if (!Chat.instance) {
      Chat.instance = this;
      this.initializeTables().then(() => {
        this.initializeDefaultChat().catch(error => {
          console.error('Error initializing default chat:', error);
        });
      }).catch(error => {
        console.error('Error initializing database tables:', error);
      });
    }
  }

  private async verifyTables(): Promise<boolean> {
    try {
      // Verificar la existencia de la tabla chats
      const chatsExist = await this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='chats'"
      ).first<{ name: string }>();

      // Verificar la existencia de la tabla messages
      const messagesExist = await this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
      ).first<{ name: string }>();

      return Boolean(chatsExist && messagesExist);
    } catch (error) {
      console.error('Error verifying tables:', error);
      return false;
    }
  }

  private async initializeTables() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      // Primero verificar si las tablas ya existen
      const tablesExist = await this.verifyTables();
      if (tablesExist) {
        console.log('Tables already exist, skipping initialization');
        return;
      }

      // Crear la tabla chats primero
      await this.db.prepare(this.CREATE_CHATS_TABLE).run();
      console.log('Chats table created successfully');

      // Verificar que la tabla chats se creó correctamente
      const chatsExist = await this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='chats'"
      ).first<{ name: string }>();
      if (!chatsExist) {
        throw new Error('Failed to create chats table');
      }

      // Crear la tabla messages después de verificar que chats existe
      await this.db.prepare(this.CREATE_MESSAGES_TABLE).run();
      console.log('Messages table created successfully');

      // Verificar que ambas tablas se crearon correctamente
      const finalTablesExist = await this.verifyTables();
      if (!finalTablesExist) {
        throw new Error('Failed to verify table creation');
      }

      console.log('Database tables initialized and verified successfully');
    } catch (error) {
      console.error('Error initializing database tables:', error);
      throw new Error(`Failed to initialize database tables: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async initializeDefaultChat() {
    try {
      // Verificar si ya existe el chat por defecto
      const defaultChatId = '3xytdwIhg9AimViz';
      const existingDefaultChat = await this.db.prepare('SELECT * FROM chats WHERE id = ?')
        .bind(defaultChatId)
        .first<{ id: string; title: string; last_message_at: string }>();
      
      if (!existingDefaultChat) {
        const defaultChat: ChatData = {
          id: defaultChatId,
          title: '¡Bienvenido a tu Asistente Virtual! 🤖',
          messages: [],
          lastMessageAt: new Date()
        };

        // Insertar el chat por defecto en la base de datos
        await this.db.prepare(
          'INSERT INTO chats (id, title, last_message_at) VALUES (?, ?, ?)'
        ).bind(defaultChat.id, defaultChat.title, defaultChat.lastMessageAt.toISOString())
        .run();

        this.currentChatId = defaultChat.id;
        return defaultChat;
      }

      // Si el chat por defecto existe, retornarlo
      this.currentChatId = existingDefaultChat.id;
      return {
        id: existingDefaultChat.id,
        title: existingDefaultChat.title,
        messages: [],
        lastMessageAt: new Date(existingDefaultChat.last_message_at)
      };
    } catch (error) {
      console.error('Error initializing default chat:', error);
      throw error;
    }
  }

  /**
   * Establece el ID del chat actual
   */
  async setCurrentChat(chatId: string) {
    this.currentChatId = chatId;
    // Cargar mensajes del chat seleccionado desde la base de datos
    const messages = await this.db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    ).bind(chatId).all();
    
    // Convertir los resultados al tipo Message
    this.messages = (messages.results || []).map(msg => ({
      id: msg.id as string,
      role: msg.role as 'assistant' | 'system' | 'user' | 'data',
      content: msg.content as string,
      createdAt: new Date(msg.created_at as string)
    }));
  }

  /**
   * Guarda los mensajes en el chat actual y actualiza el estado global
   */
  public async loadChatsFromStorage(): Promise<LocalChatData[]> {
    try {
      // Obtener todos los chats de la base de datos
      const chatsResult = await this.db.prepare('SELECT * FROM chats ORDER BY last_message_at DESC').all();
      
      if (!chatsResult.results || !Array.isArray(chatsResult.results)) {
        return [];
      }

      interface DBChat {
        id: string;
        title: string;
        last_message_at: string;
      }

      interface DBMessage {
        id: string;
        chat_id: string;
        role: string;
        content: string;
        created_at: string;
      }

      // Cargar los mensajes para cada chat
      const chatsWithMessages = await Promise.all(chatsResult.results.map(async (rawChat: Record<string, unknown>) => {
        const chat: DBChat = {
          id: String(rawChat.id || ''),
          title: String(rawChat.title || ''),
          last_message_at: String(rawChat.last_message_at || new Date().toISOString())
        };

        try {
          const messages = await this.db.prepare(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
          ).bind(chat.id).all();

          // Convertir los resultados al formato esperado
          const formattedMessages = (messages.results || []).map((rawMsg: Record<string, unknown>) => {
            const msg: DBMessage = {
              id: String(rawMsg.id || ''),
              chat_id: String(rawMsg.chat_id || ''),
              role: String(rawMsg.role || ''),
              content: String(rawMsg.content || ''),
              created_at: String(rawMsg.created_at || new Date().toISOString())
            };

            return {
              id: msg.id,
              role: (msg.role && ['assistant', 'system', 'user', 'data'].includes(msg.role)) ? 
                msg.role as 'assistant' | 'system' | 'user' | 'data' : 'system',
              content: msg.content,
              createdAt: new Date(msg.created_at)
            };
          });

          return {
            id: chat.id,
            title: chat.title,
            lastMessageAt: new Date(chat.last_message_at),
            messages: formattedMessages
          };
        } catch (error: unknown) {
          console.error(`Error loading messages for chat ${chat.id}:`, error);
          return {
            id: chat.id,
            title: chat.title,
            lastMessageAt: new Date(chat.last_message_at),
            messages: []
          };
        }
      }));

      return chatsWithMessages;
    } catch (error: unknown) {
      console.error('Error loading chats from storage:', error);
      return [];
    }
  }

  private async saveToCurrentChat(messages: ChatMessage[]) {
    if (!Array.isArray(messages)) {
      console.error('Invalid messages array:', messages);
      return;
    }

    if (!this.currentChatId) {
      console.error('No chat selected');
      return;
    }

    try {
      // Update last message timestamp
      await this.db.prepare(
        'UPDATE chats SET last_message_at = ? WHERE id = ?'
      ).bind(new Date().toISOString(), this.currentChatId)
      .run();

      // Get existing message IDs
      const existingMessages = await this.db.prepare(
        'SELECT id FROM messages WHERE chat_id = ?'
      ).bind(this.currentChatId)
      .all<{ id: string }>();
      const existingIds = new Set(existingMessages.results.map(m => m.id));

      // First, ensure the chat exists
      const chatExists = await this.db.prepare(
        'SELECT id FROM chats WHERE id = ?'
      ).bind(this.currentChatId).first<{ id: string }>();

      if (!chatExists) {
        // Create the chat if it doesn't exist
        await this.db.prepare(
          'INSERT INTO chats (id, title, last_message_at) VALUES (?, ?, ?)'
        ).bind(
          this.currentChatId,
          'New Chat',
          new Date().toISOString()
        ).run();
      }

      // Process messages in batches to avoid conflicts
      const processedMessages = messages.map(msg => {
        const createdAt = msg.createdAt instanceof Date ? msg.createdAt : new Date(msg.createdAt || Date.now());
        let messageId = msg.id;
        // Generate new ID if current one exists or is undefined
        while (!messageId || existingIds.has(messageId)) {
          messageId = generateId();
        }
        existingIds.add(messageId);
        return {
          id: messageId,
          chatId: this.currentChatId,
          role: msg.role,
          content: msg.content,
          createdAt: createdAt.toISOString()
        };
      });
      // Insert new messages with unique IDs using state.storage.transaction()
      await this.storage.transaction(async (txn) => {
        for (const msg of processedMessages) {
          await this.db.prepare(
            'INSERT OR IGNORE INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(
            msg.id,
            msg.chatId,
            msg.role,
            msg.content,
            msg.createdAt
          ).run();
        }
      });
    } catch (error) {
      console.error('Error saving messages to database:', error);
      throw error;
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
      // Verificar que existe un chat activo
      if (!this.currentChatId) {
        // Si no hay chat activo, usar el chat por defecto
        const defaultChat = await this.initializeDefaultChat();
        this.currentChatId = defaultChat.id;
      }

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
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second
    let lastError: Error | null = null;
    let response;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const messageParts = this.messages.map(msg => ({ text: msg.content || '' }));
        response = await ai.models.generateContent({
          model: geminiModel,
          contents: [{
            role: 'user',
            parts: [{ text: systemPrompt }, ...messageParts.map(p => ({ text: p.text }))]
          }]
        });
        break; // Success, exit retry loop
      } catch (error) {
        lastError = error as Error;
        if (error instanceof Error && error.message.includes('503')) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          throw error;
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to generate content after retries');
    }

    const message: ChatMessage = {
      id: generateId(),
      role: "assistant",
      content: response.text ?? '',
      createdAt: new Date(),
    };

    // Actualizar los mensajes en memoria
    this._messages = [...this.messages, message].map(msg => ({
      ...msg,
      id: msg.id || generateId(),
      createdAt: msg.createdAt || new Date()
    })) as ChatMessage[];

    // Guardar en la base de datos
    await this.saveMessages(this._messages);

    // Notificar a los clientes WebSocket
    const chatConnections = wsConnections.get(this.currentChatId || '');
    if (chatConnections) {
      const update = {
        type: 'chat_updated',
        chatId: this.currentChatId,
        messages: this._messages
      };
      chatConnections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(update));
        }
      });
    }

    return createDataStreamResponse({
      execute: async (dataStream) => {
        dataStream.write(formatDataStreamPart('text', response.text ?? ''));
        if (lastError) {
          console.log('Request succeeded after retry');
        }
        console.log('Transmisión de Gemini finalizada');

        // Ejecutar callback onFinish con los argumentos necesarios
        onFinish({
          text: response.text ?? '',
          response: {
            id: generateId(),
            timestamp: new Date(),
            modelId: geminiModel,
            messages: this._messages.filter(msg => msg.role === 'assistant').map(msg => ({
              id: msg.id,
              role: 'assistant' as const,
              content: msg.content,
              createdAt: msg.createdAt
            })),
            body: response.text ?? ''
          },
          reasoning: 'Generated response using Gemini model',
          reasoningDetails: [{
            type: 'text',
            text: 'Processed user message and generated AI response'
          }],
          files: [],
          toolCalls: [],
          steps: [],
          finishReason: 'stop',
          sources: [],
          toolResults: [],
          usage: {
            promptTokens: 0,
            completionTokens: 0,
            totalTokens: 0
          },
          warnings: [],
          logprobs: undefined,
          request: {},
          providerMetadata: {},
          experimental_providerMetadata: {}
        });
      }
    });
  }

  private async handleDefaultModelResponse(allTools: any, onFinish: StreamTextOnFinishCallback<ToolSet>) {
    return agentContext.run(this, async () => {
      return createDataStreamResponse({
        execute: async (dataStream) => {
          const processedMessages = await processToolCalls({
            messages: this._messages.filter(msg => msg.role === 'assistant').map(msg => ({
              id: msg.id,
              role: 'assistant' as const,
              content: msg.content,
              createdAt: msg.createdAt
            })),
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
  async getChatMessages(chatId: string) {
    try {
      const messages = await this.db.prepare(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
      ).bind(chatId).all<ChatMessage>();
      return messages.results;
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  // async saveMessages(messages: ChatMessage[]) {
  //   if (!Array.isArray(messages)) {
  //     console.error('Invalid messages array:', messages);
  //     return;
  //   }

  //   // Store messages in memory
  //   this._messages = messages.map(msg => {
  //       if (msg.createdAt) return msg;
  //       return {
  //       ...msg,
  //         createdAt: new Date()
  //       };
  //     }) as ChatMessage[];

  //   // Save to D1 database
  //   const validatedMessages = messages.map(msg => ({
  //     id: msg.id || generateId(),
  //     role: msg.role,
  //     content: msg.content,
  //     createdAt: msg.createdAt || new Date()
  //   })) as ChatMessage[];
  //   await this.saveToCurrentChat(validatedMessages);

  //   // Only emit event in browser environment
  //   if (typeof window !== 'undefined') {
  //     window.dispatchEvent(new CustomEvent('messagesUpdated', {
  //       detail: { messages }
  //     }));
  //   }
  // }

  async executeTask(description: string, task: Schedule<string>) {
    const message: ChatMessage = {
      id: generateId(),
      role: "user",
      content: `Running scheduled task: ${description}`,
      createdAt: new Date(),
    };
    const existingMessages = this.messages.map(msg => ({
      ...msg,
      id: msg.id || generateId(),
      createdAt: msg.createdAt || new Date()
    })) as ChatMessage[];
    await this.saveMessages([...existingMessages, message]);
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
  async fetch_with_context(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Manejar rutas específicas
    if (pathname.startsWith('/agents/chat/default/get-messages')) {
      const chatId = url.searchParams.get('chatId');
      let chat = Chat.instance;

      if (!chat) {
        return new Response(JSON.stringify({
          error: 'Chat instance not initialized',
          details: 'The Chat instance has not been properly initialized.'
        }), { status: 500 });
      }

      if (!chatId) {
        const defaultChat = await chat.initializeDefaultChat();
        return new Response(JSON.stringify({
          success: true,
          messages: [],
          chatId: defaultChat.id
        }));
      }

      const savedChats = await chat.loadChatsFromStorage();
      if (savedChats.length > 0) {
        chats = savedChats;
      }

      const specificChat = chats.find(c => c.id === chatId);
      if (!specificChat) {
        return new Response(JSON.stringify({
          error: 'Chat not found',
          details: `No chat found with ID: ${chatId}`
        }), { status: 404 });
      }

      chat.setCurrentChat(chatId);
      chat.messages = specificChat.messages;

      const messages = specificChat.messages.map(msg => ({
        id: msg.id || generateId(),
        role: msg.role || 'user',
        content: msg.content || '',
        createdAt: new Date(msg.createdAt)
      }));

      return new Response(JSON.stringify({
        success: true,
        messages: messages
      }));
    }

    // Manejar otras rutas
    return app.fetch(request, env, ctx);
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