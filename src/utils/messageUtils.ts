import type { Message } from "ai";

export interface APIMessage {
  id: string;
  chatId: string;
  role: 'assistant' | 'system' | 'user' | 'data';
  content: string;
  createdAt: Date | string;
}

export function transformAPIMessagesToAgentMessages(apiMessages: APIMessage[]): Message[] {
  return apiMessages.map(msg => {
    const createdAt = typeof msg.createdAt === 'string' 
      ? new Date(msg.createdAt)
      : msg.createdAt;
      
    return {
      id: msg.id,
      role: msg.role,
      content: msg.content,
      parts: [
        {
          type: 'text',
          text: msg.content
        }
      ],
      createdAt
    } as Message; // Type assertion to handle the Message interface
  });
}

export function transformAgentMessageToAPIMessage(agentMessage: Message): Omit<APIMessage, 'id'> {
  return {
    chatId: agentMessage.id,
    role: agentMessage.role as 'assistant' | 'system' | 'user' | 'data',
    content: agentMessage.content,
    createdAt: agentMessage.createdAt instanceof Date 
      ? agentMessage.createdAt 
      : new Date(agentMessage.createdAt || Date.now())
  };
}
