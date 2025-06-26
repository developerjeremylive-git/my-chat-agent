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
  role?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isUser: boolean;
  isVisible: boolean;
  createdAt: Date;
  metadata?: {
    browser?: string;
    [key: string]: any;
  };
}