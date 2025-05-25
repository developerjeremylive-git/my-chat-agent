import { useState, useEffect } from 'react';
import { Modal } from '../modal/Modal';
import { Card } from '../card/Card';
import { PencilSimple, Trash, ChatText, Plus, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface SystemPrompt {
    id: string;
    name: string;
    content: string;
}

interface SystemPromptDashboardProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SystemPromptDashboard({ isOpen, onClose }: SystemPromptDashboardProps) {
    const [savedPrompts, setSavedPrompts] = useState<SystemPrompt[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [promptToDelete, setPromptToDelete] = useState<SystemPrompt | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [promptToEdit, setPromptToEdit] = useState<SystemPrompt | null>(null);
    const [editPromptName, setEditPromptName] = useState('');
    const [editPromptContent, setEditPromptContent] = useState('');

    useEffect(() => {
        const loadedPrompts = localStorage.getItem('systemPrompts');
        if (loadedPrompts) {
            setSavedPrompts(JSON.parse(loadedPrompts));
        }
    }, []);

    const handleEditClick = (prompt: SystemPrompt) => {
        setPromptToEdit(prompt);
        setEditPromptName(prompt.name);
        setEditPromptContent(prompt.content);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (prompt: SystemPrompt) => {
        setPromptToDelete(prompt);
        setIsDeleteModalOpen(true);
    };

    const confirmEdit = () => {
        if (editPromptName.trim() && editPromptContent.trim()) {
            const newPrompt: SystemPrompt = promptToEdit
                ? { ...promptToEdit, name: editPromptName, content: editPromptContent }
                : {
                    id: Date.now().toString(),
                    name: editPromptName,
                    content: editPromptContent
                };

            const updatedPrompts = promptToEdit
                ? savedPrompts.map(p => p.id === promptToEdit.id ? newPrompt : p)
                : [...savedPrompts, newPrompt];

            setSavedPrompts(updatedPrompts);
            localStorage.setItem('systemPrompts', JSON.stringify(updatedPrompts));
            setIsEditModalOpen(false);
            setPromptToEdit(null);
            setEditPromptName('');
            setEditPromptContent('');
        }
    };

    const confirmDelete = () => {
        if (promptToDelete) {
            const updatedPrompts = savedPrompts.filter(p => p.id !== promptToDelete.id);
            setSavedPrompts(updatedPrompts);
            localStorage.setItem('systemPrompts', JSON.stringify(updatedPrompts));
        }
        setIsDeleteModalOpen(false);
        setPromptToDelete(null);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4"
                        onClick={onClose}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-6xl h-[calc(100vh-2rem)] flex items-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Card className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl p-8 relative overflow-hidden border-0 shadow-2xl rounded-3xl w-full max-h-full flex flex-col">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 z-0"></div>

                                <button
                                    className="z-20 absolute right-6 top-6 rounded-full w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 hover:bg-[#F48120]/20 hover:text-[#F48120] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                                    onClick={onClose}
                                >
                                    <X weight="bold" size={20} />
                                </button>

                                <div className="relative z-10 mb-8 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-2">
                                            Consultas del Sistema
                                        </h2>
                                        <p className="text-lg text-neutral-600 dark:text-neutral-400">
                                            Gestiona tus Consultas del Sistema personalizados
                                        </p>
                                    </div>
                                    <button
                                        className="mr-13 bg-gradient-to-r from-[#F48120] to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl px-6 py-3 flex items-center gap-2"
                                        onClick={() => setIsEditModalOpen(true)}
                                    >
                                        <Plus size={20} weight="bold" />
                                        Crear Consulta del Sistema
                                    </button>
                                </div>

                                <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 hover:scrollbar-thumb-orange-300 dark:scrollbar-thumb-purple-700 dark:hover:scrollbar-thumb-purple-600 scrollbar-track-transparent pr-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-min pb-4 px-4">
                                            {savedPrompts.map((prompt) => (
                                                <motion.div
                                                    key={prompt.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                                    className="group"
                                                    style={{ perspective: '1000px' }}
                                                >
                                                    <Card className="mt-2 group relative overflow-visible p-6 h-full border border-neutral-200/50 dark:border-neutral-700/50 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 transition-all duration-500 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-neutral-900/40 hover:bg-white/60 dark:hover:bg-neutral-800/60 shadow-lg hover:shadow-xl transform-gpu hover:scale-[1.05] hover:rotate-y-[-5deg] will-change-transform">
                                                        <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>

                                                        <div className="relative z-10 flex flex-col h-full">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="p-2 rounded-xl bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 group-hover:scale-110 transition-transform duration-500">
                                                                    <ChatText size={24} weight="duotone" className="text-[#F48120]" />
                                                                </div>
                                                                <h3 className="text-xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                                                                    {prompt.name}
                                                                </h3>
                                                            </div>

                                                            <p className="text-neutral-600 dark:text-neutral-400 mb-6 flex-grow text-lg line-clamp-3">
                                                                {prompt.content}
                                                            </p>

                                                            <div className="flex justify-end gap-3">
                                                                <button
                                                                    className="flex items-center gap-2 text-[#F48120] hover:bg-[#F48120]/10 transition-all duration-300 rounded-xl px-4 py-2 transform hover:scale-105"
                                                                    onClick={() => handleEditClick(prompt)}
                                                                >
                                                                    <PencilSimple size={18} weight="duotone" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-all duration-300 rounded-xl px-4 py-2 transform hover:scale-105"
                                                                    onClick={() => handleDeleteClick(prompt)}
                                                                >
                                                                    <Trash size={18} weight="duotone" />
                                                                    Eliminar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Edición */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setPromptToEdit(null);
                    setEditPromptName('');
                    setEditPromptContent('');
                }}
                className="w-full max-w-[min(95vw,500px)] mx-auto"
                hideSubmitButton={true}
            >
                <div className="p-4 sm:p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Editar Prompt del Sistema</h3>
                    <input
                        type="text"
                        placeholder="Nombre del prompt"
                        className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10"
                        value={editPromptName}
                        onChange={(e) => setEditPromptName(e.target.value)}
                    />
                    <textarea
                        placeholder="Contenido del prompt"
                        className="w-full h-40 px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10 resize-none"
                        value={editPromptContent}
                        onChange={(e) => setEditPromptContent(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            onClick={() => {
                                setIsEditModalOpen(false);
                                setPromptToEdit(null);
                                setEditPromptName('');
                                setEditPromptContent('');
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-[#F48120] text-white hover:bg-[#F48120]/90 transition-colors"
                            onClick={confirmEdit}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Eliminación */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setPromptToDelete(null);
                }}
                className="w-full max-w-[min(95vw,500px)] mx-auto"
                hideSubmitButton={true}
            >
                <div className="p-4 sm:p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Confirmar Eliminación</h3>
                    <p className="text-neutral-700 dark:text-neutral-300">
                        ¿Estás seguro de que deseas eliminar el prompt "{promptToDelete?.name}"?
                    </p>
                    <div className="flex justify-end gap-2">
                        <button
                            className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setPromptToDelete(null);
                            }}
                        >
                            Cancelar
                        </button>
                        <button
                            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                            onClick={confirmDelete}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}