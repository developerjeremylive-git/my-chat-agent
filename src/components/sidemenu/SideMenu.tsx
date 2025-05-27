import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/button/Button';
import { X, ChatText, Gear, Brain, Rocket, Trash, PencilSimple, Warning, DotsThreeVertical } from '@phosphor-icons/react';
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
        <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-70"
            onClick={(e) => {
                // Prevent closing when clicking inside the modal
                e.stopPropagation();
                e.preventDefault();
            }}
        >
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-96 relative">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700"
                    aria-label="Cerrar"
                >
                    <X size={20} weight="bold" className="text-neutral-500" />
                </button>
                
                <h3 className="text-lg font-semibold mb-4 pr-6">Editar título del chat</h3>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 border rounded-lg mb-4 bg-transparent"
                        placeholder="Ingrese el nuevo título"
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-[#F48120] text-white hover:bg-[#e67300] transition-colors"
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
    const [chatToDelete, setChatToDelete] = useState<LocalChatData | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState('Nuevo Chat');
    
    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (editingChat) {
                setEditingChat(null);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [editingChat]);

    useEffect(() => {
        // Cargar chats al montar el componente y seleccionar el chat por defecto
        const loadInitialChats = async () => {
            try {
                // Cargar lista de chats con sus mensajes
                const response = await fetch('/api/chats');
                if (!response.ok) {
                    throw new Error('Failed to fetch chats');
                }
                const data = await response.json() as ChatData[];
                
                // Formatear los chats
                const formattedChats = data.map((chat) => ({
                    ...chat,
                    lastMessageAt: new Date(chat.lastMessageAt),
                    messages: []
                }));

                // Cargar mensajes para cada chat
                // const chatsWithMessages = await Promise.all(
                //     data.map(async (chat) => {
                //         try {
                //             const messagesResponse = await fetch(`/api/chats/${chat.id}/messages`);
                //             if (messagesResponse.ok) {
                //                 const messages = await messagesResponse.json();
                //                 if (Array.isArray(messages)) {
                //                     return {
                //                         ...chat,
                //                         messages: messages.map(msg => ({
                //                             ...msg,
                //                             createdAt: new Date(msg.createdAt)
                //                         }))
                //                     };
                //                 }
                //             }
                //             return chat;
                //         } catch (error) {
                //             console.error(`Error loading messages for chat ${chat.id}:`, error);
                //             return chat;
                //         }
                //     })
                // );

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
            const data = await response.json() as ChatData[];
            const formattedChats = data.map((chat) => ({
                ...chat,
                lastMessageAt: new Date(chat.lastMessageAt),
                messages: []
            }));
            setChats(formattedChats);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const handleCreateChat = async (title: string) => {
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title || 'Nuevo Chat'
                })
            });
            
            if (!response.ok) {
                throw new Error('Error al crear el chat');
            }

            const data = await response.json() as { success: boolean; chat: ChatData };
            
            if (data.success && data.chat) {
                const newChat: LocalChatData = {
                    id: data.chat.id,
                    title: data.chat.title,
                    lastMessageAt: new Date(data.chat.lastMessageAt),
                    messages: []
                };
                
                setChats(prevChats => [...prevChats, newChat]);
                await fetchChats(); // Actualizar la lista completa de chats
                onNewChat(); // Cerrar el menú lateral
                selectChat(newChat.id); // Seleccionar el nuevo chat
            } else {
                throw new Error('Formato de respuesta inválido');
            }
        } catch (error) {
            console.error('Error al crear el chat:', error);
            alert(error instanceof Error ? error.message : 'Error al crear el chat');
        } finally {
            setShowNewChatModal(false);
            setNewChatTitle('Nuevo Chat');
        }
    };

    const createChat = () => {
        setShowNewChatModal(true);
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
            
            if (!response.ok) {
                throw new Error('Error al actualizar el título del chat');
            }

            const data = await response.json() as { success: boolean; chat: ChatData };
            
            if (data.success) {
                setChats(prevChats => prevChats.map(chat =>
                    chat.id === chatId ? { ...chat, title: newTitle } : chat
                ));
                await fetchChats(); // Actualizar la lista completa de chats
            } else {
                throw new Error('Error al actualizar el título del chat');
            }
        } catch (error) {
            console.error('Error al actualizar el título del chat:', error);
            alert(error instanceof Error ? error.message : 'Error al actualizar el título del chat');
        }
    };

    const selectChat = async (chatId: string) => {
        try {
            // Obtener detalles del chat
            const chatResponse = await fetch(`/api/chats/${chatId}`);
            const chatData = await chatResponse.json() as ChatData | { error: string };
            
            if ('error' in chatData) {
                console.error('Error en la respuesta de la API:', chatData.error);
                return;
            }

            // Obtener todos los mensajes del chat
            const messagesResponse = await fetch(`/api/chats/${chatId}/messages`);
            const messagesData = await messagesResponse.json();

            // Verificar que los mensajes sean un array válido
            if (!Array.isArray(messagesData)) {
                console.error('Error: Los mensajes no son un array válido');
                return;
            }

            // Procesar y formatear los mensajes
            const formattedMessages = messagesData.map((msg: ChatMessage) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: new Date(msg.createdAt),
                parts: msg.parts || []
            })) as LocalMessage[];

            const chat: LocalChatData = {
                id: chatData.id,
                title: chatData.title,
                lastMessageAt: new Date(chatData.lastMessageAt),
                messages: formattedMessages
            };

            // Actualizar el estado local de los chats
            setChats(prevChats =>
                prevChats.map(prevChat =>
                    prevChat.id === chatId ? { ...prevChat, messages: formattedMessages } : prevChat
                )
            );

            // Emitir evento para actualizar la interfaz principal
            window.dispatchEvent(new CustomEvent('chatSelected', { 
                detail: { 
                    chatId, 
                    messages: formattedMessages,
                    isInitialLoad: false
                }
            }));

            // Seleccionar el chat actual
            onChatSelect(chatId);
        } catch (error) {
            console.error('Error al cargar el chat:', error);
        }
    };


    const handleDeleteChat = async (chatId: string) => {
        try {
            // Delete from the server
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                throw new Error('Failed to delete chat');
            }
            
            // Update local state
            const updatedChats = chats.filter(chat => chat.id !== chatId);
            setChats(updatedChats);
            
            // If the deleted chat was selected, clear the selection and create a new chat
            if (selectedChatId === chatId) {
                // onNewChat();
                createChat();
            }
        } catch (error) {
            console.error('Error deleting chat:', error);
            alert('Error al eliminar el chat. Por favor, inténtalo de nuevo.');
        } finally {
            setChatToDelete(null);
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
                        className="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-neutral-900 z-70
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
                                            onClick={() => createChat()}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                                        text-neutral-700 dark:text-neutral-300
                                        hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                        dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                        transition-all duration-300 transform hover:translate-x-1 group/item"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                                        <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Nuevo Chat</span>
                                    </button>

                                    {/* <button
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
                                    </button> */}
                                </div>

                                {/* Chats recientes */}
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 px-2">Chats Recientes</h3>
                                    <div className="space-y-1">
                                        {chats.map((chat) => (
                                            <div
                                                key={chat.id}
                                                className={`group relative flex items-center justify-between p-3 cursor-pointer
                                                    hover:bg-gradient-to-r hover:from-[#F48120]/5 hover:to-purple-500/5
                                                    dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                                    rounded-lg transition-colors duration-200
                                                    ${selectedChatId === chat.id ? 'bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 border border-[#F48120]/20' : 'border border-transparent'}`}
                                                onClick={() => onChatSelect(chat.id)}
                                            >
                                                <div className="flex items-center min-w-0 flex-1">
                                                    <ChatText 
                                                        weight="duotone" 
                                                        className="w-4 h-4 text-[#F48120] flex-shrink-0" 
                                                    />
                                                    <span 
                                                        className="ml-3 text-sm font-medium truncate text-ellipsis overflow-hidden"
                                                        title={chat.title}
                                                    >
                                                        {chat.title}
                                                    </span>
                                                </div>
                                                
                                                <div className="relative">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingChat(prev => prev?.id === chat.id ? null : chat);
                                                        }}
                                                        className="p-1.5 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors"
                                                    >
                                                        <DotsThreeVertical weight="bold" className="w-4 h-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200" />
                                                    </button>
                                                    
                                                    {/* Dropdown Menu */}
                                                    {editingChat?.id === chat.id && (
                                                        <div 
                                                            className="absolute right-0 mt-1 w-40 bg-white dark:bg-neutral-800 rounded-md shadow-lg py-1 z-10 border border-neutral-200 dark:border-neutral-700"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                onClick={() => {
                                                                    setEditingChat(chat);
                                                                    setShowEditModal(true);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center"
                                                            >
                                                                <PencilSimple weight="duotone" className="w-4 h-4 mr-2" />
                                                                Editar título
                                                            </button>
                                                            <button
                                                                onClick={() => setChatToDelete(chat)}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center"
                                                            >
                                                                <Trash weight="duotone" className="w-4 h-4 mr-2" />
                                                                Eliminar chat
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
            {showEditModal && editingChat && (
                <EditTitleModal
                    isOpen={true}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingChat(null);
                    }}
                    onSave={async (newTitle) => {
                        await updateChatTitle(editingChat.id, newTitle);
                        setShowEditModal(false);
                        setEditingChat(null);
                    }}
                    currentTitle={editingChat.title}
                />
            )}
            
            {/* Delete Confirmation Modal */}
            {chatToDelete && (
                <div key={`delete-modal-${chatToDelete.id}`} className="fixed inset-0 bg-black/50 flex items-center justify-center z-70 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-3 mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
                                <Warning size={32} weight="fill" className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">¿Eliminar chat?</h3>
                            <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                                ¿Estás seguro de que deseas eliminar "{chatToDelete.title}"? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="ghost"
                                    className="flex-1"
                                    onClick={() => setChatToDelete(null)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleDeleteChat(chatToDelete.id)}
                                >
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-70">
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Nuevo Chat</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleCreateChat(newChatTitle);
                        }}>
                            <input
                                type="text"
                                value={newChatTitle}
                                onChange={(e) => setNewChatTitle(e.target.value)}
                                className="w-full p-2 border rounded-lg mb-4 bg-transparent"
                                placeholder="Ingrese el título del chat"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewChatModal(false)}
                                    className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-[#F48120] text-white"
                                >
                                    Crear
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}