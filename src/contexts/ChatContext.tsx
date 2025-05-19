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

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  createChat: () => void;
  selectChat: (chatId: string) => void;
  addMessage: (chatId: string, message: Message) => void;
  deleteChat: (chatId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);

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

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        createChat,
        selectChat,
        addMessage,
        deleteChat
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