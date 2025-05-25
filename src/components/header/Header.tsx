import { Button } from "@/components/button/Button";
import { ModelSelect } from "@/components/model/ModelSelect";
import { DotsThreeVertical, List, Gear, Trash, PlusCircle, PaintBrushBroad, Minus, Plus } from "@phosphor-icons/react";
import { useState, useRef, useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";

type SetState<T> = Dispatch<SetStateAction<T>>;

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  stepMax: number;
  setStepMax: (value: number) => void;
  setShowSettingsMenu: (show: boolean) => void;
  setShowOIAICreator: (show: boolean) => void;
  setShowClearDialog: (show: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
}

export default function Header({
  isSidebarOpen,
  setIsSidebarOpen,
  stepMax,
  setStepMax,
  setShowSettingsMenu,
  setShowOIAICreator,
  setShowClearDialog,
  setIsSettingsOpen
}: HeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowMenu(prev => !prev);
  };

  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickAnywhere = (event: MouseEvent) => {
      const target = event.target as Node;
      const menu = menuRef.current;
      const button = menuButtonRef.current;

      // Verificar si el clic fue fuera del menú y del botón
      if (menu && button && !menu.contains(target) && !button.contains(target)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickAnywhere as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClickAnywhere as EventListener);
    };
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200/50 dark:border-neutral-700/50 px-4 py-2">
      <div className="flex w-full max-w-5xl mx-auto justify-between items-center gap-2">
        {/* Left side - Menu button and title */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group
             hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25
             transform hover:scale-110 active:scale-95 transition-all duration-300"
            onClick={() => {
              setIsSidebarOpen(!isSidebarOpen);
              setIsSettingsOpen(false);
            }}
          >
            <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center
                overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0
                before:transition-opacity before:duration-300 group-hover:before:opacity-100">
              <List size={20} className="relative z-10 text-[#F48120] group-hover:text-white transition-colors duration-300" weight="duotone" />
            </div>
          </Button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent hidden md:block">Asistente IA</h1>
        </div>

        {/* Center - Model Selector */}
        <div className="flex-1 max-w-xl px-2">
          <ModelSelect />
        </div>

        {/* Right side - Action buttons */}
        <div className="flex items-center gap-2">
          {/* Menu Dropdown */}
          <div className="relative">
            <Button
              ref={menuButtonRef}
              variant="ghost"
              size="sm"
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
               dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
               border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
               transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
               flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(prev => !prev);
              }}
            >
              <DotsThreeVertical size={20} className="text-[#F48120]" weight="duotone" />
            </Button>

            {showMenu && (
              <div
                ref={menuRef}
                className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100%-1rem)] sm:w-72 max-w-sm origin-top-right rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden
                border border-[#F48120]/20 dark:border-[#F48120]/10 transition-all duration-100 ease-in-out transform"
                style={{
                  maxHeight: 'calc(100vh - 5rem)',
                  overflowY: 'auto'
                }}>
                <div className="py-1 space-y-1" role="none">
                  {/* --- Personalización Section --- */}
                  <div>
                    <div className="px-4 pt-2 pb-1 text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80">Personalización</div>
                    <button
                      className="w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                      onClick={() => {
                        setShowSettingsMenu(true);
                        setShowMenu(false);
                      }}
                    >
                      <PaintBrushBroad size={16} className="text-[#F48120] flex-shrink-0" weight="duotone" />
                      <span className="truncate">Apariencia</span>
                    </button>
                  </div>

                  {/* --- Divider --- */}
                  <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-2" />

                  {/* --- Nivel de Asistencia Section --- */}
                  <div>
                    <div className="px-4 pt-2 pb-1 text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80">Nivel de Asistencia</div>
                    <div className="px-4 py-2 space-y-2">
                      <div className="relative h-2 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-lg"
                          style={{ width: `${(stepMax / 10) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
                        <span className={stepMax <= 2 ? 'text-[#F48120] font-semibold' : ''}>Rápido</span>
                        <span className={stepMax > 2 && stepMax <= 5 ? 'text-[#F48120] font-semibold' : ''}>Equilibrado</span>
                        <span className={stepMax > 5 && stepMax <= 8 ? 'text-[#F48120] font-semibold' : ''}>Profundo</span>
                        <span className={stepMax > 8 ? 'text-[#F48120] font-semibold' : ''}>Experto</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        <button
                          onClick={() => setStepMax(1)}
                          className={`p-1.5 text-xs rounded-md transition-all ${stepMax === 1 ? 'bg-[#F48120]/10 border border-[#F48120]/30' : 'bg-neutral-100/50 dark:bg-neutral-700/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50'}`}
                        >
                          🎯 Básico
                        </button>
                        <button
                          onClick={() => setStepMax(3)}
                          className={`p-1.5 text-xs rounded-md transition-all ${stepMax > 1 && stepMax <= 3 ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-neutral-100/50 dark:bg-neutral-700/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50'}`}
                        >
                          🧠 Equilibrado
                        </button>
                        <button
                          onClick={() => setStepMax(7)}
                          className={`p-1.5 text-xs rounded-md transition-all ${stepMax > 3 && stepMax <= 7 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-neutral-100/50 dark:bg-neutral-700/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50'}`}
                        >
                          🚀 Avanzado
                        </button>
                        <button
                          onClick={() => setStepMax(10)}
                          className={`p-1.5 text-xs rounded-md transition-all ${stepMax > 7 ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-neutral-100/50 dark:bg-neutral-700/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-600/50'}`}
                        >
                          🤖 Experto
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => stepMax > 1 && setStepMax(stepMax - 1)}
                          disabled={stepMax <= 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-600 disabled:opacity-40"
                        >
                          <Minus size={16} className="text-red-500" weight="bold" />
                        </button>
                        <div className="flex-1 text-center text-sm font-medium">
                          Nivel {stepMax}
                        </div>
                        <button
                          onClick={() => stepMax < 10 && setStepMax(stepMax + 1)}
                          disabled={stepMax >= 10}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 hover:border-green-300 dark:hover:border-green-600 disabled:opacity-40"
                        >
                          <Plus size={16} className="text-green-500" weight="bold" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* --- Divider --- */}
                  <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-2" />

                  {/* --- Acciones Section --- */}
                  <div>
                    <div className="px-4 pt-2 pb-1 text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80">Acciones</div>
                    <button
                      className="w-full text-left px-4 py-3 sm:py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                      onClick={() => {
                        setShowOIAICreator(true);
                        setShowMenu(false);
                      }}
                    >
                      <PlusCircle size={16} className="text-[#F48120] flex-shrink-0" weight="duotone" />
                      <span className="truncate">Nueva Consulta</span>
                    </button>
                    <button
                      className="w-full text-left px-4 py-3 sm:py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700 flex items-center space-x-2"
                      onClick={() => {
                        setShowClearDialog(true);
                        setShowMenu(false);
                      }}
                    >
                      <Trash size={16} className="text-red-500 flex-shrink-0" weight="duotone" />
                      <span className="truncate">Limpiar Chat</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group
             hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25
             transform hover:scale-110 active:scale-95 transition-all duration-300"
            onClick={() => setIsSettingsOpen(true)}
          >
            <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center
                overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0
                before:transition-opacity before:duration-300 group-hover:before:opacity-100">
              <Gear size={20} className="relative z-10 text-[#F48120] group-hover:text-white transition-colors duration-300" weight="duotone" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
