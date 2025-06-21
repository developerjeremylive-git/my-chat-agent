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
let chats: LocalChatData[] = [];

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
const chatRooms = new Map<string, Set<WebSocket>>();

// Clean up dead WebSocket connections
function cleanupConnections(roomId: string = 'global') {
  if (!chatRooms.has(roomId)) return;

  const room = chatRooms.get(roomId)!;
  const deadConnections: WebSocket[] = [];

  room.forEach(ws => {
    if (ws.readyState !== WebSocket.OPEN) {
      deadConnections.push(ws);
    }
  });

  deadConnections.forEach(ws => {
    room.delete(ws);
  });

  if (room.size === 0) {
    chatRooms.delete(roomId);
  }
}

// Helper function to broadcast to a room
function broadcastToRoom(roomId: string, message: any) {
  if (!chatRooms.has(roomId)) return;

  const room = chatRooms.get(roomId)!;
  const deadConnections: WebSocket[] = [];
  const messageStr = JSON.stringify(message);

  room.forEach(ws => {
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      } else {
        deadConnections.push(ws);
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      deadConnections.push(ws);
    }
  });

  // Clean up dead connections
  deadConnections.forEach(ws => room.delete(ws));

  if (room.size === 0) {
    chatRooms.delete(roomId);
  }
}

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
// Workspace API Endpoints
// Get all workspaces
app.get('/api/workspaces', async (c) => {
  try {
    const result = await c.env.DB.prepare(
      'SELECT * FROM workspaces ORDER BY updated_at DESC'
    ).all();

    if (!result || !result.results) {
      return c.json({ success: true, data: [] });
    }

    return c.json({ success: true, data: result.results });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch workspaces',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Create a new workspace
app.post('/api/workspaces', async (c) => {
  try {
    const { title, emoji, emoji_color, description, instructions } = await c.req.json();
    
    if (!title || !emoji) {
      return c.json({ 
        success: false, 
        error: 'Title and emoji are required' 
      }, 400);
    }

    const id = generateId();
    const now = new Date().toISOString();
    
    await c.env.DB.prepare(
      'INSERT INTO workspaces (id, title, emoji, emoji_color, description, instructions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(
      id, 
      title, 
      emoji, 
      emoji_color || null, 
      description || null, 
      instructions || null,
      now,
      now
    ).run();

    const newWorkspace = {
      id,
      title,
      emoji,
      emoji_color: emoji_color || null,
      description: description || null,
      instructions: instructions || null,
      created_at: now,
      updated_at: now
    };

    return c.json({ success: true, data: newWorkspace }, 201);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create workspace',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update a workspace
app.put('/api/workspaces/:id', async (c) => {
  try {
    const workspaceId = c.req.param('id');
    const { title, emoji, emoji_color, description, instructions } = await c.req.json();
    
    if (!workspaceId) {
      return c.json({ success: false, error: 'Workspace ID is required' }, 400);
    }

    // Check if workspace exists
    const existingWorkspace = await c.env.DB.prepare(
      'SELECT * FROM workspaces WHERE id = ?'
    ).bind(workspaceId).first();

    if (!existingWorkspace) {
      return c.json({ success: false, error: 'Workspace not found in DB' }, 404);
    }

    const now = new Date().toISOString();
    
    await c.env.DB.prepare(
      'UPDATE workspaces SET title = ?, emoji = ?, emoji_color = ?, description = ?, instructions = ?, updated_at = ? WHERE id = ?'
    ).bind(
      title || existingWorkspace.title,
      emoji || existingWorkspace.emoji,
      emoji_color !== undefined ? emoji_color : existingWorkspace.emoji_color,
      description !== undefined ? description : existingWorkspace.description,
      instructions !== undefined ? instructions : existingWorkspace.instructions,
      now,
      workspaceId
    ).run();

    const updatedWorkspace = {
      ...existingWorkspace,
      title: title || existingWorkspace.title,
      emoji: emoji || existingWorkspace.emoji,
      emoji_color: emoji_color !== undefined ? emoji_color : existingWorkspace.emoji_color,
      description: description !== undefined ? description : existingWorkspace.description,
      instructions: instructions !== undefined ? instructions : existingWorkspace.instructions,
      updated_at: now
    };

    return c.json({ success: true, data: updatedWorkspace });
  } catch (error) {
    console.error('Error updating workspace:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update workspace',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Delete a workspace
app.delete('/api/workspaces/:id', async (c) => {
  try {
    const workspaceId = c.req.param('id');
    
    if (!workspaceId) {
      return c.json({ success: false, error: 'Workspace ID is required' }, 400);
    }

    // Check if workspace exists
    const existingWorkspace = await c.env.DB.prepare(
      'SELECT * FROM workspaces WHERE id = ?'
    ).bind(workspaceId).first();

    if (!existingWorkspace) {
      return c.json({ success: false, error: 'Workspace not found in DB' }, 404);
    }

    // Start a transaction to ensure data consistency
    await c.env.DB.batch([
      // First, update chats to remove the workspace reference
      c.env.DB.prepare('UPDATE chats SET workspace_id = NULL WHERE workspace_id = ?').bind(workspaceId),
      // Then delete the workspace
      c.env.DB.prepare('DELETE FROM workspaces WHERE id = ?').bind(workspaceId)
    ]);

    return c.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (error) {
    console.error('Error deleting workspace:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to delete workspace',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Chat API Endpoints
// Get all chats or filter by workspace_id if provided
app.get('/api/chats', async (c) => {
  try {
    const workspaceId = c.req.query('workspaceId');
    let query = 'SELECT * FROM chats';
    let params: any[] = [];

    if (workspaceId) {
      query += ' WHERE workspace_id = ?';
      params.push(workspaceId);
    }
    
    query += ' ORDER BY last_message_at DESC';
    
    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all();

    if (!result || !result.results) {
      return c.json({ success: true, data: [] });
    }

    // Format the chats with proper date handling
    const formattedChats = result.results.map((chat: any) => ({
      id: chat.id,
      title: chat.title,
      workspaceId: chat.workspace_id || null,
      lastMessageAt: chat.last_message_at ? new Date(chat.last_message_at).toISOString() : new Date().toISOString(),
      messages: []
    }));

    return c.json({ success: true, data: formattedChats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch chats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
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

    // Get workspace info if workspace_id exists
    let workspace = null;
    if (chat.workspace_id) {
      workspace = await c.env.DB.prepare(
        'SELECT id, title, instructions FROM workspaces WHERE id = ?'
      ).bind(chat.workspace_id).first();
    }

    // Combine chat data with messages and workspace info
    const chatWithMessages = {
      ...chat,
      messages: messages.results || [],
      workspace: workspace ? {
        id: workspace.id,
        title: workspace.title,
        instructions: workspace.instructions
      } : null
    };

    // Notify all active WebSocket connections about the chat selection
    if (chatId) {
      broadcastToRoom(chatId, {
        type: 'chat_selected',
        chat: chatWithMessages
      });
    }

    // Obtener o establecer el chat actual usando KV
    if (chatId) {
      // Si se proporciona un chatId, guardarlo en KV
      await c.env.MODEL_CONFIG.put('current_chat_id', chatId);
    } else {
      // Si no hay chatId, intentar obtener el último usado o usar uno por defecto
      const storedChatId = await c.env.MODEL_CONFIG.get('current_chat_id');
      if (!storedChatId) {
        // Si no hay chat guardado, crear uno nuevo
        const newChatId = `chat_${Date.now()}`;
        await c.env.MODEL_CONFIG.put('current_chat_id', newChatId);
        // Aquí podrías inicializar el chat en la base de datos si es necesario
      }
      // Si hay un chat guardado, se usará automáticamente
    }

    return c.json(chatWithMessages);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return c.json({ error: 'Failed to fetch chat' }, 500);
  }
});

app.post('/api/chats', async (c) => {
  try {
    const { title, workspaceId } = await c.req.json();
    const newChat: ChatData = {
      id: generateId(),
      title: title || 'Nuevo Chat',
      messages: [],
      lastMessageAt: new Date(),
      workspaceId: workspaceId || null
    };

    // Insertar el nuevo chat en la base de datos D1
    await c.env.DB.prepare(
      'INSERT INTO chats (id, title, last_message_at, workspace_id) VALUES (?, ?, ?, ?)'
    ).bind(
      newChat.id,
      newChat.title,
      newChat.lastMessageAt.toISOString(),
      newChat.workspaceId || null
    ).run();

    // Actualizar el estado en memoria
    chats.push(newChat);

    // Notificar a los clientes WebSocket sobre el nuevo chat
    broadcastToRoom('global', {
      type: 'chat_created',
      chat: newChat
    });

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

  try {
    // Update the chat title in the database
    const result = await c.env.DB.prepare(
      'UPDATE chats SET title = ? WHERE id = ? RETURNING *'
    )
      .bind(title, chatId)
      .first();

    if (!result) {
      return c.json({ error: 'Chat no encontrado' }, 404);
    }

    // Update the in-memory chats array if it exists
    const chatIndex = chats.findIndex(chat => chat.id === chatId);
    if (chatIndex !== -1) {
      chats[chatIndex].title = title;
    }

    return c.json({
      success: true,
      chat: {
        id: result.id,
        title: result.title,
        lastMessageAt: result.last_message_at,
        messages: []
      }
    });
  } catch (error) {
    console.error('Error updating chat title:', error);
    return c.json({
      error: 'Error al actualizar el título del chat',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, 500);
  }
});

app.delete('/api/chats/:id', async (c) => {
  const chatId = c.req.param('id');

  try {
    // Delete messages first due to foreign key constraint
    await c.env.DB.prepare(
      'DELETE FROM messages WHERE chat_id = ?'
    ).bind(chatId).run();

    // Then delete the chat
    const result = await c.env.DB.prepare(
      'DELETE FROM chats WHERE id = ?'
    ).bind(chatId).run();

    if (result.success) {
      // Also remove from in-memory array if it exists
      chats = chats.filter(c => c.id !== chatId);
      return c.json({ success: true });
    } else {
      return c.json({ success: false, error: 'Failed to delete chat' }, 500);
    }
  } catch (error) {
    console.error('Error deleting chat:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
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
      broadcastToRoom(chatId, {
        type: 'chat_updated',
        chatId,
        messages: formattedMessages
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
    const { maxStepsTemp: newMaxSteps, prompt: newPrompt, modelTemp: newModel, selectedChatId: newChatId } = await c.req.json();
    await setSelectedModel(c.env, newModel);
    await setSystemPrompt(c.env, newPrompt);

    // Actualizar el chat actual en KV
    if (newChatId) {
      await c.env.MODEL_CONFIG.put('current_chat_id', newChatId);
    } else {
      // Si no se proporciona un chatId, verificar si ya existe uno
      const storedChatId = await c.env.MODEL_CONFIG.get('current_chat_id');
      if (!storedChatId) {
        // Si no hay chat guardado, crear uno nuevo
        const newChatId = `chat_${Date.now()}`;
        await c.env.MODEL_CONFIG.put('current_chat_id', newChatId);
      }
    }

    selectedModel = newModel;
    systemPrompt = newPrompt;
    // Validate maxSteps
    model = workersai(newModel);
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
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  server.accept();

  // Add to global room by default
  if (!chatRooms.has('global')) {
    chatRooms.set('global', new Set());
  }
  chatRooms.get('global')!.add(server);

  // Handle WebSocket events
  server.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data.toString());
      // Handle different message types if needed
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  server.addEventListener('close', () => {
    // Clean up when connection closes
    chatRooms.forEach((room, roomId) => {
      if (room.has(server)) {
        room.delete(server);
        if (room.size === 0) {
          chatRooms.delete(roomId);
        }
      }
    });
  });

  return new Response(null, {
    status: 101,
    webSocket: client,
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
      // const defaultChat = await chat.initializeDefaultChat();
      return c.json({
        success: true,
        messages: [],
        chatId: ''
        // chatId: defaultChat.id
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
import { any } from "zod";
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
  `

  private readonly CREATE_WORKSPACES_TABLE = `
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      emoji TEXT NOT NULL,
      emoji_color TEXT,
      description TEXT,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  private readonly CREATE_CHATS_TABLE = `
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      workspace_id TEXT,
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
        console.log('Database tables initialized successfully');
        // this.initializeDefaultChat().catch(error => {
        //   console.error('Error initializing default chat:', error);
        // });
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

      // Create all tables in a single transaction
      await this.db.batch([
        // Create workspaces table first since chats references it
        this.db.prepare(this.CREATE_WORKSPACES_TABLE),
        // Create chats table with foreign key to workspaces
        this.db.prepare(this.CREATE_CHATS_TABLE),
        // Create messages table with foreign key to chats
        this.db.prepare(this.CREATE_MESSAGES_TABLE),
        // Create step_counters table with foreign key to chats
        this.db.prepare(this.CREATE_STEP_COUNTERS_TABLE)
      ]);
      
      console.log('All database tables initialized successfully');
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

    // Try to get the current chat ID from KV if not set
    if (!this.currentChatId) {
      const storedChatId = await this.env.MODEL_CONFIG.get('current_chat_id');
      if (storedChatId) {
        this.currentChatId = storedChatId;
      } else {
        // If no chat ID in KV, try to get the most recent chat
        const recentChat = await this.db.prepare(
          'SELECT id FROM chats ORDER BY last_message_at DESC LIMIT 1'
        ).first<{ id: string }>();

        if (recentChat) {
          this.currentChatId = recentChat.id;
          // Save to KV for future requests
          await this.env.MODEL_CONFIG.put('current_chat_id', this.currentChatId);
        } else {
          console.error('No chat available. Please create a chat first.');
          return;
        }
      }
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
      // if (!this.currentChatId) {
      //   // Si no hay chat activo, usar el chat por defecto
      //   const defaultChat = await this.initializeDefaultChat();
      //   this.currentChatId = defaultChat.id;
      // }

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
              // if (!this.currentChatId) {
              //   const defaultChat = await this.initializeDefaultChat();
              //   this.currentChatId = defaultChat.id;
              //   console.log('Chat ID establecido a:', this.currentChatId);
              // }

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
    const chatConnections = chatRooms.get(this.currentChatId || '');
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

    // Helper function for retryable API calls with exponential backoff
    const callWithRetry = async (fn: () => Promise<any>, maxRetries = 3, baseDelay = 1000) => {
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          lastError = error;

          // If it's a 503 or rate limit error, we'll retry
          const isRetryable = error?.code === 503 ||
            error?.status === 'UNAVAILABLE' ||
            error?.code === 429;

          if (!isRetryable || attempt === maxRetries - 1) {
            console.error(`API call failed after ${attempt + 1} attempts:`, error);
            throw error;
          }

          // Exponential backoff with jitter
          const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
          const jitter = Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          console.log(`Retrying API call (attempt ${attempt + 2}/${maxRetries})...`);
        }
      }

      throw lastError || new Error('Unknown error in API call');
    };

    return createDataStreamResponse({
      execute: async (dataStream) => {
        let lastError = null;
        let currentStep = 0;

        while (currentStep < maxSteps) {
          try {
            const response = await callWithRetry(async () => {
              return await ai.models.generateContent({
                model: geminiModel,
                contents: [
                  {
                    role: 'assistant',
                    parts: [
                      { text: systemPrompt },
                      ...this.messages.map(msg => ({ text: msg.content }))
                    ]
                  }
                ],
              });
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
            // if (!this.currentChatId) {
            //   const defaultChat = await this.initializeDefaultChat();
            //   this.currentChatId = defaultChat.id;
            //   console.log('Chat ID establecido a:', this.currentChatId);
            // }

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
          } catch (error: any) {
            console.error('Error en el paso ' + (currentStep + 1) + ':', error);
            lastError = error;

            // Provide more user-friendly error messages
            const errorMessage = error?.code === 503 || error?.status === 'UNAVAILABLE'
              ? 'El servicio de IA está temporalmente sobrecargado. Por favor, inténtalo de nuevo en unos momentos.'
              : error?.code === 429
                ? 'Has excedido el límite de solicitudes. Por favor, espera un momento antes de intentar de nuevo.'
                : 'Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo.';

            // Send error message to the client
            dataStream.write(formatDataStreamPart('error', errorMessage));

            // Exit the loop on non-retryable errors or after all retries
            const isRetryable = error?.code === 503 ||
              error?.status === 'UNAVAILABLE' ||
              error?.code === 429;
            if (!isRetryable) {
              break;
            }

            // For retryable errors, we'll let the retry logic handle it
            throw error;
          }
        }
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
    // if (!this.currentChatId) {
    //   const defaultChat = await this.initializeDefaultChat();
    //   this.currentChatId = defaultChat.id;
    //   console.log('Chat ID establecido en executeTask:', this.currentChatId);
    // }
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
  // async fetch_with_context(request: Request, env: Env, ctx: ExecutionContext) {
  //   const url = new URL(request.url);
  //   const pathname = url.pathname;

  //   // Manejar rutas específicas
  //   if (pathname.startsWith('/agents/chat/default/get-messages')) {
  //     const chatId = url.searchParams.get('chatId');
  //     let chat = Chat.instance;

  //     if (!chat) {
  //       return new Response(JSON.stringify({
  //         error: 'Chat instance not initialized',
  //         details: 'The Chat instance has not been properly initialized.'
  //       }), { status: 500 });
  //     }

  //     if (!chatId) {
  //       // const defaultChat = await chat.initializeDefaultChat();
  //       return new Response(JSON.stringify({
  //         success: true,
  //         messages: [],
  //         chatId: "",
  //         // chatId: defaultChat.id
  //       }));
  //     }

  //     const savedChats = await chat.loadChatsFromStorage();
  //     if (savedChats.length > 0) {
  //       chats = savedChats;
  //     }

  //     const specificChat = chats.find(c => c.id === chatId);
  //     if (!specificChat) {
  //       return new Response(JSON.stringify({
  //         error: 'Chat not found',
  //         details: `No chat found with ID: ${chatId}`
  //       }), { status: 404 });
  //     }

  //     chat.setCurrentChat(chatId);
  //     chat.messages = specificChat.messages;

  //     const messages = specificChat.messages.map(msg => ({
  //       id: msg.id || generateId(),
  //       role: msg.role || 'user',
  //       content: msg.content || '',
  //       createdAt: new Date(msg.createdAt)
  //     }));

  //     return new Response(JSON.stringify({
  //       success: true,
  //       messages: messages
  //     }));
  //   }

  //   // Manejar otras rutas
  //   return app.fetch(request, env, ctx);
  // },
};