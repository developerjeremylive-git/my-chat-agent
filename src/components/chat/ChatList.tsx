import React from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/button/Button';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChatText, Plus, Trash } from '@phosphor-icons/react';

export function ChatList() {
  const { chats, currentChat, createChat, selectChat, deleteChat } = useChat();

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
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                  {chat.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover/chat:opacity-100 transition-opacity duration-200
                         hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation();
                deleteChat(chat.id);
              }}
            >
              <Trash weight="bold" className="w-4 h-4" />
            </Button>
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