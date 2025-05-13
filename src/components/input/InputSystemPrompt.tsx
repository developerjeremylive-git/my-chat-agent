import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { ArrowsOut, Plus, FloppyDisk, CaretDown } from "@phosphor-icons/react";
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

  return (
    <div className="relative flex flex-col w-full overflow-visible">
      <div className="flex justify-end gap-1 mb-2">
        <button
          type="button"
          className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-ob-btn-secondary-bg rounded-lg"
          onClick={() => setIsModalOpen(true)}
          title="Expandir"
        >
          <ArrowsOut size={20} />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-ob-btn-secondary-bg rounded-lg"
          onClick={() => setIsPromptModalOpen(true)}
          title="Guardar prompt"
        >
          <Plus size={20} />
        </button>
        <button
          type="button"
          className="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-ob-btn-secondary-bg rounded-lg"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Ver prompts guardados"
        >
          <CaretDown size={20} />
        </button>
      </div>
      <div className="relative flex-1">
        <input
          className={cn(
            inputClasses,
            {
              "add-size-sm": size === "sm",
              "add-size-md": size === "md",
              "add-size-base": size === "base",
            },
            "truncate",
            className
          )}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e);
            onValueChange?.(e.target.value);
          }}
          value={value}
          {...props}
        />
      </div>

      {isDropdownOpen && savedPrompts.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          {savedPrompts.map((prompt) => (
            <button
              key={prompt.id}
              className="w-full px-4 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              onClick={() => selectPrompt(prompt)}
            >
              <div className="font-medium text-neutral-900 dark:text-white">{prompt.name}</div>
              <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">
                {prompt.content}
              </div>
            </button>
          ))}
        </div>
      )}

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
      </Modal>

      <Modal
        isOpen={isPromptModalOpen}
        onClose={() => setIsPromptModalOpen(false)}
        className="w-full max-w-md mx-auto"
        hideSubmitButton={true}
      >
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Guardar Prompt del Sistema</h3>
          <input
            type="text"
            placeholder="Nombre del prompt"
            className="w-full px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10"
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
      </Modal>
    </div>
  );
};
