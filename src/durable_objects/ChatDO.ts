/// <reference types="@cloudflare/workers-types" />

interface Env {
  CHAT_DB: D1Database;
}

type WebSocketMessage = {
  type: 'chat' | 'chat_updated' | 'typing' | 'user_typing' | 'error' | 'connected';
  [key: string]: any;
};

type WebSocketError = Error & {
  code?: string | number;
};

export class ChatDO implements DurableObject {
  private connections: Map<string, WebSocket> = new Map();
  private state: DurableObjectState;
  private env: Env;
  private ctx: ExecutionContext;
  private chatId: string = 'default';

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    // @ts-ignore - ExecutionContext is available in Cloudflare Workers
    this.ctx = new ExecutionContext();
    
    // Set up alarm for cleanup
    this.state.blockConcurrencyWhile(async () => {
      const currentAlarm = await this.state.storage.getAlarm();
      if (currentAlarm === null) {
        // Set alarm to clean up after 1 hour of inactivity
        await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, searchParams } = url;

    if (pathname === '/ws') {
      // Handle WebSocket upgrade
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
        return new Response('Expected Upgrade: WebSocket', { status: 426 });
      }

      // @ts-ignore - webSocket is a valid property in Cloudflare Workers
      const webSocket = request.webSocket;
      if (!webSocket) {
        return new Response('Expected WebSocket', { status: 400 });
      }

      try {
        const connectionId = crypto.randomUUID();
        this.chatId = searchParams.get('chatId') || 'default';
        
        // Reset the alarm on new connection
        await this.state.storage.setAlarm(Date.now() + 60 * 60 * 1000);
        
        // Accept the WebSocket connection
        webSocket.accept();
        
        // Set up event handlers
        webSocket.addEventListener('message', async (event: MessageEvent) => {
          try {
            if (typeof event.data !== 'string') {
              throw new Error('Expected string data');
            }
            const message = JSON.parse(event.data) as WebSocketMessage;
            await this.handleMessage(connectionId, message);
          } catch (error) {
            console.error('Error processing message:', error);
            this.sendError(webSocket, 'Invalid message format');
          }
        });
        
        webSocket.addEventListener('close', () => {
          this.connections.delete(connectionId);
          console.log(`Connection ${connectionId} closed`);
        });
        
        webSocket.addEventListener('error', (error: Event) => {
          console.error('WebSocket error:', error);
          this.connections.delete(connectionId);
        });
        
        // Store the WebSocket connection
        this.connections.set(connectionId, webSocket);
        
        // Send welcome message
        this.sendMessage(webSocket, {
          type: 'connected',
          connectionId,
          chatId: this.chatId,
          timestamp: new Date().toISOString()
        });
        
        return new Response(null, { status: 101 });
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
        return new Response('Error setting up WebSocket', { status: 500 });
      }
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleMessage(connectionId: string, message: WebSocketMessage) {
    if (!message || typeof message !== 'object') {
      throw new Error('Invalid message format');
    }

    try {
      switch (message.type) {
        case 'chat':
          // Broadcast the message to all connections in this chat
          await this.broadcast({
            ...message,
            timestamp: new Date().toISOString(),
            connectionId,
            chatId: this.chatId
          });
          break;
          
        case 'chat_updated':
          // Broadcast chat update to all connections
          await this.broadcast({
            type: 'chat_updated',
            chatId: this.chatId,
            messages: message.messages || [],
            timestamp: new Date().toISOString()
          });
          break;
          
        case 'typing':
          // Broadcast typing indicator to all other connections in this chat
          await this.broadcast({
            type: 'user_typing',
            userId: connectionId,
            chatId: this.chatId,
            isTyping: Boolean(message.isTyping)
          }, connectionId);
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          throw new Error(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const ws = this.connections.get(connectionId);
      if (ws) {
        this.sendError(ws, error instanceof Error ? error.message : 'Error processing message');
      }
    }
  }

  private async broadcast(message: WebSocketMessage, excludeConnectionId?: string): Promise<void> {
    const messageStr = JSON.stringify(message);
    const deadConnections: string[] = [];
    
    // Process all connections
    await Promise.allSettled(
      Array.from(this.connections.entries()).map(async ([id, ws]) => {
        try {
          // Skip excluded connection if specified
          if (excludeConnectionId && id === excludeConnectionId) return;
          
          if (ws.readyState === 1) { // WebSocket.OPEN
            try {
              // Use a promise to handle the send operation
              await new Promise<void>((resolve, reject) => {
                // Set up error handler
                const errorHandler = (event: Event) => {
                  ws.removeEventListener('error', errorHandler);
                  console.error('WebSocket send error:', event);
                  deadConnections.push(id);
                  reject(new Error('WebSocket send error'));
                };
                
                ws.addEventListener('error', errorHandler);
                
                try {
                  // Send the message
                  ws.send(messageStr);
                  
                  // If we get here, the message was sent successfully
                  // Use setTimeout to ensure the message is processed in the next tick
                  setTimeout(() => {
                    ws.removeEventListener('error', errorHandler);
                    resolve();
                  }, 0);
                } catch (error) {
                  console.error('Error in WebSocket send:', error);
                  deadConnections.push(id);
                  reject(error);
                }
              });
            } catch (error) {
              console.error('Error in send promise:', error);
              deadConnections.push(id);
            }
          } else {
            deadConnections.push(id);
          }
        } catch (error) {
          console.error('Error in broadcast loop:', error);
          deadConnections.push(id);
        }
      })
    );
    
    // Clean up dead connections
    deadConnections.forEach(id => this.connections.delete(id));
  }
  
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }
  
  private sendError(ws: WebSocket, message: string): void {
    this.sendMessage(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  // Handle cleanup when the Durable Object is evicted from memory
  async alarm(): Promise<void> {
    console.log('Cleaning up WebSocket connections due to inactivity');
    
    // Close all WebSocket connections
    const closePromises = Array.from(this.connections.values()).map(ws => 
      new Promise<void>((resolve) => {
        try {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.close(1012, 'Server is restarting');
          }
        } catch (error) {
          console.error('Error closing WebSocket:', error);
        } finally {
          resolve();
        }
      })
    );
    
    await Promise.allSettled(closePromises);
    this.connections.clear();
  }
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return new Response('Not found', { status: 404 });
  },
};
