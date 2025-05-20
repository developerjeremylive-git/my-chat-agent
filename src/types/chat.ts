import type { Message } from '@ai-sdk/react';
import type { TextUIPart as SDKTextUIPart, ReasoningUIPart as SDKReasoningUIPart, ToolInvocationUIPart as SDKToolInvocationUIPart, SourceUIPart as SDKSourceUIPart, FileUIPart as SDKFileUIPart, StepStartUIPart as SDKStepStartUIPart } from '@ai-sdk/ui-utils';

export type UIPart = SDKTextUIPart | SDKReasoningUIPart | SDKToolInvocationUIPart | SDKSourceUIPart | SDKFileUIPart | SDKStepStartUIPart;



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