import { AIChatAgent } from "agents/ai-chat-agent";
import { generateId } from "ai";
import type { ChatMessage, ChatData } from '@/types/chat';
import { GoogleGenerativeAI as GoogleGenAI } from '@google/generative-ai';
import { agentContext, config, executions, formatDataStreamPart, maxSteps, model, processToolCalls, selectedModel, streamText, systemPrompt, tools } from '@/ai';
import type { Schedule, StreamTextOnFinishCallback, ToolSet } from '@/types/agent';
import { createDataStreamResponse } from '@/utils/stream';
import { geminiModel } from '@/config/models';

interface Env {
  AI: any;
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

interface DurableObjectState {
  storage: DurableObjectStorage;
  id: DurableObjectId;
  waitUntil(promise: Promise<any>): void;
  blockConcurrencyWhile<T>(callback: () => Promise<T>): Promise<T>;
}

interface DurableObjectStorage {
  get(key: string): Promise<any>;
  put(key: string, value: any): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<Map<string, any>>;
  database(name: string): D1Database;
}

export class ChatDO extends AIChatAgent<Env> {
  private db: D1Database;
  private currentChatId: string | null = null;
  public messages: ChatMessage[] = [];
  private static instance: ChatDO | null = null;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.db = state.storage.database('chat-db');
    
    if (!ChatDO.instance) {
      ChatDO.instance = this;
      this.initializeTables().then(() => {
        this.initializeDefaultChat().catch(error => {
          console.error('Error initializing default chat:', error);
        });
      }).catch(error => {
        console.error('Error initializing database tables:', error);
      });
    }
  }

  private async initializeTables() {
    const createChatsTable = `
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      )
    `;

    await this.db.batch([
      this.db.prepare(createChatsTable),
      this.db.prepare(createMessagesTable)
    ]);
  }

  async createChat(title: string): Promise<ChatData> {
    const chatId = generateId();
    const chat: ChatData = {
      id: chatId,
      title: title || 'New Chat',
      messages: [],
      lastMessageAt: new Date()
    };

    await this.db.prepare(
      'INSERT INTO chats (id, title, last_message_at) VALUES (?, ?, ?)'
    ).bind(chat.id, chat.title, chat.lastMessageAt.toISOString()).run();

    return chat;
  }

  async getChat(chatId: string): Promise<ChatData | null> {
    const chat = await this.db.prepare(
      'SELECT * FROM chats WHERE id = ?'
    ).bind(chatId).first();

    if (!chat) return null;

    const messages = await this.db.prepare(
      'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
    ).bind(chatId).all();

    return {
      id: chat.id,
      title: chat.title,
      messages: messages.results.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: new Date(msg.created_at)
      })),
      lastMessageAt: new Date(chat.last_message_at)
    };
  }

  async getAllChats(): Promise<ChatData[]> {
    const chats = await this.db.prepare(
      'SELECT * FROM chats ORDER BY last_message_at DESC'
    ).all();

    return Promise.all(chats.results.map(async chat => {
      const messages = await this.db.prepare(
        'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
      ).bind(chat.id).all();

      return {
        id: chat.id,
        title: chat.title,
        messages: messages.results.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: new Date(msg.created_at)
        })),
        lastMessageAt: new Date(chat.last_message_at)
      };
    }));
  }

  async updateChatTitle(chatId: string, title: string): Promise<void> {
    await this.db.prepare(
      'UPDATE chats SET title = ? WHERE id = ?'
    ).bind(title, chatId).run();
  }

  async deleteChat(chatId: string): Promise<void> {
    await this.db.prepare('DELETE FROM chats WHERE id = ?').bind(chatId).run();
  }

  async addMessage(chatId: string, message: ChatMessage): Promise<void> {
    await this.db.prepare(
      'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      message.id,
      chatId,
      message.role,
      message.content,
      message.createdAt.toISOString()
    ).run();

    await this.db.prepare(
      'UPDATE chats SET last_message_at = ? WHERE id = ?'
    ).bind(message.createdAt.toISOString(), chatId).run();
  }

  setCurrentChat(chatId: string) {
    this.currentChatId = chatId;
  }

  async saveMessages(messages: ChatMessage[]): Promise<void> {
    if (!this.currentChatId) throw new Error('No chat selected');
    
    for (const message of messages) {
      await this.addMessage(this.currentChatId, message);
    }
    this.messages = messages;

    // Emitir evento de actualización de mensajes si estamos en el navegador
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('messagesUpdated', {
        detail: { messages: messages }
      }));
    }
  }

  async initializeDefaultChat(): Promise<ChatData> {
    try {
      // Verificar si ya existe algún chat
      const existingChats = await this.db.prepare('SELECT COUNT(*) as count FROM chats').first();
      
      if (!existingChats || existingChats.count === 0) {
        const defaultChat: ChatData = {
          id: generateId(),
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

      // Si ya existen chats, retornar el primero
      const firstChat = await this.db.prepare('SELECT * FROM chats ORDER BY last_message_at DESC LIMIT 1').first<{ id: string; title: string; last_message_at: string }>();
      if (!firstChat) {
        throw new Error('No chat found in database');
      }
      this.currentChatId = firstChat.id;
      return {
        id: firstChat.id,
        title: firstChat.title,
        messages: [],
        lastMessageAt: new Date(firstChat.last_message_at)
      };
    } catch (error) {
      console.error('Error initializing default chat:', error);
      throw error;
    }
  }

  async onChatMessage(
    onFinish: StreamTextOnFinishCallback<ToolSet>,
    options?: { abortSignal?: AbortSignal }
  ) {
    try {
      // Asegurar que existe un chat activo
      if (!this.currentChatId) {
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

  private async handleGeminiResponse(onFinish: StreamTextOnFinishCallback<ToolSet>) {
    const geminiApiKey = env.GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment variables');
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const messageParts = this.messages.map(msg => ({ text: msg.content || '' }));
    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: [{
        parts: [
          { text: systemPrompt },
          ...messageParts
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