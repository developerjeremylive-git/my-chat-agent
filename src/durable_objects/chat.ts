import { GoogleGenAI } from "@google/genai";

interface Env {
    GEMINI_API_KEY: string;
}

interface WebSocketMessage {
    type: 'message' | 'update' | 'error';
    chatId?: string;
    message?: ChatMessage;
    error?: string;
    content?: string;
}

interface D1Database {
    prepare(query: string): D1PreparedStatement;
    batch<T = unknown>(statements: D1PreparedStatement[]): Promise<T[]>;
}

interface D1PreparedStatement {
    bind(...values: any[]): D1PreparedStatement;
    first<T = unknown>(): Promise<T | null>;
    run<T = unknown>(): Promise<T>;
    all<T = unknown>(): Promise<{ results: T[] }>;
}

interface DurableObjectState {
    storage: DurableObjectStorage;
}

interface DurableObjectStorage {
    database(name: string): D1Database;
    transaction<T>(closure: (txn: any) => Promise<T>): Promise<T>;
    transactionSync<T>(closure: (txn: any) => T): T;
}

interface ChatMessage {
    id: string;
    role: 'assistant' | 'system' | 'user' | 'data';
    content: string;
    createdAt: Date;
}

interface ChatData {
    id: string;
    title: string;
    messages: ChatMessage[];
    lastMessageAt: Date;
}

function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant...';
const DEFAULT_MODEL = 'gemini-pro';

export class ChatDO implements DurableObject {
    private state: DurableObjectState;
    private env: Env;
    private storage: DurableObjectStorage;
    private db: D1Database;
    private currentChatId: string | null = null;
    public messages: ChatMessage[] = [];
    private static instance: ChatDO | null = null;

    constructor(state: DurableObjectState, env: Env) {
        this.state = state;
        this.env = env;
        this.storage = state.storage;
        this.db = this.storage.database('database');

        if (!ChatDO.instance) {
            ChatDO.instance = this;
            this.initializeTables().catch(error => {
                console.error('Error initializing database tables:', error);
            });
        }
    }

