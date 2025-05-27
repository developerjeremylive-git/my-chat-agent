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
const DEFAULT_MAX_STEPS = 1;
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
  MODEL_CONFIG: KVNamespace; // Add KV namespace binding
}

const app = new Hono<{ Bindings: Env }>();
const workersai = createWorkersAI({ binding: env.AI });

// WebSocket connections store (in-memory, request-specific)
const wsConnections = new Map<string, Set<WebSocket>>();

// Clean up dead WebSocket connections
function cleanupConnections() {
  for (const [chatId, connections] of wsConnections.entries()) {
    for (const ws of connections) {
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        connections.delete(ws);
      }
    }
    if (connections.size === 0) {
      wsConnections.delete(chatId);
    }
  }
}

// Clean up connections every 5 minutes
// setInterval(cleanupConnections, 5 * 60 * 1000);

// Default values
const DEFAULT_MODEL = 'gemini-2.0-flash';
const DEFAULT_SYSTEM_PROMPT = 'Eres un asistente útil que puede realizar varias tareas...';

// Helper function to get the selected model from KV
async function getSelectedModel(env: Env): Promise<string> {
  try {
    return await env.MODEL_CONFIG.get('selectedModel') || DEFAULT_MODEL;
  } catch (error) {
    console.error('Error getting selected model from KV:', error);
    return DEFAULT_MODEL;
  }
}

// Helper function to get the system prompt from KV
async function getSystemPrompt(env: Env): Promise<string> {
  try {
    const prompt = await env.MODEL_CONFIG.get('systemPrompt');
    return prompt || DEFAULT_SYSTEM_PROMPT;
  } catch (error) {
    console.error('Error getting system prompt from KV:', error);
    return DEFAULT_SYSTEM_PROMPT;
  }
}

// Helper function to get the max steps from KV
async function getMaxSteps(env: Env): Promise<number> {
  try {
    const steps = await env.MODEL_CONFIG.get('maxSteps');
    maxSteps = steps ? parseInt(steps, 10) : DEFAULT_MAX_STEPS;
    return steps ? parseInt(steps, 10) : DEFAULT_MAX_STEPS;
  } catch (error) {
    console.error('Error getting max steps from KV:', error);
    return DEFAULT_MAX_STEPS;
  }
}

// Helper function to set the selected model in KV
async function setSelectedModel(env: Env, model: string): Promise<void> {
  try {
    await env.MODEL_CONFIG.put('selectedModel', model);
    selectedModel = model;
    if (model.startsWith('gemini')) {
      geminiModel = model;
    }
  } catch (error) {
    console.error('Error setting selected model in KV:', error);
    throw error;
  }
}

// Helper function to set the system prompt in KV
async function setSystemPrompt(env: Env, prompt: string): Promise<void> {
  try {
    await env.MODEL_CONFIG.put('systemPrompt', prompt);
  } catch (error) {
    console.error('Error setting system prompt in KV:', error);
    throw error;
  }
}

// Helper function to set the max steps in KV
async function setMaxSteps(env: Env, steps: number): Promise<void> {
  try {
    await env.MODEL_CONFIG.put('maxSteps', steps.toString());
  } catch (error) {
    console.error('Error setting max steps in KV:', error);
    throw error;
  }
}

// Variables globales para almacenar el modelo seleccionado, prompt del sistema y configuración
let selectedModel = DEFAULT_MODEL;
let geminiModel = DEFAULT_MODEL;
let systemPrompt = DEFAULT_SYSTEM_PROMPT;
let maxSteps = DEFAULT_MAX_STEPS;
// Track if user has agreed to llama model terms - used in model selection validation

// let temperature = DEFAULT_TEMPERATURE;
// let maxTokens = DEFAULT_MAX_TOKENS;
// let topP = DEFAULT_TOP_P;
// let topK = DEFAULT_TOP_K;
// let frequencyPenalty = DEFAULT_FREQUENCY_PENALTY;
// let presencePenalty = DEFAULT_PRESENCE_PENALTY;
// let seed = DEFAULT_SEED;

