import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/button/Button';
import { X, ChatText, Gear, Brain, Rocket, Trash, PencilSimple, Warning, DotsThreeVertical, PushPin, PushPinSlash, Plus, FolderSimple } from '@phosphor-icons/react';
import { useChat } from '@/contexts/ChatContext';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

interface ChatApiData {
    id: string;
    title: string;
    lastMessageAt: string;
    workspaceId?: string | null;
}
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { WorkspaceModal, type WorkspaceFormData } from '@/components/workspace/WorkspaceModal';

interface TemplateSelection {
  id: string;
  title: string;
  description: string;
  instructions: string;
}
import { useNotification } from '@/contexts/NotificationContext';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { NavigationSection } from '@/components/navigation/NavigationSection';

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
    const { deleteChat: deleteChatFromContext } = useChat();
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
    const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
    const [expandedWorkspace, setExpandedWorkspace] = useState<string | null>(null);
    const [workspaceToEdit, setWorkspaceToEdit] = useState<Workspace | null>(null);
    const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [templateInstructions, setTemplateInstructions] = useState('');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [systemPrompt, setSystemPrompt] = useState('');

    const [templateData, setTemplateData] = useState<Partial<WorkspaceFormData>>({});

    const handleNewWorkspace = (template?: TemplateSelection) => {
        setWorkspaceToEdit(null);
        setSystemPrompt('');
        
        if (template) {
            setTemplateData({
                title: template.title,
                description: template.description,
                instructions: template.instructions
            });
        } else {
            setTemplateData({});
        }
        
        setShowWorkspaceModal(true);
    };

    const handleTemplateSelect = (template: TemplateSelection) => {
        handleNewWorkspace(template);
    };

    // Handle system prompt from OIAICreator
    useEffect(() => {
        const handleSystemPrompt = async () => {
            // Get the system prompt from localStorage or any other source
            const prompt = localStorage.getItem('systemPrompt') || '';
            setSystemPrompt(prompt);
            handleNewWorkspace();
        };

        window.addEventListener('openSystemPrompt', handleSystemPrompt as EventListener);
        return () => {
            window.removeEventListener('openSystemPrompt', handleSystemPrompt as EventListener);
        };
    }, []);
    
    const { showNotification } = useNotification();
    
    const deleteWorkspace = async () => {
        if (!workspaceToDelete) return;
        
        try {
            // Remove the workspace from the list
            const updatedWorkspaces = workspaces.filter(w => w.id !== workspaceToDelete.id);
            setWorkspaces(updatedWorkspaces);
            localStorage.setItem('workspaces', JSON.stringify(updatedWorkspaces));
            
            // If the deleted workspace was selected, clear the selection
            if (selectedWorkspace === workspaceToDelete.id) {
                setSelectedWorkspace(null);
                localStorage.removeItem('selectedWorkspace');
            }
            
            showNotification('Espacio eliminado correctamente', 3000, 'success');
        } catch (error) {
            console.error('Error deleting workspace:', error);
            showNotification('Error al eliminar el espacio', 5000, 'error');
        } finally {
            setShowDeleteDialog(false);
            setWorkspaceToDelete(null);
        }
    };

    // Load workspaces when component mounts
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

    const handleCreateWorkspace = async (data: {
        title: string;
        emoji: string;
        emojiColor?: string;
        description: string;
        instructions: string;
    }) => {
        try {
            const response = await fetch('/api/workspaces', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: data.title,
                    emoji: data.emoji,
                    emoji_color: data.emojiColor,
                    description: data.description,
                    instructions: data.instructions
                }),
            });

            // Define the API response type
            interface CreateWorkspaceResponse {
                success: boolean;
                data: {
                    id: string;
                    title: string;
                    emoji: string;
                    description?: string;
                    instructions?: string;
                    created_at: string;
                    updated_at: string;
                    emoji_color?: string;
                };
                error?: string;
            }

            const result: CreateWorkspaceResponse = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create workspace');
            }

            // Convert the API response to match our Workspace type
            const newWorkspace: Workspace = {
                id: result.data.id,
                title: result.data.title,
                emoji: result.data.emoji,
                description: result.data.description || '',
                instructions: result.data.instructions || '',
                createdAt: new Date(result.data.created_at),
                updatedAt: new Date(result.data.updated_at)
            };

            // Update local state
            setWorkspaces(prev => [...prev, newWorkspace]);
            setShowWorkspaceModal(false);
            
            // Automatically select the newly created workspace
            setSelectedWorkspace(newWorkspace.id);
            await fetchChats(newWorkspace.id);
            
            // Show success notification
            showSuccess('Espacio de trabajo creado y seleccionado', 3000);
            
        } catch (error) {
            console.error('Error creating workspace:', error);
            showError(
                `Error al crear el espacio de trabajo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                5000
            );
        }
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

    const { showSuccess, showError, showDeletion, showInfo } = useNotification();

    const handleDeleteWorkspace = async (workspace: Workspace) => {
        // Close the menu if it's not static (floating state)
        if (!isStatic) {
            onClose();
        }
        setWorkspaceToDelete(workspace);
        setShowDeleteDialog(true);
    };

    const confirmDeleteWorkspace = async () => {
        if (!workspaceToDelete) return;

        try {
            // First, check if the workspace has any chats
            const chatsResponse = await fetch(`/api/chats?workspaceId=${workspaceToDelete.id}`);
            const chatsResult = await chatsResponse.json() as ApiResponse<ChatApiData[]>;
            const hasChats = chatsResult.data && chatsResult.data.length > 0;

            // Then proceed with workspace deletion
            const response = await fetch(`/api/workspaces/${workspaceToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            interface DeleteResponse {
                success: boolean;
                error?: string;
                message?: string;
            }

            const result: DeleteResponse = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete workspace');
            }


            // Update local state
            setWorkspaces(prev => prev.filter(w => w.id !== workspaceToDelete.id));

            // Show appropriate notification based on whether there were chats
            if (hasChats) {
                showDeletion('Los chats se han movido al listado de "Chats Recientes"', 2000);
            } else {
                showDeletion('Espacio de trabajo eliminado correctamente', 2000);
            }

            // If the deleted workspace was selected, clear the selection
            if (selectedWorkspace === workspaceToDelete.id) {
                setSelectedWorkspace(null);
                fetchChats();
            }
        } catch (error) {
            console.error('Error deleting workspace:', error);
            showError(
                `Error al eliminar el espacio de trabajo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                5000
            );
        } finally {
            setShowDeleteDialog(false);
            setWorkspaceToDelete(null);
        }
    };

    const toggleWorkspace = async (workspaceId: string) => {
        if (selectedWorkspace === workspaceId) {
            // Si se hace clic en el mismo espacio de trabajo, deseleccionarlo
            setSelectedWorkspace(null);
            await fetchChats();
            setExpandedWorkspace(prev => prev === workspaceId ? null : workspaceId);
            return;
        }

        // Seleccionar el espacio de trabajo y cargar sus chats
        setSelectedWorkspace(workspaceId);
        
        try {
            const url = `/api/chats?workspaceId=${workspaceId}`;
            const response = await fetch(url);
            const result = await response.json() as ApiResponse<ChatApiData[]>;

            if (!result.success) {
                throw new Error(result.error || 'Error al cargar los chats');
            }

            // Formatear los chats
            const formattedChats = (result.data || []).map((chat) => ({
                id: chat.id,
                title: chat.title,
                lastMessageAt: new Date(chat.lastMessageAt || Date()),
                messages: [],
                workspaceId: chat.workspaceId || undefined
            }));

            setChats(formattedChats);
            setExpandedWorkspace(prev => prev === workspaceId ? null : workspaceId);

            // Si hay chats, seleccionar el más reciente
            if (formattedChats.length > 0) {
                // Ordenar por lastMessageAt de más reciente a más antiguo
                const sortedChats = [...formattedChats].sort((a, b) => 
                    b.lastMessageAt.getTime() - a.lastMessageAt.getTime()
                );
                onChatSelect(sortedChats[0].id);
            } else {
                // Mostrar notificación si no hay chats
                showInfo('Este espacio de trabajo no tiene chats creados', 3000);
            }
        } catch (error) {
            console.error('Error al cargar los chats del espacio de trabajo:', error);
            showError('Error al cargar los chats del espacio de trabajo', 3000);
        }
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
                const result = await response.json() as ApiResponse<ChatApiData[]>;

                if (!result.success) {
                    throw new Error(result.error || 'Failed to fetch chats');
                }

                // Formatear los chats
                const formattedChats = (result.data || []).map((chat) => ({
                    id: chat.id,
                    title: chat.title,
                    lastMessageAt: new Date(chat.lastMessageAt || Date.now()),
                    messages: [],
                    workspaceId: chat.workspaceId || undefined
                }));

                setChats(formattedChats);
                // Cargar mensajes para cada chat
                // const chatsWithMessages = await Promise.all(
                //     formattedChats.map(async (chat) => {
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
                // setChats(chatsWithMessages);
            } catch (error) {
                console.error('Error loading chats:', error);
            }
        };
        loadInitialChats();
    }, []);

    const fetchChats = async (workspaceId?: string | null) => {
        try {
            const url = workspaceId
                ? `/api/chats?workspaceId=${workspaceId}`
                : '/api/chats';

            const response = await fetch(url);
            const result = await response.json() as ApiResponse<ChatApiData[]>;

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch chats');
            }

            // Formatear los chats
            const formattedChats = (result.data || []).map((chat) => ({
                id: chat.id,
                title: chat.title,
                lastMessageAt: new Date(chat.lastMessageAt || Date.now()),
                messages: [],
                workspaceId: chat.workspaceId || undefined
            }));

            setChats(formattedChats);
            // Cargar mensajes para cada chat
            // const chatsWithMessages = await Promise.all(
            //     formattedChats.map(async (chat) => {
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
            // setChats(chatsWithMessages);
        } catch (error) {
            console.error('Error loading chats:', error);
            // Optionally show an error message to the user
            // setError('Failed to load chats. Please try again.');
        }
    };

    const handleCreateChat = async (title: string) => {
        try {
            // Si no hay workspace seleccionado, se envía null explícitamente
            const workspaceId = selectedWorkspace || null;

            console.log('Creating chat with:', { title, workspaceId });

            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title || 'Nuevo Chat',
                    workspaceId: workspaceId // Puede ser string o null
                })
            });

            const responseText = await response.text();
            let result;

            try {
                result = responseText ? JSON.parse(responseText) : null;
                console.log('API Response:', result);
            } catch (e) {
                console.error('Error parsing JSON response:', e);
                throw new Error(`Error al analizar la respuesta del servidor: ${responseText}`);
            }

            if (!response.ok) {
                const errorMessage = result?.error ||
                    result?.message ||
                    `Error ${response.status}: ${response.statusText}`;
                throw new Error(errorMessage);
            }

            if (!result || typeof result !== 'object') {
                throw new Error('La respuesta del servidor no es un objeto válido');
            }

            // Verificar si la respuesta tiene el formato esperado
            if (!result.success) {
                throw new Error(result.error || 'Error al crear el chat');
            }

            const chatData = result.data || result.chat || result;

            if (!chatData || !chatData.id) {
                console.error('Datos de chat inválidos en la respuesta:', chatData);
                throw new Error('Datos de chat inválidos en la respuesta del servidor');
            }

            const newChat: LocalChatData = {
                id: chatData.id,
                title: chatData.title || 'Nuevo Chat',
                lastMessageAt: new Date(chatData.lastMessageAt || Date.now()),
                messages: [],
                workspaceId: chatData.workspaceId || undefined
            };

            console.log('New chat created:', newChat);

            setChats(prevChats => [...prevChats, newChat]);
            await fetchChats(workspaceId); // Actualizar la lista de chats con el workspaceId actual
            onNewChat(); // Cerrar el menú lateral
            selectChat(newChat.id); // Seleccionar el nuevo chat
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

            const result = await response.json() as ApiResponse<ChatData>;

            if (result.success && result.data) {
                setChats(prevChats => prevChats.map(chat =>
                    chat.id === chatId ? {
                        ...chat,
                        title: newTitle,
                        lastMessageAt: new Date(result.data!.lastMessageAt || Date.now())
                    } : chat
                ));
                await fetchChats(); // Actualizar la lista completa de chats
            } else {
                throw new Error(result.error || 'Error al actualizar el título del chat');
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
            const chatResult = await chatResponse.json() as ApiResponse<ChatData>;

            if (!chatResult.success || !chatResult.data) {
                console.error('Error en la respuesta de la API:', chatResult.error || 'Datos de chat no válidos');
                return;
            }

            // Obtener todos los mensajes del chat
            const messagesResponse = await fetch(`/api/chats/${chatId}/messages`);
            const messagesResult = await messagesResponse.json() as ApiResponse<ChatMessage[]>;

            // Verificar si messagesResult es exitoso y tiene datos
            if (!messagesResult.success) {
                console.error('Error al cargar mensajes:', messagesResult.error);
                return;
            }

            const messages = messagesResult.data || [];

            // Formatear los mensajes
            const formattedMessages: LocalMessage[] = messages.map((msg) => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: new Date(msg.createdAt),
                parts: (msg as any).parts || []
            }));

            // Actualizar el estado local con los mensajes
            const updatedChat: LocalChatData = {
                id: chatResult.data.id,
                title: chatResult.data.title,
                lastMessageAt: new Date(chatResult.data.lastMessageAt || Date.now()),
                messages: formattedMessages,
                workspaceId: chatResult.data.workspaceId
            };

            // Actualizar el estado local de los chats
            setChats(prevChats =>
                prevChats.map(prevChat =>
                    prevChat.id === chatId ? { ...prevChat, ...updatedChat } : prevChat
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
            // First, delete the chat from the database
            const response = await fetch(`/api/chats/${chatId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({})) as { error?: string };
                throw new Error(errorData?.error || 'Failed to delete chat from server');
            }

            // Notify ChatContext about the deletion
            if (deleteChatFromContext) {
                deleteChatFromContext(chatId);
            }

            // Clear the selected chat ID in localStorage to prevent auto-selection
            localStorage.removeItem('selectedChatId');
            
            // If the deleted chat was selected, clear the selection
            const wasSelected = selectedChatId === chatId;
            if (wasSelected) {
                onChatSelect('');
                // Clear any pending chat selection in the URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            // Remove from local state
            const updatedChats = chats.filter(chat => chat.id !== chatId);
            setChats(updatedChats);
            
            // Remove from localStorage
            const savedChats = JSON.parse(localStorage.getItem('chats') || '[]');
            const updatedSavedChats = savedChats.filter((chat: any) => chat.id !== chatId);
            localStorage.setItem('chats', JSON.stringify(updatedSavedChats));
            
            // Close the delete confirmation dialog
            setChatToDelete(null);
            
            // No cerrar el menú aquí, ya que puede provocar que se vuelva a abrir
            // El menú se manejará desde el nivel superior
            
            showNotification('Chat eliminado correctamente', 3000, 'success');
        } catch (error) {
            console.error('Error deleting chat:', error);
            showNotification(
                error instanceof Error ? error.message : 'Error al eliminar el chat', 
                5000, 
                'error'
            );
            
            // Refresh chats to restore the deleted chat that wasn't actually deleted
            fetchChats(selectedWorkspace);
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
                                <div className="flex items-center gap-2">
                                    <h2 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                                        {selectedWorkspace ? 'Espacio actual' : 'Espacios de trabajo'}
                                    </h2>
                                    {selectedWorkspace && (
                                        <button
                                            onClick={() => {
                                                setSelectedWorkspace(null);
                                                fetchChats();
                                            }}
                                            className="text-xs text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                            title="Ver todos los chats"
                                        >
                                            (ver todos)
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mr-2">
                                    <div className="relative group">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className={`hidden md:flex rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ${isStatic ? 'text-[#F48120]' : ''}`}
                                            onClick={toggleStatic}
                                        >
                                            {isStatic ?
                                                <PushPinSlash weight="fill" className="w-5 h-5" /> :
                                                <PushPin weight="fill" className="w-5 h-5" />
                                            }
                                        </Button>
                                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 px-2 py-1 text-xs font-medium text-white bg-neutral-800 dark:bg-neutral-700 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            {isStatic ? "Flotante" : "Fijar"}
                                            <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-neutral-800 dark:bg-neutral-700 rotate-45"></div>
                                        </div>
                                    </div>
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
                                    setSystemPrompt('');
                                    setTemplateInstructions('');
                                }}
                                onSubmit={workspaceToEdit ? handleUpdateWorkspace : handleCreateWorkspace}
                                initialData={
                                    workspaceToEdit 
                                    ? { ...workspaceToEdit }
                                    : { ...templateData }
                                }
                                systemPrompt={systemPrompt}
                            />
                            
                            <ConfirmationDialog
                                isOpen={showDeleteDialog}
                                onClose={() => {
                                    setShowDeleteDialog(false);
                                    setWorkspaceToDelete(null);
                                }}
                                onConfirm={deleteWorkspace}
                                title="Eliminar espacio"
                                message={`¿Estás seguro de que deseas eliminar el espacio "${workspaceToDelete?.title}"? Esta acción no se puede deshacer.`}
                                confirmText="Eliminar"
                                cancelText="Cancelar"
                                isDanger={true}
                            />

                            {/* Navigation Section */}
                            <NavigationSection onTemplateSelect={handleTemplateSelect} />

                            {/* Chats Section */}
                            <div className="border-b border-neutral-200 dark:border-neutral-700 p-4">
                                <div className="flex items-center justify-between mb-3">
                                    {/* <h3 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                    Espacios de trabajo disponibles
                                    </h3> */}
                                    <button
                                        onClick={() => {
                                            setWorkspaceToEdit(null);
                                            setShowWorkspaceModal(true);
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F48120] to-purple-500 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                                        title="Crear nuevo espacio"
                                    >
                                        <Plus size={16} weight="bold" />
                                        <span>Crear Nuevo Espacio</span>
                                    </button>
                                </div>

                                {workspaces.length > 0 ? (
                                    <div className="space-y-1">
                                        {workspaces.map(workspace => (
                                            <div key={workspace.id} className="rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleWorkspace(workspace.id)}
                                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium ${expandedWorkspace === workspace.id
                                                            ? 'bg-neutral-100 dark:bg-neutral-800'
                                                            : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                                                        } transition-colors`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span
                                                            className="text-lg"
                                                            dangerouslySetInnerHTML={{ __html: workspace.emoji }}
                                                        />
                                                        <span className={`truncate ${selectedWorkspace === workspace.id ? 'font-semibold text-[#F48120]' : ''}`}>
                                                            {workspace.title}
                                                        </span>
                                                    </div>
                                                    <svg
                                                        className={`w-4 h-4 text-neutral-500 transition-transform ${expandedWorkspace === workspace.id ? 'rotate-180' : ''
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
                                                                        handleDeleteWorkspace(workspace);
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
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
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!isStatic) {
                                                                        onClose();
                                                                    }
                                                                    setTimeout(() => {
                                                                        setChatToDelete(chat);
                                                                        setEditingChat(null);
                                                                    }, 100);
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center"
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
            
            {/* Workspace Delete Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={showDeleteDialog}
                onClose={() => {
                    setShowDeleteDialog(false);
                    setWorkspaceToDelete(null);
                }}
                onConfirm={confirmDeleteWorkspace}
                title={workspaceToDelete ? `¿Eliminar espacio "${workspaceToDelete.title}"?` : '¿Eliminar espacio?'}
                message="¿Estás seguro de que quieres eliminar este espacio? Los chats no se eliminarán, pero se moverán a la sección 'TODOS los chats'."
                confirmText="Eliminar"
                cancelText="Cancelar"
                isDanger={true}
            />
        </AnimatePresence>
    );
};