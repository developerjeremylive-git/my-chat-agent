import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { ArrowsOut, Plus, FloppyDisk, CaretDown, Trash, PencilSimple, MagnifyingGlass, X } from "@phosphor-icons/react";
import { Modal } from "../modal/Modal";

export const inputClasses = cn(
  "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-gray-400 focus:border-gray-400 dark:focus:ring-gray-500 dark:focus:border-gray-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200"
);

export type InputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
  "size"
> & {
  className?: string;
  size?: "sm" | "md" | "base";
  onValueChange?: (value: string) => void;
};

interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

export const InputSystemPrompt = ({
  className,
  size = "base",
  onChange,
  value,
  onValueChange,
  ...props
}: InputProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [savedPrompts, setSavedPrompts] = useState<SystemPrompt[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promptToDelete, setPromptToDelete] = useState<SystemPrompt | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [promptToEdit, setPromptToEdit] = useState<SystemPrompt | null>(null);
  const [editPromptName, setEditPromptName] = useState("");
  const [editPromptContent, setEditPromptContent] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadedPrompts = localStorage.getItem("systemPrompts");
    if (loadedPrompts) {
      setSavedPrompts(JSON.parse(loadedPrompts));
    }
  }, []);

  const savePrompt = () => {
    if (!promptName.trim() || !value) return;

    const newPrompt: SystemPrompt = {
      id: Date.now().toString(),
      name: promptName,
      content: value as string,
    };

    const updatedPrompts = [...savedPrompts, newPrompt];
    setSavedPrompts(updatedPrompts);
    localStorage.setItem("systemPrompts", JSON.stringify(updatedPrompts));
    setIsPromptModalOpen(false);
    setPromptName("");
  };

  const selectPrompt = (prompt: SystemPrompt) => {
    if (onChange) {
      const event = {
        target: { value: prompt.content }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
    onValueChange?.(prompt.content);
    setIsDropdownOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, prompt: SystemPrompt) => {
    e.stopPropagation();
    setPromptToDelete(prompt);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, prompt: SystemPrompt) => {
    e.stopPropagation();
    setPromptToEdit(prompt);
    setEditPromptName(prompt.name);
    setEditPromptContent(prompt.content);
    setIsEditModalOpen(true);
  };

  const confirmEdit = () => {
    if (editPromptName.trim() && editPromptContent.trim()) {
      let updatedPrompts;
      
      if (promptToEdit?.id) {
        // Update existing prompt
        updatedPrompts = savedPrompts.map(p => 
          p.id === promptToEdit.id 
            ? { ...p, name: editPromptName, content: editPromptContent }
            : p
        );
      } else {
        // Create new prompt
        const newPrompt: SystemPrompt = {
          id: Date.now().toString(),
          name: editPromptName,
          content: editPromptContent,
        };
        updatedPrompts = [...savedPrompts, newPrompt];
      }
      
      setSavedPrompts(updatedPrompts);
      localStorage.setItem("systemPrompts", JSON.stringify(updatedPrompts));
      
      // If this is a new prompt and we're in the input field, update the input value
      if (!promptToEdit?.id && onValueChange) {
        onValueChange(editPromptContent);
      }
      
      setIsEditModalOpen(false);
      setPromptToEdit(null);
      setEditPromptName("");
      setEditPromptContent("");
    }
  };

  const confirmDelete = () => {
    if (promptToDelete) {
      const updatedPrompts = savedPrompts.filter(p => p.id !== promptToDelete.id);
      setSavedPrompts(updatedPrompts);
      localStorage.setItem("systemPrompts", JSON.stringify(updatedPrompts));
    }
    setIsDeleteModalOpen(false);
    setPromptToDelete(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center w-full bg-white dark:bg-gray-800 rounded-md shadow-sm">
        <div className="relative flex-1 min-w-0">
          <input
            className={cn(
              inputClasses,
              {
                "text-sm py-1.5 px-2": size === "sm",
                "text-base py-2 px-3": size === "md",
                "text-base py-2.5 px-4": size === "base",
              },
              "w-full truncate text-ellipsis overflow-hidden whitespace-nowrap",
              className
            )}
            style={{
              textOverflow: 'ellipsis',
            }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          value={value}
          title={String(value || '')}
            {...props}
          />
        </div>
        <div className="flex-shrink-0 flex items-center space-x-0.5 sm:space-x-1 ml-1 pr-1">
          <button
            type="button"
            className="p-1.5 sm:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsModalOpen(true);
            }}
            title="Abrir editor de prompt"
          >
            <ArrowsOut size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600 mx-0.5"></div>
          <button
            type="button"
            className="p-1.5 sm:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsPromptModalOpen(true);
            }}
            title="Guardar Consulta del Sistema"
          >
            <Plus size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600 mx-0.5"></div>
          <button
            ref={buttonRef}
            type="button"
            className="p-1.5 sm:p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            title="Ver Consultas del Sistema guardadas"
          >
            <CaretDown size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {isDropdownOpen && savedPrompts.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 dark:bg-opacity-70 flex flex-col items-center justify-end">
          <div 
            className="w-full max-h-[85vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col"
            style={{ boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1), 0 -10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Prompts</h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Cerrar"
              >
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" weight="bold" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar prompts..."
                  className="w-full pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto">
              {savedPrompts
                .filter(prompt => 
                  searchTerm === '' || 
                  prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((prompt) => (
                <div
                  key={prompt.id}
                  className="group flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700 transition-colors duration-150 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  onClick={() => {
                    selectPrompt(prompt);
                    setIsDropdownOpen(false);
                  }}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="font-medium text-gray-900 dark:text-white truncate">{prompt.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {prompt.content}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(e, prompt);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/30"
                      title="Editar prompt"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, prompt);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30"
                      title="Eliminar prompt"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add New Button */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setEditPromptName('Nuevo Prompt');
                  setEditPromptContent('');
                  setPromptToEdit({
                    id: '',
                    name: 'Nuevo Prompt',
                    content: ''
                  });
                  setIsEditModalOpen(true);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors"
              >
                <Plus size={18} />
                <span>Nuevo Prompt</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {createPortal(
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="w-full max-w-6xl mx-auto flex flex-col"
          hideSubmitButton={true}
        >
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de Prompt</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Edita el contenido del prompt del sistema
            </p>
          </div>
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto p-1">
              <textarea
                className="w-full h-full min-h-[200px] p-4 text-base md:text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                value={value as string}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  onChange?.(e as any);
                  onValueChange?.(e.target.value);
                }}
                placeholder="Escribe aquí el prompt del sistema..."
                aria-label="Editor de prompt del sistema"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                autoCorrect="off"
                {...props}
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </Modal>,
        document.body
      )}

      {createPortal(
        <Modal
          isOpen={isPromptModalOpen}
          onClose={() => setIsPromptModalOpen(false)}
          className="w-full max-w-[min(95vw,500px)] mx-auto"
          hideSubmitButton={true}
        >
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Guardar Prompt del Sistema</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Asigna un nombre descriptivo para tu prompt</p>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="prompt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del prompt
                </label>
                <input
                  id="prompt-name"
                  type="text"
                  placeholder="Ej: Respuestas profesionales"
                  className="w-full px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                onClick={() => setIsPromptModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                onClick={savePrompt}
              >
                <FloppyDisk size={18} weight="bold" />
                Guardar
              </button>
            </div>
          </div>
        </Modal>,
        document.body
      )}

      {createPortal(
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setPromptToDelete(null);
          }}
          className="w-full max-w-[min(95vw,500px)] mx-auto"
          hideSubmitButton={true}
        >
          <div className="p-5 sm:p-6 space-y-5">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
                <Trash size={24} className="text-red-600 dark:text-red-400" weight="fill" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">¿Eliminar prompt?</h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ¿Estás seguro de que deseas eliminar "{promptToDelete?.name}"? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPromptToDelete(null);
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                onClick={confirmDelete}
              >
                <Trash size={18} weight="bold" />
                Eliminar
              </button>
            </div>
          </div>
        </Modal>,
        document.body
      )}

      {createPortal(
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setPromptToEdit(null);
            setEditPromptName("");
            setEditPromptContent("");
          }}
          className="w-full max-w-[min(95vw,500px)] mx-auto"
          hideSubmitButton={true}
        >
          <div className="p-5 sm:p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Editar Prompt del Sistema</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza los detalles del prompt</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-prompt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del prompt
                </label>
                <input
                  id="edit-prompt-name"
                  type="text"
                  placeholder="Ej: Respuestas profesionales"
                  className="w-full px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  value={editPromptName}
                  onChange={(e) => setEditPromptName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="edit-prompt-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contenido
                </label>
                <textarea
                  id="edit-prompt-content"
                  placeholder="Escribe el contenido del prompt..."
                  className="w-full h-40 px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                  value={editPromptContent}
                  onChange={(e) => setEditPromptContent(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setPromptToEdit(null);
                  setEditPromptName("");
                  setEditPromptContent("");
                }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                onClick={confirmEdit}
              >
                <FloppyDisk size={18} weight="bold" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </Modal>,
        document.body
      )}
    </div>
  );
};