// Endpoint para obtener la configuración actual
app.get('/api/config', async (c) => {
  try {
    const [model, prompt, steps] = await Promise.all([
      getSelectedModel(c.env),
      getSystemPrompt(c.env),
      getMaxSteps(c.env)
    ]);

    return c.json({
      success: true,
      config: {
        selectedModel: model,
        systemPrompt: prompt,
        maxSteps: steps
      }
    });
  } catch (error) {
    console.error('Error getting assistant config:', error);
    return c.json({
      success: false,
      error: 'Failed to get assistant configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint para obtener el prompt del sistema actual
app.get('/api/system-prompt', async (c) => {
  try {
    const prompt = await getSystemPrompt(c.env);
    return c.json({ 
      success: true, 
      prompt 
    });
  } catch (error) {
    console.error('Error getting system prompt:', error);
    return c.json({
      success: false,
      error: 'Failed to get system prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint para actualizar el prompt del sistema
app.post('/api/system-prompt', async (c) => {
  try {
    const { prompt } = await c.req.json();
    if (!prompt || typeof prompt !== 'string') {
      return c.json({
        success: false,
        error: 'Prompt is required and must be a string'
      }, 400);
    }
    
    await setSystemPrompt(c.env, prompt);
    systemPrompt = prompt;
    
    return c.json({ 
      success: true, 
      prompt: systemPrompt 
    });
  } catch (error) {
    console.error('Error updating system prompt:', error);
    return c.json({
      success: false,
      error: 'Failed to update system prompt',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint para obtener el número máximo de pasos
app.get('/api/max-steps', async (c) => {
  try {
    const steps = await getMaxSteps(c.env);
    return c.json({ 
      success: true, 
      maxSteps: steps 
    });
  } catch (error) {
    console.error('Error getting max steps:', error);
    return c.json({
      success: false,
      error: 'Failed to get max steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint para actualizar el número máximo de pasos
app.post('/api/max-steps', async (c) => {
  try {
    const { maxSteps: newMaxSteps } = await c.req.json();
    
    if (typeof newMaxSteps !== 'number' || newMaxSteps <= 0) {
      return c.json({
        success: false,
        error: 'maxSteps must be a positive number'
      }, 400);
    }
    
    await setMaxSteps(c.env, newMaxSteps);
    maxSteps = newMaxSteps;
    
    return c.json({ 
      success: true, 
      maxSteps 
    });
  } catch (error) {
    console.error('Error updating max steps:', error);
    return c.json({
      success: false,
      error: 'Failed to update max steps',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Endpoint to update the selected model
app.post('/api/model', async (c) => {
  try {
    const { modelTemp } = await c.req.json();

    if (!modelTemp) {
      return c.json({ error: 'Model name is required' }, 400);
    }

    // Update the selected model in KV store
    await setSelectedModel(c.env, modelTemp);

    // Update in-memory cache
    selectedModel = modelTemp;

    // If it's a Gemini model, also update the Gemini-specific model
    if (modelTemp.startsWith('gemini')) {
      geminiModel = modelTemp;
    }

    // Return success response
    return c.json({ success: true, model: modelTemp });
  } catch (error) {
    console.error('Error updating model:', error);
    return c.json({ error: 'Failed to update model' }, 500);
  }
});

// Endpoint to get the current selected model
app.get('/api/model', async (c) => {
  try {
    const currentModel = await getSelectedModel(c.env);
    return c.json({ model: currentModel });
  } catch (error) {
    console.error('Error getting current model:', error);
    return c.json({ error: 'Failed to get current model' }, 500);
  }
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

    // Notify all active WebSocket connections about the chat selection
    if (chatId) {
      const chatConnections = wsConnections.get(chatId) || new Set<WebSocket>();
      const deadConnections: WebSocket[] = [];
      
      // Prepare the update message
      const update = {
        type: 'chat_selected',
        chat: chatWithMessages
      };

      // Send update to all connections in this chat room
      chatConnections.forEach(ws => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(update));
          } else {
            deadConnections.push(ws);
          }
        } catch (error) {
          console.error('Error notifying WebSocket client:', error);
          deadConnections.push(ws);
        }
      });

      // Clean up dead connections
      deadConnections.forEach(ws => chatConnections.delete(ws));
      
      // Update the connections map
      if (chatConnections.size > 0) {
        wsConnections.set(chatId, chatConnections);
      } else {
        wsConnections.delete(chatId);
      }
    }

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

    // Notificar a los clientes WebSocket sobre el nuevo chat
    const chatConnections = wsConnections.get('global') || new Set<WebSocket>();
    const deadConnections: WebSocket[] = [];
    
    // Prepare the new chat notification
    const update = {
      type: 'chat_created',
      chat: newChat
    };

    // Send update to all connections in the global room
    chatConnections.forEach(ws => {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(update));
        } else {
          deadConnections.push(ws);
        }
      } catch (error) {
        console.error('Error notifying WebSocket client:', error);
        deadConnections.push(ws);
      }
    });

    // Clean up dead connections
    deadConnections.forEach(ws => chatConnections.delete(ws));
    
    // Update the connections map if there are still active connections
    if (chatConnections.size > 0) {
      wsConnections.set('global', chatConnections);
    } else {
      wsConnections.delete('global');
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
      const chatConnections = wsConnections.get(chatId) || new Set<WebSocket>();
      const deadConnections: WebSocket[] = [];
      
      // Prepare the update message
      const update = {
        type: 'chat_updated',
        chatId,
        messages: formattedMessages
      };

      // Send update to all connections in this chat room
      chatConnections.forEach(ws => {
        try {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(update));
          } else {
            deadConnections.push(ws);
          }
        } catch (error) {
          console.error('Error notifying WebSocket client:', error);
          deadConnections.push(ws);
        }
      });

      // Clean up dead connections
      deadConnections.forEach(ws => chatConnections.delete(ws));
      
      // Update the connections map if there are still active connections
      if (chatConnections.size > 0) {
        wsConnections.set(chatId, chatConnections);
      } else {
        wsConnections.delete(chatId);
      }
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

// Endpoint para actualizar el modelo
// app.post('/api/model', async (c) => {
//   try {
//     const { modelTemp } = await c.req.json();
//     selectedModel = modelTemp;
//     if (selectedModel === 'gemini-2.0-flash') {
//       geminiModel = 'gemini-2.0-flash';
//     } else {
//       model = workersai(selectedModel);
//     }
//     return c.json({ success: true, model: selectedModel });
//   } catch (error) {
//     console.error('Error in /api/assistant:', error);
//     return c.json({
//       error: 'Internal server error',
//       details: error instanceof Error ? error.message : 'Unknown error'
//     }, 500);
//   }
// });
app.post('/api/assistant', async (c) => {
  try {
    const { maxStepsTemp: newMaxSteps, prompt: newPrompt, modelTemp: newModel } = await c.req.json();
    await setSelectedModel(c.env, newModel);
    await setSystemPrompt(c.env, newPrompt);
    
    selectedModel = newModel;
    systemPrompt = newPrompt;
    // Validate maxSteps
    if (typeof newMaxSteps === 'number' && newMaxSteps > 0 && newMaxSteps < 11) {
      await setMaxSteps(c.env, newMaxSteps);
      maxSteps = newMaxSteps;
      return c.json({
        success: true,
        config: {
          selectedModel,
          systemPrompt,
          maxSteps,
          model
        }
      });
    } else {
      return c.json({
        error: 'Invalid maxSteps value. Must be a positive number.',
        currentConfig: {
          selectedModel,
          systemPrompt,
          maxSteps,
          model
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
  const upgradeHeader = c.req.header('upgrade');
  if (!upgradeHeader || !upgradeHeader.includes('websocket')) {
    return c.text('Expected websocket', 400);
  }
  
  const connectionId = c.req.header('cf-connecting-ip') || `conn-${Date.now()}`;

  const { 0: client, 1: server } = new WebSocketPair();
  
  // Accept the WebSocket connection
  server.accept();
  
  // Add this connection to the global room by default
  const globalConnections = wsConnections.get('global') || new Set<WebSocket>();
  globalConnections.add(server);
  wsConnections.set('global', globalConnections);
  
  // Handle connection close
  const handleClose = () => {
    // Remove from all rooms
    for (const [room, connections] of wsConnections.entries()) {
      if (connections.has(server)) {
        connections.delete(server);
        if (connections.size === 0) {
          wsConnections.delete(room);
        } else {
          wsConnections.set(room, connections);
        }
      }
    }
  };
  
  // Handle errors
  const handleError = (error: any) => {
    console.error('WebSocket error:', error);
    handleClose();
  };
  
  server.addEventListener('close', handleClose);
  server.addEventListener('error', handleError);

  server.addEventListener('message', async (event) => {
    try {
      const data = JSON.parse(event.data as string);

      // Handle pong response
      if (data.type === 'pong') {
        return;
      }

      if (data.type === 'subscribe' && data.chatId) {
        // The connection is already stored in activeConnections with the connectionId
        // We can use this to associate the chatId with this connection if needed
        
        // Send current chat state if the chat exists
        try {
          const chat = await c.env.DB.prepare(
            'SELECT * FROM chats WHERE id = ?'
          ).bind(data.chatId).first();
          
          if (chat) {
            const messages = await c.env.DB.prepare(
              'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
            ).bind(data.chatId).all();
            
            const chatWithMessages = {
              ...chat,
              messages: messages.results || []
            };
            
            if (server.readyState === WebSocket.OPEN) {
              server.send(JSON.stringify({
                type: 'chat_selected',
                chat: chatWithMessages
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching chat for WebSocket:', error);
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

  // Handle WebSocket errors (already handled by the global error handler)
  server.addEventListener('error', handleError);

  // Handle WebSocket close
  server.addEventListener('close', (event) => {
    console.log(`WebSocket closed with code: ${event.code}, clean: ${event.wasClean}`);
    handleClose();
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
// const getModel = () => workersai(selectedModel);

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
// Initialize model globally but it will be updated when /api/model is called
// let model = getModel();
let model = workersai("@cf/deepseek-ai/deepseek-r1-distill-qwen-32b");
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


export const agentContext = new AsyncLocalStorage<Chat>();
/**
 * Chat Agent implementation that handles real-time AI chat interactions
 */
export class Chat extends AIChatAgent<Env> {
  private _stepCounter: number = 0;
  currentChatId: string | null = null;
  private currentUserId: string | null = null; // ID del usuario actualmente autenticado
  public static instance: Chat | null = null;
  public storage!: DurableObjectStorage;
  private _messages: ChatMessage[] = [];
  private db: D1Database;

  // ... rest of the code remains the same ...
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

  private readonly CREATE_STEP_COUNTERS_TABLE = `
    CREATE TABLE IF NOT EXISTS step_counters (
    user_id TEXT NOT NULL,
      chat_id TEXT NOT NULL,
    counter INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, chat_id),
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

      // Verificar la existencia de la tabla step_counters
      const stepCountersExist = await this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='step_counters'"
      ).first<{ name: string }>();

      return Boolean(chatsExist && messagesExist && stepCountersExist);
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

      // Crear la tabla step_counters
      await this.db.prepare(this.CREATE_STEP_COUNTERS_TABLE).run();
      console.log('Step counters table created successfully');

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
      // Obtener el modelo actual desde KV
      const currentModel = await getSelectedModel(this.env);

      // Verificar que existe un chat activo
      if (!this.currentChatId) {
        // Si no hay chat activo, usar el chat por defecto
        const defaultChat = await this.initializeDefaultChat();
        this.currentChatId = defaultChat.id;
      }

      const allTools = { ...tools };

      // Manejar la generación de respuesta según el modelo seleccionado
      if (currentModel === "gemini-2.0-flash") {
        return await this.handleGeminiResponse(onFinish);
      } else {
        // return await this.handleDefaultModelResponse(allTools, onFinish);
        // Create a streaming response that handles both text and tool outputs
        return agentContext.run(this, async () => {
          const dataStreamResponse = createDataStreamResponse({
            execute: async (dataStream) => {

              // Asegurarnos de que tenemos un chat activo
              if (!this.currentChatId) {
                const defaultChat = await this.initializeDefaultChat();
                this.currentChatId = defaultChat.id;
                console.log('Chat ID establecido a:', this.currentChatId);
              }

              const messageResponse: ChatMessage = {
                id: generateId(), // Generar un nuevo ID único para el mensaje
                role: "assistant",
                content: this.messages[this.messages.length - 1].content ?? '',
                createdAt: new Date(),
              };

              // Actualizar los mensajes en memoria asegurando IDs únicos
              this._messages = [...this.messages, messageResponse].map(msg => ({
                ...msg,
                id: msg.id || generateId(), // Asegurar que cada mensaje tenga un ID único
                role: msg.role || 'assistant',
                content: msg.content || '',
                createdAt: msg.createdAt || new Date(),
              })) as ChatMessage[];

              // Guardar en la base de datos usando transacción
              try {
                await this.storage.transaction(async (txn) => {
                  await this.saveMessagesD1(this._messages);
                });
              } catch (error) {
                console.error('Error al guardar mensajes:', error);
                throw new Error('Error al persistir los mensajes');
              }

              // Process any pending tool calls from previous messages
              // This handles human-in-the-loop confirmations for tools
              const processedMessages = await processToolCalls({
                messages: this.messages,
                dataStream,
                tools: allTools,
                executions,
              });

              // Send license agreement for Llama models
              const modelStr = String(model);
              if (modelStr && modelStr.indexOf('qwen') !== -1 || modelStr.indexOf('llama-3.2-11b-vision-instruct') !== -1) {
                try {
                  await streamText({
                    model,
                    messages: [{ role: 'user', content: 'agree' }],
                  });
                } catch (error) {
                  console.warn('License agreement error:', error);
                  // Continue anyway as it might have worked
                }
              }

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
    const maxSteps = await getMaxSteps(this.env);
    const systemPrompt = await getSystemPrompt(this.env);

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY no está configurado en las variables de entorno');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    // let lastError: Error | null = null;
    // let response;
    // let currentCounter = 0;
    // let success = false;

    // try {
    //   const messageParts = this.messages.map(msg => ({ text: msg.content || '' }));
    //   response = await ai.models.generateContent({
    //     model: geminiModel,
    //     contents: [{
    //       role: 'user',
    //       parts: [{ text: systemPrompt }, ...messageParts.map(p => ({ text: p.text }))]
    //     }]
    //   });
    //   // break; // Success, exit retry loop
    // } catch (error) {
    //   lastError = error as Error;
    //   console.log(error);
    // }





    // try {
    //   await this.storage.transaction(async (txn) => {
    //     // Ensure we have valid IDs
    //     const userId = this.currentUserId || 'default';
    //     if (!this.currentChatId) {
    //       throw new Error('Chat ID is required for step counter');
    //     }

    //     // Get current counter with error handling
    //     const result = await this.db
    //       .prepare('SELECT counter FROM step_counters WHERE user_id = ? AND chat_id = ?')
    //       .bind(userId, this.currentChatId)
    //       .first<{ counter: number }>();

    //     if (!result) {
    //       // If no record exists, INSERT new counter
    //       const insertResult = await this.db
    //         .prepare(`
    //           INSERT INTO step_counters (user_id, chat_id, counter, updated_at)
    //           VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    //         `)
    //         .bind(userId, this.currentChatId, 1)
    //         .run();
    //       currentCounter = 1;
    //       success = insertResult?.success || false;
    //     } else {
    //       // If record exists, UPDATE counter
    //       currentCounter = (result.counter ?? 0) + 1;
    //       const updateResult = await this.db
    //         .prepare(`
    //           UPDATE step_counters 
    //           SET counter = ?, updated_at = CURRENT_TIMESTAMP
    //           WHERE user_id = ? AND chat_id = ?
    //         `)
    //         .bind(currentCounter, userId, this.currentChatId)
    //         .run();
    //       success = updateResult?.success || false;
    //     }
    //   });
    // } catch (error) {
    //   console.error('Error al actualizar el contador:', error);
    // }

    // if (currentCounter <= maxSteps) {
    //   return;
    // }



    // Actualizar los mensajes en memoria y guardar en la base de datos
    // try {
    //   await this.saveMessages(this._messages);
    // } catch (error) {
    //   console.error('Error al actualizar mensajes:', error);
    // }



    // if (currentCounter !== 0 && currentCounter <= maxSteps) {
    // await this.saveMessages(this._messages);
    // }

    // const existingMessages = this.messages.map(msg => ({
    //   ...msg,
    //   id: msg.id,
    //   createdAt: msg.createdAt || new Date()    // })) as ChatMessage[];
    // await this.saveMessages([...existingMessages, messageResponse]);
    // console.log('Mensajes guardados exitosamente en la base de datos');

    // await this.saveMessages([
    //   ...this.messages,
    //   {
    //     id: generateId(),
    //     role: 'assistant',
    //     content: response.text ?? '',
    //     createdAt: new Date(),
    //   },
    // ]);

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

            // Asegurarnos de que tenemos un chat activo
            if (!this.currentChatId) {
              const defaultChat = await this.initializeDefaultChat();
              this.currentChatId = defaultChat.id;
              console.log('Chat ID establecido a:', this.currentChatId);
            }

            // Actualizar los mensajes en memoria asegurando IDs únicos
            this._messages = [...this.messages, messageResponse].map(msg => ({
              ...msg,
              id: msg.id || generateId(), // Asegurar que cada mensaje tenga un ID único
              role: msg.role || 'assistant',
              content: msg.content || '',
              createdAt: msg.createdAt || new Date(),
            })) as ChatMessage[];

            // Guardar en la base de datos usando transacción
            try {
              // Guardar en la base de datos usando transacción
              await this.storage.transaction(async (txn) => {
                await this.saveMessagesD1(this._messages);
              });

            } catch (error) {
              console.error('Error al guardar mensajes:', error);
            }

            // Enviar la respuesta al stream para actualizar la UI
            dataStream.write(formatDataStreamPart('text', `### Respuesta ${currentStep + 1} de ${maxSteps}

> ${response.text}
`));

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
        // // dataStream.write(formatDataStreamPart('text', response.text ?? ''));
        // if (lastError) {
        //   console.log('Request succeeded after retry');
        // }
        console.log('Transmisión de Gemini finalizada');
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

  async saveMessagesD1(messages: ChatMessage[]) {
    if (!Array.isArray(messages)) {
      console.error('Invalid messages array:', messages);
      return;
    }

    // Store messages in memory
    this._messages = messages.map(msg => {
      if (msg.createdAt) return msg;
      return {
        ...msg,
        createdAt: new Date()
      };
    }) as ChatMessage[];

    // Save to D1 database
    const validatedMessages = messages.map(msg => ({
      id: msg.id || generateId(),
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt || new Date()
    })) as ChatMessage[];

    // Guardar mensajes en la base de datos D1
    // if (this.currentChatId && this.db) {
    //   try {
    //     // Insertar cada mensaje en la tabla messages
    //     for (const msg of validatedMessages) {
    //       await this.db.prepare(
    //         'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    //       ).bind(
    //         msg.id,
    //         this.currentChatId,
    //         msg.role,
    //         msg.content,
    //         msg.createdAt.toISOString()
    //       ).run();
    //     }

    //     // Actualizar la fecha del último mensaje en el chat
    //     await this.db.prepare(
    //       'UPDATE chats SET last_message_at = ? WHERE id = ?'
    //     ).bind(
    //       new Date().toISOString(),
    //       this.currentChatId
    //     ).run();

    //     console.log('Mensajes guardados exitosamente en la base de datos');
    //   } catch (error) {
    //     console.error('Error al guardar mensajes en la base de datos:', error);
    //     throw new Error('Error al guardar mensajes en la base de datos');
    //   }
    // }

    await this.saveToCurrentChat(validatedMessages);

    // Only emit event in browser environment
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messagesUpdated', {
        detail: { messages }
      }));
    }
  }

  async executeTask(description: string, task: Schedule<string>) {
    // Asegurarnos de que tenemos un chat activo antes de validar mensajes
    if (!this.currentChatId) {
      const defaultChat = await this.initializeDefaultChat();
      this.currentChatId = defaultChat.id;
      console.log('Chat ID establecido en executeTask:', this.currentChatId);
    }
    const message: ChatMessage = {
      id: generateId(),
      role: "user",
      content: `Running scheduled task: ${description}`,
      createdAt: new Date(),
    };
    const existingMessages = this.messages.map(msg => ({
      ...msg,
      id: msg.id,
      createdAt: msg.createdAt || new Date()
    })) as ChatMessage[];
    await this.saveMessages([...existingMessages, message]);

    const validatedMessages = this.messages.map(msg => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt || new Date(),
    })) as ChatMessage[];
    // Guardar mensajes en la base de datos D1
    if (this.currentChatId && this.db) {
      try {
        // Insertar cada mensaje en la tabla messages
        for (const msg of validatedMessages) {
          await this.db.prepare(
            'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(
            msg.id,
            this.currentChatId,
            msg.role,
            msg.content,
            msg.createdAt.toISOString()
          ).run();
        }

        // Actualizar la fecha del último mensaje en el chat
        await this.db.prepare(
          'UPDATE chats SET last_message_at = ? WHERE id = ?'
        ).bind(
          new Date().toISOString(),
          this.currentChatId
        ).run();

        console.log('Mensajes guardados exitosamente en la base de datos');
      } catch (error) {
        console.error('Error al guardar mensajes en la base de datos:', error);
        throw new Error('Error al guardar mensajes en la base de datos');
      }
    }
    // await this.saveToCurrentChat(validatedMessages);
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