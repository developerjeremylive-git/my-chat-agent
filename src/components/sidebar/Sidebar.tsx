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
          <div className="p-4 border-b cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Robot weight="duotone" className="text-[#F48120] h-7 w-7" />
                <span className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Asistente IA</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                className="rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-300 transform hover:rotate-90"
                onClick={onClose}
              >
                <X weight="bold" size={20} />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <AuthButton 
                  className="w-full bg-gradient-to-r from-[#F48120] to-purple-500 hover:from-purple-500 hover:to-[#F48120] text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                />
              </div>

              <div className="space-y-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                >
                  <Code weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                  Asistente de Código
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                >
                  <Lightbulb weight="duotone" className="mr-3 h-5 w-5 text-purple-500" />
                  Investigación IA
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                >
                  <ChartLine weight="duotone" className="mr-3 h-5 w-5 text-green-500" />
                  Análisis Avanzado
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start rounded-xl py-3 opacity-50 cursor-not-allowed cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300' : 'text-gray-700')"
                  disabled
                >
                  <Brain weight="duotone" className="mr-3 h-5 w-5" />
                  Multi-Agente (Próximamente)
                </Button>
              </div>
            </div>
          </nav>

          {/* Theme Toggle */}
          <div className="p-4 mt-auto border-t cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <Button
              variant="ghost"
              className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
              onClick={onThemeChange}
            >
              {theme === "dark" ? 
                <Sun weight="duotone" className="mr-3 h-5 w-5 text-amber-400" /> : 
                <Moon weight="duotone" className="mr-3 h-5 w-5 text-blue-400" />
              }
              {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            </Button>
            <div className="mt-4 text-xs text-center cn('text-neutral-500 hover:text-neutral-400 transition-colors duration-300', theme === 'dark' ? 'text-neutral-500' : 'text-gray-500')">
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