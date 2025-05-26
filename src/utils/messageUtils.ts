import type { Message } from "ai";

export interface APIMessage {
  id: string;
  chatId: string;
  role: 'assistant' | 'system' | 'user' | 'data';
  content: string;
  createdAt: Date | string;
  parts?: Array<{
    type: string;
    text: string;
    [key: string]: any;
  }>;
}

// Helper function to extract content from different message formats
function extractContent(message: any): string {
  console.log('Extracting content from message:', JSON.stringify(message, null, 2));
  
  // Si el mensaje tiene content directo (formato de la API mostrado)
  if (message.content) {
    console.log('Found direct content in message');
    if (typeof message.content === 'string') {
      return message.content;
    }
    // Si por alguna razón es un array, unir las partes
    if (Array.isArray(message.content)) {
      return message.content
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (part.text) return part.text;
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return String(message.content);
  }
  
  // Manejo de otros formatos por si acaso
  if (message.message?.content) {
    if (typeof message.message.content === 'string') {
      return message.message.content;
    }
    if (Array.isArray(message.message.content)) {
      return message.message.content
        .map((part: any) => part.text || part)
        .filter(Boolean)
        .join('\n');
    }
  }
  
  // Si es un mensaje con formato de partes
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (part.text) return part.text;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  
  console.warn('No se pudo extraer contenido del mensaje. Estructura inesperada:', message);
  return '';
}

export function transformAPIMessagesToAgentMessages(apiMessages: APIMessage[]): Message[] {
  if (!apiMessages || !Array.isArray(apiMessages)) {
    console.warn('Invalid messages array provided to transformAPIMessagesToAgentMessages');
    return [];
  }

  if (apiMessages.length === 0) return [];
  
  console.log('Transforming API messages:', JSON.stringify(apiMessages, null, 2));
  
  const transformedMessages = apiMessages.map(msg => {
    try {
      // Skip invalid messages
      if (!msg || typeof msg !== 'object') {
        console.warn('Invalid message format:', msg);
        return null;
      }

      console.log('Processing message:', JSON.stringify(msg, null, 2));
      
      // Extract content based on message structure
      const content = extractContent(msg);
      
      // Determine message role with fallback
      let role = msg.role;
      if (!['user', 'assistant', 'system', 'data'].includes(role)) {
        console.warn(`Unknown role '${role}' in message, defaulting to 'user'`);
        role = 'user';
      }
      
      // Handle creation date
      const createdAt = msg.createdAt 
        ? (typeof msg.createdAt === 'string' ? new Date(msg.createdAt) : msg.createdAt)
        : new Date();
      
      // Generate a unique ID if not provided
      const id = msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Create the message object
      const messageObj = {
        id,
        role,
        content,
        parts: [{
          type: 'text',
          text: content
        }],
        createdAt
      };
      
      console.log('Transformed message:', JSON.stringify(messageObj, null, 2));
      return messageObj as Message;
      
    } catch (error) {
      console.error('Error processing message:', error, msg);
      return null;
    }
  }).filter((msg): msg is Message => msg !== null);
  
  console.log('Transformed all messages:', JSON.stringify(transformedMessages, null, 2));
  return transformedMessages;
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
