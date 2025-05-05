import { useState } from 'react';
import { Button } from '@/components/button/Button';
import { cn } from '@/lib/utils';
import { List, X, Brain, Code, Lightbulb, Robot, ChartLine, Moon, Sun } from '@phosphor-icons/react';
import AuthPopup from '../AuthPopup';
import AuthButton from '../AuthButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  onThemeChange: () => void;
}

export function Sidebar({ isOpen, onClose, theme, onThemeChange }: SidebarProps) {
  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out shadow-2xl',
          theme === 'dark' ? 'bg-gradient-to-b from-neutral-900 to-neutral-950' : 'bg-gradient-to-b from-white to-gray-100',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <div className="flex items-center space-x-2">
              <Robot className="text-[#F48120] h-6 w-6" />
              <span className="cn('font-semibold', theme === 'dark' ? 'text-white' : 'text-gray-900')">Asistente Inteligente</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              shape="square"
              className="text-neutral-400 hover:text-white"
              onClick={onClose}
            >
              <X size={20} />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-4">
            <div className="space-y-2">
              <div className="cn('text-xs uppercase tracking-wider', theme === 'dark' ? 'text-neutral-400' : 'text-gray-500')">Principal</div>
              <div className="space-y-1">
                  <AuthButton className="flex" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="cn('text-xs uppercase tracking-wider', theme === 'dark' ? 'text-neutral-400' : 'text-gray-500')">Características</div>
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start cn('hover:bg-opacity-50', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200')"
                >
                  <Code className="mr-2" />
                  Asistente de Código
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start cn('hover:bg-opacity-50', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200')"
                >
                  <Lightbulb className="mr-2" />
                  Investigación IA
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start cn('hover:bg-opacity-50', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200')"
                >
                  <ChartLine className="mr-2" />
                  Análisis Avanzado
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start opacity-50 cursor-not-allowed cn('hover:bg-opacity-50', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200')"
                  disabled
                >
                  <Brain className="mr-2" />
                  Multi-Agente (Próximamente)
                </Button>
              </div>
            </div>
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 border-t cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <Button
              variant="ghost"
              className="w-full justify-start cn('hover:bg-opacity-50', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-neutral-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200')"
              onClick={onThemeChange}
            >
              {theme === "dark" ? <Sun className="mr-2" /> : <Moon className="mr-2" />}
              {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            </Button>
            <div className="mt-4 text-xs text-neutral-500 text-center">
              Potenciado por Tecnología IA Avanzada
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <AuthPopup/> 
    </>
  );
}