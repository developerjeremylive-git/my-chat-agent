import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/button/Button';
import { X, ChatText, Gear, Brain, Rocket, Trash, PencilSimple, Warning, DotsThreeVertical, PushPin, PushPinSlash, Plus, FolderSimple } from '@phosphor-icons/react';
import { useChat } from '@/contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { WorkspaceModal } from '@/components/workspace/WorkspaceModal';

import type { ChatData, LocalMessage, LocalChatData, ChatMessage } from '@/types/chat';
import type { Workspace } from '@/lib/types/workspace';

interface EditTitleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (title: string) => void;
    currentTitle: string;
}

// Using LocalChatData from types/chat.ts
// Workspace type is imported from ../../types/workspace.ts

interface SideMenuProps {
    isOpen: boolean;
    isStatic: boolean;
    onSetStatic: (isStatic: boolean) => void;
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
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-96 relative"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close button */}
                <button
                    type="button"
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

export function SideMenu({
    isOpen,
    isStatic,
    onSetStatic,
    onClose,
    onChatSelect,
    onNewChat,
    onOpenSettings,
    onOpenTools,
    onClearHistory,
    selectedChatId
}: SideMenuProps) {
    // Toggle body class when menu is static
    useEffect(() => {
        if (isStatic) {
            document.body.classList.add('menu-static');
        } else {
            document.body.classList.remove('menu-static');
        }

        return () => {
            document.body.classList.remove('menu-static');
        };
    }, [isStatic]);

    const toggleStatic = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        const newStaticState = !isStatic;
        onSetStatic(newStaticState);

        // If making static, ensure the menu is open
        if (newStaticState) {
            // Ensure the menu stays open
            if (!isOpen) {
                // If you have a way to open the menu, call it here
                // Otherwise, we'll need to handle this case
            }
        }

        // Save to localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('menuStatic', String(newStaticState));
        }
    }, [isStatic, isOpen, onSetStatic]);

    // Handle click outside logic
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (!isOpen) return;

            const target = e.target as HTMLElement;
            // Only close if menu is not static and click is outside the menu
            if (!isStatic && !target.closest('.side-menu')) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, isStatic, onClose]);
    const [chats, setChats] = useState<LocalChatData[]>([]);
    const [editingChat, setEditingChat] = useState<LocalChatData | null>(null);
    const [chatToDelete, setChatToDelete] = useState<LocalChatData | null>(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [newChatTitle, setNewChatTitle] = useState('Nuevo Chat');
    
    // Workspace state
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
    const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState<boolean>(false);

    // Load workspaces from localStorage on mount
    useEffect(() => {
        const savedWorkspaces = localStorage.getItem('workspaces');
        if (savedWorkspaces) {
            try {
                const parsedWorkspaces = JSON.parse(savedWorkspaces);
                const workspacesWithDates = parsedWorkspaces.map((w: any) => ({
                    ...w,
                    createdAt: new Date(w.createdAt),
                    updatedAt: new Date(w.updatedAt)
                }));
                setWorkspaces(workspacesWithDates);
            } catch (error) {
                console.error('Error parsing workspaces:', error);
            }
        }
    }, []);

    // Save workspaces to localStorage when they change
    useEffect(() => {
        if (workspaces.length > 0) {
            localStorage.setItem('workspaces', JSON.stringify(workspaces));
        }
    }, [workspaces]);

    const handleCreateWorkspace = (data: {
        title: string;
        emoji: string;
        description: string;
        instructions: string;
    }) => {
        const newWorkspace: Workspace = {
            id: `workspace-${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        setWorkspaces(prev => [...prev, newWorkspace]);
        setShowWorkspaceModal(false);
    };

    const handleUpdateWorkspace = (data: {
        title: string;
        emoji: string;
        description: string;
        instructions: string;
    }) => {
        if (!workspaceToEdit) return;
        
        setWorkspaces(prev => 
            prev.map(w => 
                w.id === workspaceToEdit.id 
                    ? { ...w, ...data, updatedAt: new Date() } 
                    : w
            )
        );
        setWorkspaceToEdit(null);
        setShowWorkspaceModal(false);
    };

    const handleDeleteWorkspace = (workspaceId: string) => {
        setWorkspaces(prev => prev.filter(w => w.id !== workspaceId));
    };

    const toggleWorkspace = (workspaceId: string) => {
        setExpandedWorkspace(prev => prev === workspaceId ? null : workspaceId);
    };

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

                setChats(formattedChats);
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
        onClose();
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
                onNewChat();
                // createChat();
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
                    {/* Full-screen overlay that covers everything - only show when menu is not static */}
                    {!isStatic && (
                        <motion.div
                            className="fixed inset-0 bg-black/50 z-60"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            style={{
                                backdropFilter: 'blur(2px)',
                                WebkitBackdropFilter: 'blur(2px)'
                            }}
                        />
                    )}

                    {/* Side Panel */}
                    <motion.div
                        className={`${isStatic ? 'static-menu' : 'fixed'} left-0 top-0 bottom-0 w-80 bg-white dark:bg-neutral-900 z-70
                        border-r border-neutral-200 dark:border-neutral-700 shadow-2xl side-menu`}
                        initial={{ x: isStatic ? 0 : '-100%' }}
                        animate={{
                            x: isStatic ? 0 : 0,
                            position: isStatic ? 'relative' : 'fixed'
                        }}
                        exit={{ x: isStatic ? 0 : '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        onClick={isStatic ? undefined : (e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col h-full">
                            {/* Cabecera */}
                            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                                    {isStatic ? 'Historial' : 'Chats Historial'}
                                </h2>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`hidden md:flex rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isStatic ? 'text-[#F48120]' : ''}`}
                                        onClick={toggleStatic}
                                        title={isStatic ? "Hacer flotante" : "Fijar"}
                                    >
                                        {isStatic ?
                                            <PushPinSlash weight="fill" className="w-5 h-5" /> :
                                            <PushPin weight="fill" className="w-5 h-5" />
                                        }
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                                        onClick={onClose}
                                    >
                                        <X weight="bold" className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>

                            {/* Workspace Modal */}
                            <WorkspaceModal
                                isOpen={showWorkspaceModal}
                                onClose={() => {
                                    setShowWorkspaceModal(false);
                                    setWorkspaceToEdit(null);
                                }}
                                onSubmit={workspaceToEdit ? handleUpdateWorkspace : handleCreateWorkspace}
                                initialData={workspaceToEdit}
                            />

                            {/* Chats Section */}
                            <div className="border-b border-neutral-200 dark:border-neutral-700 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        Espacios de trabajo
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setWorkspaceToEdit(null);
                                            setShowWorkspaceModal(true);
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                        title="Nuevo espacio"
                                    >
                                        <Plus size={18} weight="bold" />
                                    </button>
                                </div>

                                {workspaces.length > 0 ? (
                                    <div className="space-y-1">
                                        {workspaces.map(workspace => (
                                            <div key={workspace.id} className="rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleWorkspace(workspace.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium ${
                                                        expandedWorkspace === workspace.id 
                                                            ? 'bg-neutral-100 dark:bg-neutral-800' 
                                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                                    } transition-colors`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{workspace.emoji}</span>
                                                        <span className="truncate">{workspace.title}</span>
                                                    </div>
                                                    <svg
                                                        className={`w-4 h-4 text-neutral-500 transition-transform ${
                                                            expandedWorkspace === workspace.id ? 'rotate-180' : ''
                                                        }`}
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                                
                                                {expandedWorkspace === workspace.id && (
                                                    <div className="pl-11 pr-2 py-1 bg-neutral-50 dark:bg-neutral-800/30">
                                                        {workspace.description && (
                                                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 line-clamp-2">
                                                                {workspace.description}
                                                            </div>
                                                        )}
                                                        <div className="flex justify-between items-center text-xs text-neutral-500 dark:text-neutral-400">
                                                            <span>
                                                                Actualizado {formatDistanceToNow(workspace.updatedAt, { addSuffix: true, locale: es })}
                                                            </span>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setWorkspaceToEdit(workspace);
                                                                        setShowWorkspaceModal(true);
                                                                    }}
                                                                    className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded"
                                                                    title="Editar espacio"
                                                                >
                                                                    <PencilSimple size={14} weight="bold" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm(`¿Estás seguro de que quieres eliminar el espacio "${workspace.title}"?`)) {
                                                                            handleDeleteWorkspace(workspace.id);
                                                                        }
                                                                    }}
                                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                                    title="Eliminar espacio"
                                                                >
                                                                    <Trash size={14} weight="bold" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <FolderSimple size={32} weight="duotone" className="mx-auto text-neutral-400 mb-2" />
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                                            Crea tu primer espacio para organizar tus chats
                                        </p>
                                        <button
                                            onClick={() => setShowWorkspaceModal(true)}
                                            className="text-sm font-medium text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center gap-1 mx-auto"
                                        >
                                            <Plus size={16} weight="bold" />
                                            <span>Nuevo espacio</span>
                                        </button>
                                    </div>
                                )}
                            </div>

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
                                                <div className="flex items-start min-w-0 flex-1">
                                                    <ChatText
                                                        weight="duotone"
                                                        className="w-4 h-4 text-[#F48120] flex-shrink-0 mt-0.5"
                                                    />
                                                    <div className="ml-3 min-w-0">
                                                        <div
                                                            className="text-sm font-medium truncate text-ellipsis overflow-hidden"
                                                            title={chat.title}
                                                        >
                                                            {chat.title}
                                                        </div>
                                                        <div className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                            {formatDistanceToNow(new Date(chat.lastMessageAt), {
                                                                addSuffix: true,
                                                                locale: es
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="relative flex-shrink-0 ml-2">
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
                                                                    onClose();
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 flex items-center"
                                                            >
                                                                <PencilSimple weight="duotone" className="w-4 h-4 mr-2" />
                                                                Editar título
                                                            </button>
                                                            <button
                                                                onClick={() =>{ setChatToDelete(chat); onClose();}}
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