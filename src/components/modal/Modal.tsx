import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import useClickOutside from "@/hooks/useClickOutside";
import { X, ArrowsOut, PaperPlaneRight, ArrowsIn } from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type ModalProps = {
  className?: string;
  children: React.ReactNode;
  clickOutsideToClose?: boolean;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  hideSubmitButton?: boolean;
};

export const Modal = ({
  className,
  children,
  clickOutsideToClose = false,
  isOpen,
  onClose,
  hideSubmitButton = false,
}: ModalProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user, setIsLoginOpen } = useAuth();
  const modalRef = clickOutsideToClose
    ? useClickOutside(onClose)
    : useRef<HTMLDivElement>(null);

  // Cerrar el modal cuando isModalOpen cambia a true
  useEffect(() => {
    if (isModalOpen) {
      onClose();
      setIsModalOpen(false);
    }
  }, [isModalOpen, onClose]);

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

    // Solo aplicar el enfoque inicial si no estamos en un elemento de entrada
    if (firstElement && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')) {
      firstElement.focus();
    }

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

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[min(95vw,800px)] mx-auto my-8">
        <Card
          className={cn("reveal reveal-sm relative z-50 w-full max-h-[90vh] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:bg-gray-900 transform transition-all duration-300", className)}
          ref={modalRef}
          tabIndex={-1}
        >
          <Button
            aria-label="Cerrar modal"
            shape="square"
            className="absolute right-4 top-4 z-[60] bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
            onClick={onClose}
            variant="ghost"
            size="sm"
          >
            <X size={20} weight="bold" />
          </Button>
          <div className="sticky top-0 z-50 flex items-center border-b border-gray-200 bg-white px-6 py-4 dark:bg-gray-900">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de texto</h2>
          </div>

          <div className="flex-1 h-[min(calc(90vh-12rem),calc(900px-12rem))] overflow-y-auto p-4 sm:p-6">
            {children}
          </div>
          <div className="sticky bottom-0 w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 sm:px-6 py-3 sm:py-4 z-[60]">
            <div className="flex justify-between items-center">
            <Button
              aria-label="Expandir modal"
              shape="square"
              className={cn(
                "bg-white dark:bg-gray-900 text-ob-base-200 hover:text-ob-base-300 p-2 rounded-full transition-all duration-200 transform hover:scale-110",
                {
                  "opacity-50 cursor-not-allowed": !children,
                  "hover:rotate-180": children
                }
              )}
              onClick={onClose}
              variant="ghost"
              size="sm"
              disabled={!children}
            >
               <ArrowsIn size={16} weight="bold" />
            </Button>
            {!hideSubmitButton && (
              <Button
                aria-label="Enviar texto"
                shape="square"
                className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
                onClick={() => {
                  if (!user) {
                    setIsLoginOpen(true);
                    return;
                  }
                  setIsModalOpen(true);
                }}
                variant="ghost"
                size="sm"
                disabled={!user}
              >
                <PaperPlaneRight size={20} weight="bold" />
              </Button>
            )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  // Use createPortal to render the modal outside the component hierarchy
  return createPortal(modalContent, document.body);
};
