import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { ArrowsOut, Plus, FloppyDisk, CaretDown, Trash, PencilSimple, MagnifyingGlass, X, NotePencil } from "@phosphor-icons/react";
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
  compact?: boolean;
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
  compact = false,
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

    const handleOpenSystemPrompt = (event: CustomEvent) => {
      const { content, source, triggerSave } = event.detail;
      
      // Update the input value through the proper React way
      if (onChange) {
        const syntheticEvent = {
          target: { 
            value: content,
            name: props.name || 'systemPrompt'
          }
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
      
      // Update through onValueChange if provided
      onValueChange?.(content);
      
      // Store the content in state for the save prompt modal
      setEditPromptContent(content);
      
      // If this is coming from OIAI creator or triggerSave is true, open the save prompt modal
      if (source === 'oiai-creator' || triggerSave) {
        // Use a small timeout to ensure the state updates have taken effect
        setTimeout(() => {
          setIsPromptModalOpen(true);
          
          // Focus the prompt name input after the modal is open
          setTimeout(() => {
            const nameInput = document.getElementById('prompt-name') as HTMLInputElement;
            if (nameInput) {
              nameInput.focus();
              // Select all text in the input for easier renaming
              nameInput.select();
            }
          }, 100);
        }, 50);
      }
      
      // Update the input element's value directly
      const inputElements = document.querySelectorAll(`[name="${props.name || 'systemPrompt'}"]`);
      inputElements.forEach((el: Element) => {
        const input = el as HTMLInputElement;
        if (input && input.value !== content) {
          input.value = content;
          // Trigger React's onChange handler
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
      });
      
      // Also update any textarea that might be used for the system prompt
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        if (textarea.name === (props.name || 'systemPrompt') && textarea.value !== content) {
          textarea.value = content;
          const event = new Event('input', { bubbles: true });
          textarea.dispatchEvent(event);
        }
      });
    };

    // @ts-ignore - CustomEvent type needs to be handled
    window.addEventListener('openSystemPrompt', handleOpenSystemPrompt);
    
    return () => {
      // @ts-ignore - CustomEvent type needs to be handled
      window.removeEventListener('openSystemPrompt', handleOpenSystemPrompt);
    };
  }, [onChange, onValueChange]);

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

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex flex-col items-center justify-end"
          onClick={(e) => {
            // Only close if clicking on the backdrop, not on the modal content
            if (e.target === e.currentTarget) {
              setIsDropdownOpen(false);
            }
          }}
        >
          <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl flex flex-col mx-auto overflow-hidden">
            {/* Fixed Header Section */}
            <div className="flex flex-col flex-none sticky top-0 z-10 bg-white dark:bg-gray-900">
              {/* Header */}
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Prompt del Sistema</h3>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  aria-label="Cerrar"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlass className="h-4 w-4 text-gray-400" weight="bold" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar prompts del sistema..."
                    className="block w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                    autoComplete="off"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label="Limpiar búsqueda"
                    >
                      <X size={16} weight="bold" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto">
              {savedPrompts.length > 0 ? (
                savedPrompts
                  .filter(prompt => 
                    searchTerm === '' || 
                    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group flex items-center justify-between p-4 hover:bg-gray-50/80 dark:hover:bg-gray-800/80 active:bg-gray-100 dark:active:bg-gray-700/80 transition-colors duration-150 border-b border-gray-100 dark:border-gray-800 last:border-0"
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
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(e, prompt);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50/80 dark:hover:bg-blue-900/30 transition-colors"
                          title="Editar prompt"
                        >
                          <PencilSimple size={16} weight="fill" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(e, prompt);
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-50/80 dark:hover:bg-red-900/30 transition-colors"
                          title="Eliminar prompt"
                        >
                          <Trash size={16} weight="fill" />
                        </button>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="p-3 mb-4 rounded-full bg-gray-100 dark:bg-gray-800">
                    <NotePencil size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-gray-900 dark:text-white font-medium">No hay prompts guardados</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Crea tu primer prompt para comenzar</p>
                </div>
              )}
            </div>
            
            {/* Add New Button */}
            <div className="sticky bottom-0 p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  setEditPromptName('Nuevo System Prompt');
                  setEditPromptContent('');
                  setPromptToEdit({
                    id: '',
                    name: 'Nuevo System Prompt',
                    content: ''
                  });
                  setIsEditModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center space-x-2 transition-colors shadow hover:shadow-md active:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                <Plus size={18} weight="bold" />
                <span>Nuevo System Prompt</span>
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
