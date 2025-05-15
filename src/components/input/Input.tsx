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
          "pr-12 truncate cursor-pointer",
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
      {/* <button
        type="button"
        className="absolute right-2 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors bg-ob-btn-secondary-bg"
        onClick={() => setIsModalOpen(true)}
      >
        <ArrowsOut size={20} />
      </button> */}

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
        />
      </Modal>
    </div>
  );
};
