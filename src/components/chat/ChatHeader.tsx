import React, { useState } from 'react';
import { ModelSelect } from '@/components/model/ModelSelect';
import { Button } from '@/components/button/Button';
import { List, Bug, Gear, Brain, X, Question, Trash, Divide } from '@phosphor-icons/react';
import { Toggle } from '@/components/toggle/Toggle';
import { Card } from '../card/Card';
import { OIAICreator } from '../modal/OIAICreator';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
  textSize: 'normal' | 'large' | 'small';
  onTextSizeChange: (size: 'normal' | 'large' | 'small') => void;
}

export function ChatHeader({ onOpenSidebar, onOpenSettings, showDebug, onToggleDebug, textSize, onTextSizeChange }: ChatHeaderProps) {
  const [showOiaiGuide, setShowOiaiGuide] = useState(false);
  const [showOiaiCreator, setShowOiaiCreator] = useState(false);

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 sticky top-0 z-10 bg-background">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={onOpenSidebar}
        >
          <List size={20} />
        </Button>

        <div className="flex items-center justify-center h-8 w-8">
          <svg
            width="28px"
            height="28px"
            className="text-[#F48120]"
            data-icon="agents"
          >
            <title>Cloudflare Agents</title>
            <symbol id="ai:local:agents" viewBox="0 0 80 79">
              <path
                fill="currentColor"
                d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7"
              />
            </symbol>
            <use href="#ai:local:agents" />
          </svg>
        </div>

        <div className="flex-1">
          <h2 className="font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent hidden md:block">Asistente Inteligente</h2>
        </div>

        <div className="flex items-center gap-1 mr-2">
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            className={`rounded-full h-8 w-8 ${textSize === 'small' ? 'bg-[#F48120]/10 text-[#F48120]' : ''} hover:bg-[#F48120]/10 hover:text-[#F48120] transition-colors duration-200`}
            onClick={() => onTextSizeChange('small')}
          // title="Texto pequeño"
          >
            <span className="text-xs font-bold">A</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            className={`rounded-full h-8 w-8 ${textSize === 'normal' ? 'bg-[#F48120]/10 text-[#F48120]' : ''} hover:bg-[#F48120]/10 hover:text-[#F48120] transition-colors duration-200`}
            onClick={() => onTextSizeChange('normal')}
          // title="Texto normal"
          >
            <span className="text-sm font-bold">A</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            className={`rounded-full h-8 w-8 ${textSize === 'large' ? 'bg-[#F48120]/10 text-[#F48120]' : ''} hover:bg-[#F48120]/10 hover:text-[#F48120] transition-colors duration-200`}
            onClick={() => onTextSizeChange('large')}
          // title="Texto grande"
          >
            <span className="text-base font-bold">A</span>
          </Button>
        </div>

        {/* Botón OIAI con menú desplegable usando Radix UI */}
        {/* <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <div className="relative mr-2">
              <div
                className="relative flex items-center justify-between p-2 bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 rounded-xl
                          hover:from-[#F48120]/20 hover:to-purple-500/20 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10
                          transform hover:scale-[0.98] active:scale-[0.97]
                          cursor-pointer transition-all duration-300 group border border-[#F48120]/20 dark:border-[#F48120]/10
                          animate-pulse hover:animate-none shadow-lg hover:shadow-xl
                          overflow-hidden hover:border-[#F48120]/40 dark:hover:border-[#F48120]/20"
              >
                <div className="flex items-center gap-2">
                  <Brain weight="duotone" className="w-5 h-5 text-[#F48120]" />
                </div>
              </div>
            </div>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="min-w-[280px] bg-white/95 dark:bg-neutral-900/95 rounded-xl p-2 shadow-xl border border-neutral-200 dark:border-neutral-700/50 z-50 backdrop-blur-xl"
              sideOffset={5}
            >
              <DropdownMenu.Item
                className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10 dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5 cursor-pointer transition-all duration-300 hover:translate-x-1 hover:shadow-lg outline-none"
                onClick={() => setShowOiaiGuide(true)}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Brain weight="duotone" className="w-5 h-5 relative z-10 text-[#F48120] group-hover:text-[#F48120] transition-colors duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent transform transition-all duration-300 group-hover:scale-105">Guía etherOI</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-[#F48120] dark:group-hover:text-[#F48120] transition-colors duration-300">Aprende a crear oiai efectivos</span>
                </div>
              </DropdownMenu.Item>

              <DropdownMenu.Item
                className="group flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10 dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5 cursor-pointer transition-all duration-300 hover:translate-x-1 hover:shadow-lg outline-none"
                onClick={() => {
                  setShowOiaiGuide(false);
                  setShowOiaiCreator(true);
                }}
              >
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-full blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Brain weight="duotone" className="w-5 h-5 relative z-10 text-[#F48120] group-hover:text-[#F48120] transition-colors duration-300" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent transform transition-all duration-300 group-hover:scale-105">Creador OIAI</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 group-hover:text-[#F48120] dark:group-hover:text-[#F48120] transition-colors duration-300">Crea tu asistente personalizado</span>
                </div>
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root> */}

        {/* <div className="flex items-center gap-2 mr-2">
          <Button
            variant="ghost"
            size="md"
            shape="square"
            className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
            onClick={() => setShowOiaiGuide(true)}
          >
            <Question size={20} weight="duotone" />
          </Button>
          <ModelSelect className="flex-1" />
        </div> */}


        {/* Modal de Guía etherOI */}
        {showOiaiGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm z-50 -mx-6 px-6 border-b border-neutral-200 dark:border-neutral-800 h-[60px]">
                  <div className="flex items-center gap-3 h-full">
                    <Brain weight="duotone" className="w-8 h-8 text-[#F48120]" />
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Guía de etherOI</h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    shape="square"
                    className="rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={() => setShowOiaiGuide(false)}
                  >
                    <X weight="bold" size={20} />
                  </Button>
                </div>

                <div className="space-y-8">
                  {/* Sección 1: Introducción */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">¿Qué es oiai en etherOI?</h3>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      oiai es un asistente de IA personalizable dentro de etherOI que te ayuda a realizar tareas específicas. Puedes crear oiai personalizados para diferentes propósitos y necesidades.
                    </p>
                  </div>

                  {/* Sección 2: Componentes Clave */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Componentes clave de un oiai efectivo</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="p-4 space-y-2 bg-gradient-to-br from-[#F48120]/5 to-transparent border-[#F48120]/20">
                        <h4 className="font-medium text-[#F48120]">Persona</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Define el rol y comportamiento del oiai</p>
                      </Card>
                      <Card className="p-4 space-y-2 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                        <h4 className="font-medium text-purple-500">Tarea</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Especifica qué debe hacer o crear el oiai</p>
                      </Card>
                      <Card className="p-4 space-y-2 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                        <h4 className="font-medium text-blue-500">Contexto</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Proporciona información de fondo relevante</p>
                      </Card>
                      <Card className="p-4 space-y-2 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                        <h4 className="font-medium text-green-500">Formato</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Define la estructura deseada de las respuestas</p>
                      </Card>
                    </div>
                  </div>

                  {/* Sección 3: Pasos para Crear */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Pasos para crear un oiai</h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">1</div>
                        <div className="space-y-1">
                          <h5 className="font-medium text-neutral-900 dark:text-white">Define el propósito</h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">Establece claramente qué quieres que haga tu oiai y qué problemas debe resolver.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">2</div>
                        <div className="space-y-1">
                          <h5 className="font-medium text-neutral-900 dark:text-white">Escribe las instrucciones</h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">Proporciona instrucciones detalladas incluyendo persona, tarea, contexto y formato deseado.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">3</div>
                        <div className="space-y-1">
                          <h5 className="font-medium text-neutral-900 dark:text-white">Prueba y refina</h5>
                          <p className="text-sm text-neutral-600 dark:text-neutral-300">Realiza pruebas con diferentes prompts y ajusta las instrucciones según sea necesario.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Sección 4: Mejores Prácticas */}
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Mejores prácticas</h3>
                      <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                          <span className="text-sm">Sé específico en tus instrucciones</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                          <span className="text-sm">Incluye ejemplos cuando sea posible</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                          <span className="text-sm">Define límites claros de lo que debe y no debe hacer</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                          <span className="text-sm">Mantén las instrucciones concisas pero completas</span>
                        </li>
                      </ul>
                    </div>
                    <div className="flex-1">
                      <button
                        onClick={() => {
                          setShowOiaiGuide(false);
                          setShowOiaiCreator(true);
                        }}
                        className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5
                                  hover:from-[#F48120]/20 hover:to-purple-500/20 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10
                                  border border-[#F48120]/20 dark:border-[#F48120]/10 rounded-xl
                                  transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                                  group relative overflow-hidden animate-pulse hover:animate-none"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10 flex flex-col items-center gap-3 p-4">
                          <Brain weight="duotone" className="w-8 h-8 text-[#F48120] group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:opacity-90">Crear OIAI</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* <div className="flex items-center gap-2">
          <Bug size={16} className='hidden md:block' />
          <div className='hidden md:block'>
            <Toggle
              toggled={showDebug}
              aria-label="Toggle debug mode"
              onClick={onToggleDebug}
            />
          </div>
        </div> */}

        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={onOpenSettings}
        >
          <Gear size={20} />
        </Button>
      </div>
      {/* 
      <div className="flex items-center justify-between gap-2">
        <ModelSelect className="flex-1" />
      </div> */}
      {/* Modal del Creador OIAI */}
      {/* {showOiaiCreator && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-4xl p-4">
            <button
              onClick={() => setShowOiaiCreator(false)}
              className="absolute right-6 top-6 z-10 rounded-full bg-white p-2 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
            <OIAICreator />
          </div>
        </div>
      )} */}
    </div>
  );
}