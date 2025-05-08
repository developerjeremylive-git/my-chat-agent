import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import useClickOutside from "@/hooks/useClickOutside";
import { X } from "@phosphor-icons/react";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ModalProps = {
  className?: string;
  children: React.ReactNode;
  clickOutsideToClose?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

export const Modal = ({
  className,
  children,
  clickOutsideToClose = false,
  isOpen,
  onClose,
}: ModalProps) => {
  const modalRef = clickOutsideToClose
    ? useClickOutside(onClose)
    : useRef<HTMLDivElement>(null);

  // Stop site overflow when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Tab focus
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'a, button, input, textarea, select, details, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) firstElement.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        if (e.shiftKey) {
          // Shift + Tab moves focus backward
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab moves focus forward
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, modalRef.current]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-transparent">
      <div 
        className="fade fixed inset-0 bg-black/40 backdrop-blur-md bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[95vw] mx-auto">
        <Button
          aria-label="Cerrar modal"
          shape="square"
          className="absolute right-2 top-2 z-[60] bg-white/95 text-ob-base-200 hover:text-ob-base-300 p-2 rounded-full shadow-lg dark:bg-gray-900/95 transition-colors duration-200"
          onClick={onClose}
          variant="ghost"
          size="sm"
        >
          <X size={16} weight="bold" />
        </Button>

        <Card
          className={cn("reveal reveal-sm relative z-50 w-full max-h-[90vh] overflow-hidden rounded-xl border border-gray-200/10 bg-white/95 shadow-2xl dark:bg-gray-900/95", className)}
          ref={modalRef}
          tabIndex={-1}
        >
          <div className="sticky top-0 z-50 flex items-center border-b border-gray-200/10 bg-white/80 px-6 py-4 backdrop-blur-sm dark:bg-gray-900/80">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de texto</h2>
          </div>

          <div className="flex-1 p-6 space-y-6 h-[calc(100vh-10rem)]">
            {children}
          </div>
        </Card>
      </div>
    </div>
  );
};
