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
    onOpenSettings: () => void;
    onOpenTools: () => void;
    onClearHistory: () => void;
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

export function SideMenu({ isOpen, onClose, onOpenSettings, onOpenTools, onClearHistory }: SideMenuProps) {
    const [chats, setChats] = useState<LocalChatData[]>([]);
    const [currentChat, setCurrentChat] = useState<LocalChatData | null>(null);
    const [editingChat, setEditingChat] = useState<LocalChatData | null>(null);

    useEffect(() => {
        // Cargar chats al montar el componente y seleccionar el primero
        const loadInitialChats = async () => {
            await fetchChats();
        };
        loadInitialChats();
    }, []);

    const fetchChats = async () => {
        try {
            const response = await fetch('/api/chats');
            const data = await response.json() as ChatData[];
            const formattedChats = data.map((chat) => ({
                ...chat,
                lastMessageAt: new Date(chat.lastMessageAt),
                messages: chat.messages.map(msg => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt)
                })) as LocalMessage[]
            }));
            setChats(formattedChats);

            // Seleccionar automáticamente el primer chat si existe
            if (formattedChats.length > 0 && !currentChat) {
                await selectChat(formattedChats[0].id);
                // Emitir evento para actualizar la interfaz principal con el primer chat
                window.dispatchEvent(new CustomEvent('initialChatLoaded', { 
                    detail: { 
                        chatId: formattedChats[0].id,
                        messages: formattedChats[0].messages 
                    }
                }));
            }
        } catch (error) {
            console.error('Error al cargar los chats:', error);
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
            const data = await response.json() as { success: boolean; chat: ChatData };
            
            if (!response.ok) {
                throw new Error('Error al crear el chat');
            }

            if (data.success && data.chat) {
                const newChat = data.chat;
                setChats([...chats, { 
                    ...newChat, 
                    lastMessageAt: new Date(newChat.lastMessageAt),
                    messages: newChat.messages.map(msg => ({
                        ...msg,
                        createdAt: new Date(msg.createdAt)
                    })) as LocalMessage[]
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
            // Obtener el chat y sus mensajes del servidor
            const response = await fetch(`/api/chats/${chatId}`);
            const chatData = await response.json() as ChatData | { error: string };
            
            if ('error' in chatData) {
                console.error('Error in API response:', chatData.error);
                return;
            }

            const chat: LocalChatData = {
                id: chatData.id,
                title: chatData.title,
                lastMessageAt: new Date(chatData.lastMessageAt),
                messages: chatData.messages ? chatData.messages.map((msg: ChatMessage) => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt)
                })) as LocalMessage[] : []
                };
                setCurrentChat(chat);
                // Emitir evento para actualizar el chat en la interfaz principal
                window.dispatchEvent(new CustomEvent('chatSelected', { 
                    detail: { chatId, messages: chat.messages }
                }));
        } catch (error) {
            console.error('Error al cargar el chat:', error);
        }
    };

    // Escuchar eventos de actualización de chats
    useEffect(() => {
        const handleChatsUpdated = (event: CustomEvent<{ chats: LocalChatData[] }>) => {
            const updatedChats = event.detail.chats.map(chat => ({
                ...chat,
                lastMessageAt: new Date(chat.lastMessageAt),
                messages: chat.messages.map(msg => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt)
                }))
            }));
            setChats(updatedChats);
        };

        window.addEventListener('chatsUpdated', handleChatsUpdated as EventListener);

        return () => {
            window.removeEventListener('chatsUpdated', handleChatsUpdated as EventListener);
        };
    }, []);

    return (
        <AnimatePresence>
            {editingChat && (
                <EditTitleModal
                    isOpen={true}
                    onClose={() => setEditingChat(null)}
                    onSave={(newTitle) => {
                        updateChatTitle(editingChat.id, newTitle);
                        setEditingChat(null);
                    }}
                    currentTitle={editingChat.title}
                />
            )}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    {/* Menú lateral */}
                    <motion.div
                        initial={{ x: -300 }}
                        animate={{ x: 0 }}
                        exit={{ x: -300 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed left-0 top-0 h-full w-[280px] bg-white dark:bg-neutral-900 shadow-xl z-50
                      border-r border-neutral-200/50 dark:border-neutral-700/50"
                    >
                        <div className="flex flex-col h-full">
                            {/* Encabezado */}
                            <div className="flex items-center justify-between p-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
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
                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Acciones principales */}
                                <div className="space-y-2">
                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="w-full justify-start gap-3 p-3 rounded-xl
                             bg-gradient-to-r from-[#F48120]/10 to-purple-500/10
                             hover:from-[#F48120]/20 hover:to-purple-500/20
                             dark:from-[#F48120]/5 dark:to-purple-500/5
                             dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15"
                                        onClick={createChat}
                                    >
                                        <ChatText weight="duotone" className="w-5 h-5 text-[#F48120]" />
                                        <span>Nuevo Chat</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="w-full justify-start gap-3 p-3 rounded-xl"
                                        onClick={onOpenSettings}
                                    >
                                        <Gear weight="duotone" className="w-5 h-5" />
                                        <span>Configuración</span>
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="lg"
                                        className="w-full justify-start gap-3 p-3 rounded-xl"
                                        onClick={onOpenTools}
                                    >
                                        <Rocket weight="duotone" className="w-5 h-5" />
                                        <span>Herramientas</span>
                                    </Button>
                                </div>

                                {/* Lista de chats */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 px-2">Chats Recientes</h3>
                                    <div className="space-y-1">
                                        {chats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer
                                  transition-all duration-200 group/chat
                                  ${currentChat?.id === chat.id
                                                        ? 'bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10'
                                                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                                onClick={() => selectChat(chat.id)}
                                            >
                                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                                    <ChatText
                                                        weight="duotone"
                                                        className={`w-4 h-4 ${currentChat?.id === chat.id ? 'text-[#F48120]' : 'text-neutral-500'}`}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm font-medium text-neutral-900 dark:text-white truncate">
                                                                {chat.title}
                                                            </h4>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingChat(chat);
                                                                }}
                                                                className="opacity-0 group-hover/chat:opacity-100 transition-opacity"
                                                            >
                                                                <PencilSimple weight="duotone" className="w-4 h-4 text-neutral-500 hover:text-[#F48120]" />
                                                            </button>
                                                        </div>
                                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                            {formatDistanceToNow(chat.lastMessageAt, { addSuffix: true, locale: es })}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Pie del menú */}
                            <div className="p-4 border-t border-neutral-200/50 dark:border-neutral-700/50">
                                <Button
                                    variant="ghost"
                                    size="lg"
                                    className="w-full justify-start gap-3 p-3 rounded-xl text-red-600 dark:text-red-400
                           hover:bg-red-100 dark:hover:bg-red-900/20"
                                    onClick={onClearHistory}
                                >
                                    <Trash weight="duotone" className="w-5 h-5" />
                                    <span>Limpiar Historial</span>
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}