import React, { createContext, useContext, useState, useEffect, useRef  } from 'react';

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createChat: () => void;
  selectChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  deleteChat: (chatId: string) => void;
  updateChat: (chatId: string, updatedChat: Chat) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        if (currentChat) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            chatId: currentChat.id
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'chat_updated' && data.chatId && data.messages) {
            const formattedMessages = data.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            }));
            
            setChats(prevChats => {
              return prevChats.map(chat => {
                if (chat.id === data.chatId) {
                  return {
                    ...chat,
                    messages: formattedMessages,
                    lastMessageAt: new Date()
                  };
                }
                return chat;
              });
            });

            if (currentChat?.id === data.chatId) {
              setCurrentChat(prev => prev ? {
                ...prev,
                messages: formattedMessages,
                lastMessageAt: new Date()
              } : null);
            }
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(connectWebSocket, 3000);
      };

      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Subscribe to new chat when current chat changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && currentChat) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        chatId: currentChat.id
      }));
    }
  }, [currentChat?.id]);

  // Cargar chats del almacenamiento local al iniciar
  useEffect(() => {
    const savedChats = localStorage.getItem('chats');
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats).map((chat: any) => ({
        ...chat,
        createdAt: new Date(chat.createdAt),
        lastMessageAt: new Date(chat.lastMessageAt),
        messages: chat.messages.map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
      }));
      setChats(parsedChats);
      if (parsedChats.length > 0 && !currentChat) {
        setCurrentChat(parsedChats[0]);
      }
    }
  }, []);

  // Guardar chats en el almacenamiento local cuando cambien
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const createChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
      messages: [],
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    setChats([...chats, newChat]);
    setCurrentChat(newChat);
  };

  interface ChatResponse {
    id: string;
    title: string;
    messages: {
      id: string;
      role: 'user' | 'assistant';
      content: string;
      createdAt: string;
    }[];
    createdAt: string;
    lastMessageAt: string;
  }

  const selectChat = async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (response.ok) {
        const chatData = await response.json() as ChatResponse;
        const formattedChat: Chat = {
          id: chatData.id,
          title: chatData.title,
          createdAt: new Date(chatData.createdAt),
          lastMessageAt: new Date(chatData.lastMessageAt),
          messages: chatData.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: new Date(msg.createdAt)
          }))
        };

        // Update both the chats array and current chat
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(c => c.id === chatId);
          if (chatIndex !== -1) {
            const newChats = [...prevChats];
            newChats[chatIndex] = formattedChat;
            return newChats;
          }
          return prevChats;
        });

        setCurrentChat(formattedChat);

        // Subscribe to chat updates via WebSocket
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            chatId: formattedChat.id
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = async (chatId: string, message: Message) => {
    try {
      // Send message to the server
      const response = await fetch(`/api/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: message.content,
          role: message.role
        })
      });

      if (response.ok) {
        const data = await response.json() as { success: boolean; chat: ChatResponse };
        
        // Update chats array
        setChats(prevChats => {
          return prevChats.map(chat => {
            if (chat.id === chatId) {
              return {
                ...chat,
                messages: data.chat.messages.map((msg: any) => ({
                  ...msg,
                  createdAt: new Date(msg.createdAt)
                })),
                lastMessageAt: new Date(data.chat.lastMessageAt)
              };
            }
            return chat;
          });
        });

        // Update current chat if this is the active chat
        if (currentChat?.id === chatId) {
          setCurrentChat(prev => prev ? {
            ...prev,
            messages: data.chat.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            })),
            lastMessageAt: new Date(data.chat.lastMessageAt)
          } : null);
        }
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  };

  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  const updateChat = (chatId: string, updatedChat: Chat) => {
    setChats(prevChats => {
      const chatIndex = prevChats.findIndex(c => c.id === chatId);
      if (chatIndex !== -1) {
        const newChats = [...prevChats];
        newChats[chatIndex] = updatedChat;
        localStorage.setItem('chats', JSON.stringify(newChats));
        return newChats;
      }
      return prevChats;
    });
  };

  return (
    <ChatContext.Provider value={{
      chats,
      currentChat,
      createChat,
      selectChat,
      addMessage,
      deleteChat,
      updateChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}