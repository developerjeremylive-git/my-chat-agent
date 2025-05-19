export interface Message {
  id: string;
  role: "assistant" | "system" | "user" | "data";
  content: string;
  createdAt: Date;
}

export interface ChatMessage extends Message {}

export interface ChatData {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastMessageAt: Date;
}

export interface LocalMessage extends Message {}

export interface LocalChatData extends ChatData {}