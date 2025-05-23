import React, { useRef } from "react";
import { Button } from "@/components/button/Button";
import { List, DotsThreeVertical, PaintBrushBroad, PlusCircle, Trash, Gear, Sun, Moon, Minus, Plus } from "@phosphor-icons/react";

interface HeaderBarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setShowMenu: (show: boolean) => void;
  showMenu: boolean;
  menuButtonRef: React.RefObject<HTMLButtonElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  setShowSettingsMenu: (show: boolean) => void;
  setShowOIAICreator: (show: boolean) => void;
  setShowClearDialog: (show: boolean) => void;
  setIsSettingsOpen: (show: boolean) => void;
  stepMax: number;
  setStepMax: (val: number) => void;
  isUpdatingStepMax: boolean;
  setIsUpdatingStepMax: (val: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  setShowMenu,
  showMenu,
  menuButtonRef,
  menuRef,
  setShowSettingsMenu,
  setShowOIAICreator,
  setShowClearDialog,
  setIsSettingsOpen,
  stepMax,
  setStepMax,
  isUpdatingStepMax,
  setIsUpdatingStepMax,
  theme,
  toggleTheme
}) => {
  return (
    <div className="fixed lg:static top-0 left-0 right-0 px-4 py-3 flex justify-between items-center z-30 bg-gradient-to-b from-white/80 to-white/0 dark:from-neutral-900/80 dark:to-neutral-900/0 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-800 lg:rounded-t-xl transition-all duration-300">
      <Button
        variant="ghost"
        size="sm"
        className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25 transform hover:scale-110 active:scale-95 transition-all duration-300"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100">
          <List size={20} className="relative z-10 text-[#F48120] group-hover:text-white transition-colors duration-300" weight="duotone" />
        </div>
      </Button>
      {/* Dropdown Menu */}
      <div className="relative">
        <Button
          ref={menuButtonRef}
          variant="ghost"
          size="sm"
          className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15 border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30 transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300 flex items-center justify-center"
          onClick={e => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <DotsThreeVertical size={20} className="text-[#F48120]" weight="duotone" />
        </Button>
        {showMenu && (
          <div
            ref={menuRef}
            className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100%-1rem)] sm:w-56 max-w-sm origin-top-right rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden border border-[#F48120]/20 dark:border-[#F48120]/10 transition-all duration-100 ease-in-out transform"
            style={{ maxHeight: 'calc(100vh - 5rem)', overflowY: 'auto' }}
          >
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
              <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-2" />
              {/* --- Nivel de Asistencia Section --- */}
              <div>
                <div className="px-4 pt-2 pb-1 text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80">Nivel de Asistencia</div>
                <div className="px-4 py-2 space-y-2">
                  {/* Level Indicator Bar */}
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
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setStepMax(1)}
                      className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${stepMax === 1 ? 'bg-gradient-to-br from-[#F48120]/20 to-orange-400/20 border-2 border-[#F48120]/50 shadow-lg shadow-[#F48120]/20' : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-[#F48120]/30 hover:shadow-md'}`}
                    >
                      <span className="text-lg">🎯</span>
                      <div className="text-xs font-bold">Básico</div>
                    </button>
                    <button
                      onClick={() => setStepMax(3)}
                      className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${stepMax > 1 && stepMax <= 3 ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20' : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-blue-500/30 hover:shadow-md'}`}
                    >
                      <span className="text-lg">🧠</span>
                      <div className="text-xs font-bold">Equilibrado</div>
                    </button>
                    <button
                      onClick={() => setStepMax(7)}
                      className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${stepMax > 3 && stepMax <= 7 ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-purple-500/30 hover:shadow-md'}`}
                    >
                      <span className="text-lg">🚀</span>
                      <div className="text-xs font-bold">Avanzado</div>
                    </button>
                    <button
                      onClick={() => setStepMax(10)}
                      className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${stepMax > 7 ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-emerald-500/30 hover:shadow-md'}`}
                    >
                      <span className="text-lg">🤖</span>
                      <div className="text-xs font-bold">Experto</div>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (!isUpdatingStepMax && stepMax > 1) {
                          setIsUpdatingStepMax(true);
                          setStepMax(stepMax - 1);
                          setTimeout(() => setIsUpdatingStepMax(false), 150);
                        }
                      }}
                      disabled={isUpdatingStepMax || stepMax <= 1}
                      className="group w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-40"
                    >
                      <Minus size={16} className="text-red-500 group-hover:text-red-600" weight="bold" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={stepMax}
                      onChange={e => {
                        const value = parseInt(e.target.value);
                        if (!isUpdatingStepMax) {
                          setIsUpdatingStepMax(true);
                          setStepMax(value);
                          setTimeout(() => setIsUpdatingStepMax(false), 150);
                        }
                      }}
                      className="flex-1 h-2 bg-transparent appearance-none cursor-pointer mx-2"
                    />
                    <button
                      onClick={() => {
                        if (!isUpdatingStepMax && stepMax < 10) {
                          setIsUpdatingStepMax(true);
                          setStepMax(stepMax + 1);
                          setTimeout(() => setIsUpdatingStepMax(false), 150);
                        }
                      }}
                      disabled={isUpdatingStepMax || stepMax >= 10}
                      className="group w-8 h-8 flex items-center justify-center rounded-lg bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-40"
                    >
                      <Plus size={16} className="text-green-500 group-hover:text-green-600" weight="bold" />
                    </button>
                    <span className="ml-2 text-xs font-semibold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">{stepMax}/10</span>
                  </div>
                </div>
              </div>
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
                  <span className="truncate">Nueva Consulta del Sistema</span>
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
      <Button
        variant="ghost"
        size="sm"
        className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25 transform hover:scale-110 active:scale-95 transition-all duration-300"
        onClick={() => setIsSettingsOpen(true)}
      >
        <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0 before:transition-opacity before:duration-300 group-hover:before:opacity-100">
          <Gear size={20} className="relative z-10 text-[#F48120] group-hover:text-white transition-colors duration-300" weight="duotone" />
        </div>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15 border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30 transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300 flex items-center justify-center"
        onClick={toggleTheme}
      >
        {theme === "dark" ? (
          <Sun weight="duotone" className="w-5 h-5 text-amber-400" />
        ) : (
          <Moon weight="duotone" className="w-5 h-5 text-blue-400" />
        )}
        <span className="sr-only">{theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}</span>
      </Button>
    </div>
  );
};
