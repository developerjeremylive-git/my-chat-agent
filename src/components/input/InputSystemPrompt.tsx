import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { ArrowsOut, Plus, FloppyDisk, CaretDown, Trash, PencilSimple } from "@phosphor-icons/react";
import { Modal } from "../modal/Modal";

export const inputClasses = cn(
  "bg-ob-btn-secondary-bg text-ob-base-300 border-ob-border focus:border-ob-border-active placeholder:text-ob-base-100 add-disable border border-1 transition-colors focus:outline-none"
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    if (promptToEdit && editPromptName.trim() && editPromptContent.trim()) {
      const updatedPrompts = savedPrompts.map(p => 
        p.id === promptToEdit.id 
          ? { ...p, name: editPromptName, content: editPromptContent }
          : p
      );
      setSavedPrompts(updatedPrompts);
      localStorage.setItem("systemPrompts", JSON.stringify(updatedPrompts));
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDropdownOpen && 
          dropdownRef.current && 
          buttonRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !buttonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative flex items-center">
        <input
          className={cn(
            inputClasses,
            {
              "add-size-sm": size === "sm",
              "add-size-md": size === "md",
              "add-size-base": size === "base",
            },
            "w-full pr-24 truncate cursor-pointer", // Add right padding for buttons
            className
          )}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          onClick={() => setIsModalOpen(true)}
          value={value}
          {...props}
        />
        <div className="absolute right-2 flex items-center space-x-1">
          <button
            type="button"
            className="p-1.5 text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 hover:bg-orange-100/50 dark:hover:bg-orange-500/10 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsPromptModalOpen(true);
            }}
            title="Guardar Consulta del Sistema"
          >
            <Plus size={16} />
          </button>
          <div className="h-4 w-px bg-neutral-300 dark:bg-neutral-600"></div>
          <button
            ref={buttonRef}
            type="button"
            className="p-1.5 text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-200 hover:bg-orange-100/50 dark:hover:bg-orange-500/10 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
            title="Ver Consultas del Sistema guardadas"
          >
            <CaretDown size={16} />
          </button>
        </div>
      </div>

      {isDropdownOpen && savedPrompts.length > 0 && (
        <div className="w-full max-w-[min(calc(100%-1rem),600px)] absolute right-0 bottom-full mb-1 bg-gradient-to-br from-white to-purple-50 dark:from-neutral-900 dark:to-purple-900/10 border border-orange-200 dark:border-purple-700/50 rounded-lg shadow-lg shadow-orange-500/5 dark:shadow-purple-500/5 z-20 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 hover:scrollbar-thumb-orange-300 dark:scrollbar-thumb-purple-700 dark:hover:scrollbar-thumb-purple-600 scrollbar-track-transparent backdrop-blur-sm">
          {savedPrompts.map((prompt) => (
            <div
              key={prompt.id}
              className="group flex items-center px-4 py-3 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 dark:hover:from-orange-500/10 dark:hover:to-purple-500/10 transition-all duration-300 border-b border-orange-100/20 dark:border-purple-700/20 last:border-b-0"
            >
              <button
                className="flex-grow text-left group-hover:scale-[1.01] transition-transform duration-300 min-w-0"
                onClick={() => selectPrompt(prompt)}
              >
                <div className="font-medium text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">{prompt.name}</div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 truncate transition-colors duration-300 max-w-[400px]">
                  {prompt.content}
                </div>
              </button>
              <div className="flex gap-2">
                <button
                  className="p-2 text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 hover:scale-110 hover:rotate-2"
                  onClick={(e) => handleEditClick(e, prompt)}
                  title="Editar prompt"
                >
                  <PencilSimple size={20} />
                </button>
                <button
                  className="p-2 text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 hover:scale-110 hover:rotate-2"
                  onClick={(e) => handleDeleteClick(e, prompt)}
                  title="Eliminar prompt"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createPortal(
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          className="w-full max-w-6xl mx-auto"
          hideSubmitButton={true}
        >
          <textarea
            className="w-full h-[calc(90vh-13rem)] p-4 bg-transparent border-none focus:outline-none resize-none text-base md:text-lg"
            value={value as string}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              onChange?.(e as any);
              onValueChange?.(e.target.value);
            }}
            {...props}
          />
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
          <div className="p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Guardar Prompt del Sistema</h3>
            <input
              type="text"
              placeholder="Nombre del prompt"
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10"
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                onClick={() => setIsPromptModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#F48120] text-white hover:bg-[#F48120]/90 transition-colors flex items-center gap-2"
                onClick={savePrompt}
              >
                <FloppyDisk size={20} />
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
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center gap-2"
                onClick={confirmDelete}
              >
                <Trash size={20} />
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
                  setEditPromptName("");
                  setEditPromptContent("");
                }}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-[#F48120] text-white hover:bg-[#F48120]/90 transition-colors flex items-center gap-2"
                onClick={confirmEdit}
              >
                <FloppyDisk size={20} />
                Guardar
              </button>
            </div>
          </div>
        </Modal>,
        document.body
      )}
    </div>
  );
};
