export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt: Date;
}

export interface ChatData {
  id: string;
  title: string;
  messages: Message[];
  lastMessageAt: Date;
}

export interface LocalMessage extends Message {
  createdAt: Date;
}

export interface LocalChatData extends ChatData {
  messages: LocalMessage[];
  lastMessageAt: Date;
}

export interface ChatMessage extends Message {
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt: Date;
}

export interface ChatInstance {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  currentChatId: string | null;
  storage: DurableObjectStorage;
  chats: ChatInstance[];
}