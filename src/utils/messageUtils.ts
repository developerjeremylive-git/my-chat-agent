import type { Message } from "ai";

export interface APIMessage {
  id: string;
  chatId: string;
  role: 'assistant' | 'system' | 'user' | 'data';
  content: string;
  createdAt: Date | string;
}

export function transformAPIMessagesToAgentMessages(apiMessages: APIMessage[]): Message[] {
  if (apiMessages.length === 0) return [];
  
  // Asumimos que los mensajes vienen en grupos y el último grupo está al final del array
  // Tomamos el último mensaje como referencia
  const lastMessage = apiMessages[apiMessages.length - 1];
  
  // Filtramos los mensajes que pertenecen al mismo grupo que el último mensaje
  // Aquí asumimos que los mensajes del mismo grupo tienen el mismo chatId
  // Si hay otra propiedad que indique el grupo, deberías usarla en su lugar
  const lastGroup = apiMessages.filter(msg => msg.chatId === lastMessage.chatId);
  
  return lastGroup.map(msg => {
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
    } as Message;
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
