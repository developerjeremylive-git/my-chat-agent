import React, { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useNotification } from '@/contexts/NotificationContext';
import { Button } from '@/components/button/Button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatText, Plus, Trash, PencilSimple } from '@phosphor-icons/react';
import type { Chat } from '@/contexts/ChatContext';

export function ChatList() {
  const { chats, currentChat, createChat, selectChat, deleteChat, updateChat } = useChat();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const { showSuccess, showError } = useNotification();

  interface ErrorResponse {
    error?: string;
    message?: string;
  }

  interface UpdateTitleResponse {
    success: boolean;
    data?: {
      id: string;
      title: string;
      lastMessageAt: string;
    };
    error?: string;
  }

  const handleUpdateTitle = async (chatId: string) => {
    if (!newTitle.trim()) {
      setEditingChatId(null);
      return;
    }

    try {
      const chatToUpdate = chats.find(c => c.id === chatId);
      if (!chatToUpdate) {
        throw new Error('Chat no encontrado');
      }

      const response = await fetch(`/api/chats/${chatId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });

      const result = await response.json() as UpdateTitleResponse;
      
      if (!response.ok) {
        throw new Error(
          (result as any)?.error || 
          'No se pudo actualizar el título. Por favor, inténtalo de nuevo.'
        );
      }
      
      if (result.success && result.data) {
        // Update local state with the new title and all required Chat properties
        const updatedChat: Chat = {
          ...chatToUpdate,
          title: result.data.title,
          lastMessageAt: new Date(result.data.lastMessageAt || Date.now())
        };
        
        // Update the chat in the context
        updateChat(chatId, updatedChat);
        
        // Show success notification
        showSuccess('Título actualizado correctamente');
      } else {
        throw new Error(result.error || 'Error al actualizar el título');
      }
    } catch (error) {
      console.error('Error updating title:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ocurrió un error inesperado';
      
      showError(errorMessage, 5000);
      
      // Revert to original title on error
      const originalChat = chats.find(c => c.id === chatId);
      if (originalChat) {
        setNewTitle(originalChat.title);
      }
      
      // Re-throw the error to prevent the form from being submitted
      throw error;
    } finally {
      setEditingChatId(null);
      setNewTitle('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Mis Chats</h2>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-lg bg-gradient-to-r from-[#F48120]/10 to-purple-500/10
                     hover:from-[#F48120]/20 hover:to-purple-500/20
                     dark:from-[#F48120]/5 dark:to-purple-500/5
                     dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                     border border-[#F48120]/20 hover:border-[#F48120]/40
                     dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30"
          onClick={createChat}
        >
          <Plus weight="bold" className="w-5 h-5 text-[#F48120]" />
        </Button>
      </div>

      <div className="space-y-2 px-2">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex items-center justify-between p-3 rounded-lg cursor-pointer
                      transition-all duration-200 group/chat
                      ${currentChat?.id === chat.id
                        ? 'bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
            onClick={() => selectChat(chat.id)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <ChatText
                weight="duotone"
                className={`w-5 h-5 ${currentChat?.id === chat.id ? 'text-[#F48120]' : 'text-neutral-500'}`}
              />
              <div className="flex-1 min-w-0">
                {editingChatId === chat.id ? (
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    onBlur={() => handleUpdateTitle(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUpdateTitle(chat.id);
                      }
                      if (e.key === 'Escape') setEditingChatId(null);
                    }}
                    autoFocus
                    className="w-full bg-transparent border-b border-neutral-300 dark:border-neutral-600 focus:outline-none focus:border-[#F48120] dark:focus:border-[#F48120] text-sm font-medium text-neutral-900 dark:text-white"
                  />
                ) : (
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                    {chat.title}
                  </h3>
                )}
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover/chat:opacity-100 transition-opacity duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-[#F48120] dark:hover:text-[#F48120]"
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTitle(chat.title);
                  setEditingChatId(chat.id);
                }}
              >
                <PencilSimple weight="bold" className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                <Trash weight="bold" className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}

        {chats.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              No hay chats aún.
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
              Crea uno nuevo para comenzar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}