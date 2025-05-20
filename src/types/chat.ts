import type { Message } from '@ai-sdk/react';

export type UIPart = TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart;

export interface TextUIPart {
  type: 'text';
  text: string;
}

export interface ReasoningUIPart {
  type: 'reasoning';
  reasoning: string;
  details: Array<{
    type: 'text';
    text: string;
    signature?: string;
  } | {
    type: 'redacted';
    data: string;
  }>;
}

export interface ToolInvocationUIPart {
  type: 'tool-invocation';
  toolInvocation: {
    state: 'result';
    step?: number;
    toolName: string;
    result?: any;
  };
}

export interface SourceUIPart {
  type: 'source';
  source: string;
}

export interface FileUIPart {
  type: 'file';
  path: string;
}

export interface StepStartUIPart {
  type: 'step-start';
  step: number;
}

export interface ChatMessage extends Omit<Message, 'parts' | 'createdAt'> {
  id: string;
  role: 'assistant' | 'system' | 'user' | 'data';
  content: string;
  createdAt: Date;
  parts?: (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[];
}

export interface ChatData {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastMessageAt: Date;
}

export interface LocalMessage extends Omit<Message, 'parts'>, ChatMessage {
  id: string;
  createdAt: Date;
  parts?: (TextUIPart | ReasoningUIPart | ToolInvocationUIPart | SourceUIPart | FileUIPart | StepStartUIPart)[];
}

export interface LocalChatData extends ChatData {
  messages: LocalMessage[];
}