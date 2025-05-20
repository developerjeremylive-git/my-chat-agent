import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/button/Button';
import { X, ChatText, Gear, Brain, Rocket, Trash, PencilSimple } from '@phosphor-icons/react';
import { useChat } from '@/contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { ChatData, LocalMessage, LocalChatData, ChatMessage } from '@/types/chat';

interface EditTitleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
    currentTitle: string;
}

// Using LocalChatData from types/chat.ts

interface SideMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onChatSelect: (chatId: string) => void;
    onNewChat: () => void;
    onOpenSettings: () => void;
    onOpenTools: () => void;
    onClearHistory: () => void;
    selectedChatId: string | null;
}

function EditTitleModal({ isOpen, onClose, onSave, currentTitle }: EditTitleModalProps) {
    const [title, setTitle] = useState(currentTitle);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(title);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-96">
                <h3 className="text-lg font-semibold mb-4">Editar título del chat</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded-lg mb-4 bg-transparent"
                        placeholder="Ingrese el nuevo título"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#F48120] text-white"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function SideMenu({ isOpen, onClose, onChatSelect, onNewChat, onOpenSettings, onOpenTools, onClearHistory, selectedChatId }: SideMenuProps) {
    const [chats, setChats] = useState<LocalChatData[]>([]);
    const [editingChat, setEditingChat] = useState<LocalChatData | null>(null);

    useEffect(() => {
        // Cargar solo los resúmenes de chats al montar el componente
        const loadInitialChats = async () => {
            try {
                // Cargar lista de chats sin mensajes
                const response = await fetch('/api/chats/summaries');
                if (!response.ok) {
                    throw new Error('Failed to fetch chat summaries');
                }
                const data = await response.json() as { chats: Array<{ id: string; title: string; last_message_at: string }> };
                
                // Formatear los chats con array de mensajes vacío
                const formattedChats = data.chats.map((chat: any) => ({
                    ...chat,
                    lastMessageAt: new Date(chat.last_message_at),
                    messages: []
                }));

                setChats(formattedChats);
                // No seleccionamos ningún chat por defecto
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        };
        loadInitialChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json() as { chats: Array<{ id: string; title: string; last_message_at: string }> };
            const formattedChats = data.chats.map((chat) => ({
                ...chat,
                lastMessageAt: new Date(chat.last_message_at),
                messages: []
            }));
            setChats(formattedChats);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const createChat = async () => {
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: 'Nuevo Chat'
                })
            });
            const data = await response.json() as { success: boolean; chat: { id: string; title: string; last_message_at: string } };
            
            if (!response.ok) {
                throw new Error('Error al crear el chat');
            }

            if (data.success && data.chat) {
                const newChat = data.chat;
                setChats([...chats, { 
                    ...newChat, 
                    lastMessageAt: new Date(newChat.last_message_at),
                    messages: []
                }]);
                selectChat(newChat.id);
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            console.error('Error al crear el chat:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
            // Por ejemplo, usando un componente de notificación o alert
            alert(error instanceof Error ? error.message : 'Error al crear el chat');
        }
    };

    const updateChatTitle = async (chatId: string, newTitle: string) => {
        try {
            const response = await fetch(`/api/chats/${chatId}/title`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title: newTitle })
            });
            const data = await response.json() as { success: boolean };
            if (data.success) {
                setChats(chats.map(chat =>
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                ));
            }
        } catch (error) {
            console.error('Error al actualizar el título del chat:', error);
        }
    };

    const selectChat = async (chatId: string) => {
        try {
            // First get the chat details
            const chatResponse = await fetch(`/api/chats/${chatId}`);
            const chatData = await chatResponse.json() as { id: string; title: string; last_message_at: string } | { error: string };
            
            if ('error' in chatData) {
                console.error('Error in API response:', chatData.error);
                return;
            }

            // Then get the messages for this chat
            const messagesResponse = await fetch(`/api/chats/${chatId}/messages`);
            const messagesData = await messagesResponse.json() as { success: boolean; messages: ChatMessage[] };

            if (!messagesData.success) {
                console.error('Error fetching messages:', messagesData);
                return;
            }

            const chat: LocalChatData = {
                id: chatData.id,
                title: chatData.title,
                lastMessageAt: new Date(chatData.last_message_at),
                messages: messagesData.messages.map((msg: ChatMessage) => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt)
                })) as LocalMessage[]
            };

            // Emitir evento para actualizar el chat en la interfaz principal
            window.dispatchEvent(new CustomEvent('chatSelected', { 
                detail: { 
                    chatId, 
                    messages: chat.messages,
                    isInitialLoad: chatId === '3xytdwIhg9AimViz'
                }
            }));
        } catch (error) {
            console.error('Error al cargar el chat:', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Panel lateral */}
                    <motion.div
                        className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-neutral-900 z-50
                        border-r border-neutral-200 dark:border-neutral-700"
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    >
                        <div className="flex flex-col h-full">
                            {/* Cabecera */}
                            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                                    Menú Principal
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                    onClick={onClose}
                                >
                                    <X weight="bold" className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 overflow-y-auto space-y-6 p-4">
                                {/* Acciones principales */}
                                <div className="space-y-2">
                                    <button
                                        onClick={onNewChat}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                                        text-neutral-700 dark:text-neutral-300
                                        hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                        dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                        transition-all duration-300 transform hover:translate-x-1 group/item"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                                        <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Nuevo Chat</span>
                                    </button>

                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                                        text-neutral-700 dark:text-neutral-300
                                        hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                        dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                        transition-all duration-300 transform hover:translate-x-1 group/item"
                                        onClick={onOpenSettings}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                                        <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Configuración</span>
                                    </button>

                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                                        text-neutral-700 dark:text-neutral-300
                                        hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                        dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                        transition-all duration-300 transform hover:translate-x-1 group/item"
                                        onClick={onOpenTools}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                                        <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Herramientas</span>
                                    </button>

                                    <button
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                                        text-neutral-700 dark:text-neutral-300
                                        hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                        dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                        transition-all duration-300 transform hover:translate-x-1 group/item"
                                        onClick={onClearHistory}
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                                        <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Limpiar historial</span>
                                    </button>
                                </div>

                                {/* Chats recientes */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 px-2">Chats Recientes</h3>
                                    <div className="space-y-1">
                                        {chats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className={`flex items-center justify-between p-3 cursor-pointer
                                                    hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                                    dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                                    ${selectedChatId === chat.id ? 'bg-gradient-to-r from-[#F48120]/20 to-purple-500/20' : ''}`}
                                                onClick={() => onChatSelect(chat.id)}
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <ChatText weight="duotone" className="w-4 h-4 text-[#F48120]" />
                                                    <span className="text-sm font-medium">{chat.title}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingChat(chat);
                                                    }}
                                                    className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                                                >
                                                    <PencilSimple weight="duotone" className="w-4 h-4 text-neutral-500 hover:text-[#F48120]" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
            {editingChat && (
                <EditTitleModal
                    isOpen={true}
                    onClose={() => setEditingChat(null)}
                    onSave={(newTitle) => updateChatTitle(editingChat.id, newTitle)}
                    currentTitle={editingChat.title}
                />
            )}
        </AnimatePresence>
    );
}