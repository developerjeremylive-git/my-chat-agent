import { cn } from "@/lib/utils";
import { useState } from "react";
import { ArrowsOut } from "@phosphor-icons/react";
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

export const Input = ({
  className,
  size = "base",
  onChange,
  value,
  onValueChange,
  ...props
}: InputProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="relative flex items-center w-full overflow-hidden">
      <input
        className={cn(
          inputClasses,
          {
            "add-size-sm": size === "sm",
            "add-size-md": size === "md",
            "add-size-base": size === "base",
          },
          "pr-12 truncate mr-11 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 focus:ring-2 focus:ring-orange-500/20 dark:focus:ring-purple-500/20",
          className
        )}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          onChange?.(e);
          onValueChange?.(e.target.value);
        }}
        value={value}
        {...props}
      />
      <button
        type="button"
        className="absolute right-0.5 p-1.5 text-neutral-400 hover:text-orange-500 dark:hover:text-orange-400 transition-all duration-300 bg-gradient-to-br from-orange-50 to-purple-50 dark:from-orange-500/5 dark:to-purple-500/5 hover:from-orange-100 hover:to-purple-100 dark:hover:from-orange-500/10 dark:hover:to-purple-500/10 rounded-lg border border-orange-200/50 dark:border-purple-700/30 shadow-sm hover:shadow-orange-500/10 dark:hover:shadow-purple-500/10 hover:scale-105 transform"
        onClick={() => setIsModalOpen(true)}
      >
        <ArrowsOut size={20} />
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="w-full max-w-6xl mx-auto "
      >
        <textarea
          className="w-full h-[calc(90vh-13rem)] p-4 bg-transparent border-none focus:outline-none resize-none text-base md:text-lg"
          value={value as string}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onChange?.(e as any);
            onValueChange?.(e.target.value);
          }}
          {...props}
          autoFocus
        />
      </Modal>
    </div>
  );
};
