import React, { createContext, useContext, useState, useEffect } from 'react';

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

interface ApiResponse {
  success: boolean;
  chatId: string;
  messages: Message[];
}

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createChat: () => void;
  selectChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  deleteChat: (chatId: string) => void;
  clearHistory: () => void;
  addToolResult: ({ toolCallId, result }: { toolCallId: string; result: any }) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

  // Cargar chats del almacenamiento local y del servidor al iniciar
  useEffect(() => {
    const loadInitialChats = async () => {
      try {
        // Intentar cargar chats del almacenamiento local primero
        const savedChats = localStorage.getItem('chats');
        let initialChats = [];
        
        if (savedChats) {
          initialChats = JSON.parse(savedChats).map((chat: any) => ({
            ...chat,
            createdAt: new Date(chat.createdAt),
            lastMessageAt: new Date(chat.lastMessageAt),
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt)
            }))
          }));
        }

        // Si no hay chats guardados localmente, obtener del servidor
        if (initialChats.length === 0) {
          const response = await fetch('/agents/chat/default/get-messages');
          const data = await response.json() as ApiResponse;
          
          if (data.success && data.chatId) {
            const defaultChat: Chat = {
              id: data.chatId,
              title: 'Nuevo Chat',
              messages: data.messages || [],
              createdAt: new Date(),
              lastMessageAt: new Date()
            };
            initialChats = [defaultChat];
          }
        }

        setChats(initialChats);
        if (initialChats.length > 0 && !currentChat) {
          setCurrentChat(initialChats[0]);
        }
      } catch (error) {
        console.error('Error al cargar los chats:', error);
        // Si hay un error, crear un chat por defecto
        if (chats.length === 0) {
          createChat();
        }
      }
    };

    loadInitialChats();
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

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const addMessage = (chatId: string, message: Message) => {
    setChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, message],
            lastMessageAt: new Date()
          };
        }
        return chat;
      });
    });
  };

  const deleteChat = (chatId: string) => {
    setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      const remainingChats = chats.filter(chat => chat.id !== chatId);
      setCurrentChat(remainingChats.length > 0 ? remainingChats[0] : null);
    }
  };

  const clearHistory = () => {
    if (currentChat) {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === currentChat.id) {
          return {
            ...chat,
            messages: [],
            lastMessageAt: new Date()
          };
        }
        return chat;
      }));
    }
  };

  const addToolResult = ({ toolCallId, result }: { toolCallId: string; result: any }) => {
    if (currentChat) {
      const message: Message = {
        id: toolCallId,
        role: 'assistant',
        content: result,
        createdAt: new Date()
      };
      addMessage(currentChat.id, message);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        createChat,
        selectChat,
        addMessage,
        deleteChat,
        clearHistory,
        addToolResult
      }}
    >
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