    async fetch(request: Request): Promise<Response> {
        try {
            const url = new URL(request.url);
            const chatId = url.searchParams.get('chatId');

            if (request.headers.get('Upgrade') === 'websocket') {
                const pair = new WebSocketPair();
                await this.handleWebSocket(pair[1], chatId);
                return new Response(null, { status: 101, webSocket: pair[0] });
            }

            return new Response('Expected WebSocket', { status: 400 });
        } catch (error) {
            console.error('Error handling request:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    }

    private async handleWebSocket(webSocket: WebSocket, chatId: string | null): Promise<void> {
        webSocket.accept();

        if (chatId) {
            this.setCurrentChat(chatId);
        } else {
            const defaultChat = await this.initializeDefaultChat();
            this.setCurrentChat(defaultChat.id);
        }

        webSocket.addEventListener('message', async (event) => {
            try {
                const data = JSON.parse(event.data as string) as WebSocketMessage;

                if (data.type === 'message' && data.content) {
                    const message: ChatMessage = {
                        id: generateId(),
                        role: 'user',
                        content: data.content,
                        createdAt: new Date()
                    };

                    await this.handleMessage(message, webSocket);
                }
            } catch (error) {
                console.error('Error handling WebSocket message:', error);
                webSocket.send(JSON.stringify({
                    type: 'error',
                    error: 'Error processing message'
                }));
            }
        });
    }

    private async initializeTables(): Promise<void> {
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

        await this.storage.transaction(async (txn) => {
            await this.db.prepare(
                'INSERT INTO chats (id, title, last_message_at) VALUES (?, ?, ?)'
            ).bind(chat.id, chat.title, chat.lastMessageAt.toISOString()).run();
        });

        return chat;
    }

    async getChat(chatId: string): Promise<ChatData | null> {
        const chat = await this.db.prepare(
            'SELECT * FROM chats WHERE id = ?'
        ).bind(chatId).first<{ id: string; title: string; last_message_at: string }>();

        if (!chat) return null;

        const messages = await this.db.prepare(
            'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
        ).bind(chatId).all<{ id: string; role: 'assistant' | 'system' | 'user' | 'data'; content: string; created_at: string }>();

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
        ).all<{ id: string; title: string; last_message_at: string }>();

        return Promise.all(chats.results.map(async chat => {
            const messages = await this.db.prepare(
                'SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC'
            ).bind(chat.id).all<{ id: string; role: 'assistant' | 'system' | 'user' | 'data'; content: string; created_at: string }>();

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

        await this.storage.transaction(async (txn) => {
            // Obtener mensajes existentes para este chat
            const existingMessages = await this.db.prepare(
                'SELECT role, content FROM messages WHERE chat_id = ?'
            ).bind(this.currentChatId).all<{ role: string; content: string }>();

            const existingSet = new Set(
                existingMessages.results.map(msg => `${msg.role}:${msg.content}`)
            );

            for (const message of messages) {
                const messageKey = `${message.role}:${message.content}`;
                
                // Solo insertar si el mensaje no existe
                if (!existingSet.has(messageKey)) {
                    await this.db.prepare(
                        'INSERT INTO messages (id, chat_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)'
                    ).bind(
                        message.id,
                        this.currentChatId,
                        message.role,
                        message.content,
                        message.createdAt.toISOString()
                    ).run();
                    existingSet.add(messageKey);
                }
            }

            // Actualizar la fecha del último mensaje
            await this.db.prepare(
                'UPDATE chats SET last_message_at = ? WHERE id = ?'
            ).bind(new Date().toISOString(), this.currentChatId).run();
        });

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
            const existingChats = await this.db.prepare('SELECT COUNT(*) as count FROM chats').first<{ count: number }>();

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

    // private async handleMessage(message: ChatMessage, webSocket: WebSocket): Promise<void> {
    //   try {
    //     await this.saveMessages([...this.messages, message]);

    //     const ai = new GoogleGenerativeAI(this.env.GEMINI_API_KEY);
    //     const model = ai.getGenerativeModel({ model: DEFAULT_MODEL });

    //     const prompt = this.messages.map(msg => ({ text: msg.content || '' }));
    //     const result = await model.generateContent({
    //       contents: [{
    //         parts: [
    //           { text: DEFAULT_SYSTEM_PROMPT },
    //           ...prompt
    //         ]
    //       }]
    //     });

    //     const response = result.response;
    //     if (!response) throw new Error('No response from AI');

    //     const aiMessage: ChatMessage = {
    //       id: generateId(),
    //       role: 'assistant',
    //       content: response.text() || '',
    //       createdAt: new Date()
    //     };

    //     await this.saveMessages([...this.messages, aiMessage]);

    //     webSocket.send(JSON.stringify({
    //       type: 'message',
    //       message: aiMessage
    //     }));
    //   } catch (error) {
    //     console.error('Error handling message:', error);
    //     webSocket.send(JSON.stringify({
    //       type: 'error',
    //       error: 'Error generating response'
    //     }));
    //   }
    // }

    private async handleMessage(message: ChatMessage, webSocket: WebSocket): Promise<void> {
        try {
            await this.saveMessages([...this.messages, message]);

            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: DEFAULT_MODEL,
                contents: [{
                    role: 'user',
                    parts: [{
                        text: `${DEFAULT_SYSTEM_PROMPT}
                                ${this.messages
                                .map(msg => `${msg.role}: ${msg.content}`)
                                .join('\n')}
                                user: ${message.content}`
                    }]
                }]
            });

            if (!response) throw new Error('No response from AI');

            const aiMessage: ChatMessage = {
                id: generateId(),
                role: 'assistant',
                content: response.text ?? '',
                createdAt: new Date()
            };

            await this.saveMessages([...this.messages, aiMessage]);

            webSocket.send(JSON.stringify({
                type: 'message',
                message: aiMessage
            }));
        } catch (error) {
            console.error('Error handling message:', error);
            webSocket.send(JSON.stringify({
                type: 'error',
                error: 'Error generating response'
            }));
        }
    }
}