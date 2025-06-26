// API Response Types

export type BrowserType = 'browserbase' | 'rendering';

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  createdAt: string;
  metadata?: {
    browser?: BrowserType;
    [key: string]: any;
  };
}

export interface FormattedChatMessage extends Omit<ChatMessage, 'createdAt'> {
  timestamp: string;
  isUser: boolean;
  isVisible: boolean;
  createdAt: Date;
}

// Cloudflare Agents API Types
export interface BrowserConfig {
  browser: BrowserType;
  chatId: string;
}

export interface BrowserTool {
  type: 'browser';
  browser: {
    provider: 'browserbase' | 'rendering';
    startUrl?: string;
  };
}

export interface AgentRunRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  tools?: BrowserTool[];
  stream?: boolean;
}