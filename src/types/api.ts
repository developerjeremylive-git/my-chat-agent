// API Response Types

export interface APIResponse<T> {
  success: boolean;
  messages?: T[];
  error?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  // Add other message properties as needed
}

export interface FormattedChatMessage extends Omit<ChatMessage, 'createdAt'> {
  createdAt: Date;
}