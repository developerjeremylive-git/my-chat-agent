import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, type Variants } from "framer-motion";
import { Gear, List, X, Sun, Moon, User, Bell, Question, Palette, Key, DotsThreeVertical, CaretRight as ChevronRight, PaintBrushBroad, PlusCircle, Trash, Minus, Plus, Robot, UserCirclePlus, PaintBrushHousehold } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { Button } from "../button/Button";
import { useTheme } from "next-themes";
import { AISettingsPanel } from "../settings/AISettingsPanel";
import { ModelSelect } from "../model/ModelSelect";
import { useModel } from "@/contexts/ModelContext";

const springTransition = {
  type: "spring",
  damping: 25,
  stiffness: 500,
  mass: 0.5
};

const menuItemVariants = {
  closed: { x: -20, opacity: 0 },
  open: (i: number) => ({
    x: 0,
    opacity: 1,
    transition: {
      delay: 0.05 * i,
      ...springTransition
    }
  })
};

const panelVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    transition: {
      x: { type: 'spring' as const, stiffness: 600, damping: 35, mass: 0.5 },
      opacity: { duration: 0.1 }
    }
  }),
  center: {
    x: 0,
    opacity: 1,
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    transition: {
      x: { type: 'spring' as const, stiffness: 600, damping: 35, mass: 0.5 },
      opacity: { duration: 0.1 }
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    transition: {
      x: { type: 'spring' as const, stiffness: 600, damping: 35, mass: 0.5 },
      opacity: { duration: 0.1 }
    }
  })
};

interface SettingsDropdownProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isSettingsOpen: boolean;
  toggleSettings: () => void;
  onMenuToggle?: () => void;
  onAISettingsClick?: () => void;
  children?: React.ReactNode;
  stepMax?: number;
  setStepMax?: (value: number) => void;
  setShowSettingsMenu?: (show: boolean) => void;
  setShowOIAICreator?: (show: boolean) => void;
  setShowClearDialog?: (show: boolean) => void;
}

export function SettingsDropdown({
  isSidebarOpen,
  toggleSidebar,
  isSettingsOpen,
  toggleSettings,
  onMenuToggle,
  onAISettingsClick,
  children,
  stepMax = 5,
  setStepMax = () => { },
  setShowSettingsMenu = () => { },
  setShowOIAICreator = () => { },
  setShowClearDialog = () => { },
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const controls = useAnimation();
  const [activePanel, setActivePanel] = useState<'main' | 'settings' | 'profile'>('main');
  const [prevPanel, setPrevPanel] = useState<'main' | 'settings' | 'profile'>('main');
  const [direction, setDirection] = useState(0);
  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const { theme, setTheme } = useTheme();
  const { selectedModel } = useModel();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if mobile on mount and on window resize
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleAISettingsClick = () => {
    if (onAISettingsClick) {
      onAISettingsClick();
    }
    setIsOpen(false);
  };

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Handle menu item click
  const handleMenuItemClick = (action: () => void, customAction?: () => void) => {
    if (customAction) customAction();
    action();
    controls.start('closed').then(() => {
      setTimeout(() => setIsOpen(false), 150);
    });
  };

  const navigateToPanel = (panel: 'main' | 'settings' | 'profile') => {
    setPrevPanel(activePanel);
    setDirection(panel === 'main' ? -1 : (activePanel === 'main' ? 1 : 0));
    setActivePanel(panel);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Only close if clicking outside both the dropdown and its trigger button
      const target = event.target as HTMLElement;
      const isClickInside = dropdownRef.current?.contains(target) || 
                          document.querySelector('button[aria-label="Menú de configuración"]')?.contains(target);
      
      if (!isClickInside) {
        controls.start('closed').then(() => {
          setTimeout(() => setIsOpen(false), 150);
        });
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, controls]);

  // Reset panel when closing
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => setActivePanel('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <div>
        <Button
          variant="ghost"
          size="lg"
          className={`relative w-8 h-8 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 shadow-lg 
                   hover:shadow-xl hover:shadow-[#F48120]/30 dark:hover:shadow-purple-500/30 active:scale-95
                   transition-all duration-200 ease-out ${isOpen ? 'rotate-180' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menú de configuración"
        >
          <Gear
            size={20}
            className="text-white transition-transform duration-200 ml-1.5 mr-1.5"
            weight="duotone"
          />
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown Container */}
            <div className="fixed inset-0 flex items-center justify-center z-[1001] px-4 py-4 pointer-events-none">
              <motion.div
                className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-white/20 dark:border-neutral-700/50 overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto mx-auto my-auto"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={springTransition}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 p-4 border-b border-white/10 dark:border-neutral-700/50 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-sm">
                  <div className="flex items-center">
                    <button
                      onClick={() => setActivePanel('main')}
                      className={`mr-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activePanel === 'main'
                        ? 'bg-white dark:bg-neutral-700 text-[#F48120] shadow-sm'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                        }`}
                    >
                      Menú
                    </button>
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                      {activePanel === 'main' ? 'Menú' : activePanel === 'settings' ? 'Ajustes Personalizados' : 'Perfil'}
                    </h3>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="ml-auto p-1.5 rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      aria-label="Cerrar menú"
                    >
                      <X size={20} weight="bold" />
                    </button>
                  </div>
                </div>

                {/* Main Panel */}
                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    {activePanel === 'main' && (
                      <motion.div
                        key="main"
                        className="p-2 w-full"
                        custom={direction}
                        variants={panelVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        style={{ willChange: 'transform, opacity' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      >
                        {/* Model Selection - Mobile Only */}
                        {/* <div className="md:hidden px-4 py-2 mb-2">
                          <ModelSelect mobile />
                        </div> */}

                        {/* Step Controls - Mobile Only for gemini-2.0-flash */}
                        {selectedModel === 'gemini-2.0-flash' && (
                          <div className="flex items-center justify-center gap-1.5 px-4 py-2 mb-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl mx-2">
                            <button
                              onClick={() => setStepMax(1)}
                              className={`p-1.5 rounded-lg transition-all ${stepMax === 1 ? 'bg-[#F48120]/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
                              title="Básico"
                            >
                              <span className="text-sm">🎯</span>
                            </button>
                            <button
                              onClick={() => setStepMax(3)}
                              className={`p-1.5 rounded-lg transition-all ${stepMax > 1 && stepMax <= 3 ? 'bg-blue-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
                              title="Equilibrado"
                            >
                              <span className="text-sm">🧠</span>
                            </button>
                            <button
                              onClick={() => setStepMax(7)}
                              className={`p-1.5 rounded-lg transition-all ${stepMax > 3 && stepMax <= 7 ? 'bg-purple-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
                              title="Avanzado"
                            >
                              <span className="text-sm">🚀</span>
                            </button>
                            <button
                              onClick={() => setStepMax(10)}
                              className={`p-1.5 rounded-lg transition-all ${stepMax > 7 ? 'bg-emerald-500/10 scale-110' : 'bg-transparent hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'}`}
                              title="Experto"
                            >
                              <span className="text-sm">🤖</span>
                            </button>
                          </div>
                        )}
                        <motion.button
                          onClick={() => navigateToPanel('settings')}
                          className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                          variants={menuItemVariants}
                          custom={3}
                          initial="closed"
                          animate="open"
                        >
                          <PaintBrushBroad size={18} weight="duotone" className="mr-3 text-green-500" />
                          Ajustes Personalizados
                        </motion.button>

                        <motion.button
                          onClick={() => {
                            handleAISettingsClick();
                            controls.start('closed').then(() => {
                              setTimeout(() => setIsOpen(false), 150);
                            });
                          }}
                          className={`flex w-full items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 mb-1 ${isSidebarOpen
                            ? 'bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 text-[#F48120] font-medium'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'
                            }`}
                          variants={menuItemVariants}
                          custom={1}
                          initial="closed"
                          animate="open"
                        >
                          <Robot size={18} weight="duotone" className="mr-3 text-purple-500" />
                          Configuración Asistente IA
                        </motion.button>

                        <motion.button
                          onClick={() => handleMenuItemClick(toggleSidebar)}
                          className={`flex w-full items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 mb-1 ${isSidebarOpen
                            ? 'bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 text-[#F48120] font-medium'
                            : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'
                            }`}
                          variants={menuItemVariants}
                          custom={isMobile ? 1 : 0}
                          initial="closed"
                          animate="open"
                        >
                          <UserCirclePlus size={18} weight="duotone" className="mr-3 text-[#F48120]" />
                          {isSidebarOpen ? 'Personaliza tu Asistente IA' : 'Personaliza tu Asistente IA'}
                        </motion.button>

                        {/* <motion.button
                          onClick={() => navigateToPanel('profile')}
                          className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                          variants={menuItemVariants}
                          custom={2}
                          initial="closed"
                          animate="open"
                        >
                          <User size={18} weight="duotone" className="mr-3 text-blue-500" />
                          Perfil de usuario
                        </motion.button> */}

                        {onMenuToggle && (
                          <motion.button
                            onClick={() => handleMenuItemClick(() => onMenuToggle())}
                            className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                            variants={menuItemVariants}
                            custom={5}
                            initial="closed"
                            animate="open"
                          >
                            <DotsThreeVertical size={18} weight="duotone" className="mr-3 text-[#F48120]" />
                            Menú de opciones
                          </motion.button>
                        )}

                      </motion.div>
                    )}
                    {activePanel === 'settings' && (
                      <motion.div
                        key="menu"
                        className="p-4 absolute inset-0 overflow-y-auto"
                        custom={direction}
                        variants={panelVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      >
                        {/* Personalización Section */}
                        <div>
                          <div className="text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80 mb-2">Personalización</div>
                          <button
                            onClick={() => {
                              setShowSettingsMenu(true);
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50 rounded-xl flex items-center space-x-2 mb-2"
                          >
                            <PaintBrushHousehold size={16} className="text-[#F48120] flex-shrink-0" weight="duotone" />
                            <span className="truncate">Apariencia</span>
                          </button>
                        </div>


                        {/* Nivel de Asistencia Section */}
                        {selectedModel === 'gemini-2.0-flash' && (
                          <div>

                            <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-3" />

                            <div className="text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80 mb-2">Nivel de Asistencia</div>
                            <div className="px-2 py-2 space-y-2">
                              <div className="relative h-2 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full overflow-hidden shadow-inner">
                                <div
                                  className="h-full bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-lg"
                                  style={{ width: `${(stepMax / 10) * 100}%` }}
                                />
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
                              <div className="flex items-center gap-2 mt-3">
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
                        )}

                        {/* Divider */}
                        <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-3" />

                        {/* Acciones Section */}
                        <div>
                          <div className="text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80 mb-2">Acciones</div>
                          <button
                            onClick={() => {
                              setShowOIAICreator(true);
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50 rounded-xl flex items-center space-x-2 mb-2"
                          >
                            <PlusCircle size={16} className="text-[#F48120] flex-shrink-0" weight="duotone" />
                            <span className="truncate">Crear Asistente IA</span>
                          </button>
                          {/* <button
                            onClick={() => {
                              setShowAISettings(true);
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-700/50 rounded-xl flex items-center space-x-2 mb-2"
                          >
                            <Robot size={16} className="text-blue-500 flex-shrink-0" weight="duotone" />
                            <span className="truncate">Configuración de IA</span>
                          </button> */}
                          {/* <button
                            onClick={() => {
                              setShowClearDialog(true);
                              setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-neutral-700/50 rounded-xl flex items-center space-x-2"
                          >
                            <Trash size={16} className="text-red-500 flex-shrink-0" weight="duotone" />
                            <span className="truncate">Limpiar Chat</span>
                          </button> */}
                        </div>

                        {/* Divider */}
                        {/* <div className="border-t border-[#F48120]/10 dark:border-[#F48120]/20 my-3" /> */}

                      </motion.div>
                    )}
                    {/* {activePanel === 'settings' && (
                      <motion.div
                        key="settings"
                        className="p-4 absolute inset-0 overflow-y-auto"
                        custom={direction}
                        variants={panelVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      >
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">APARIENCIA</h4>

                          <button
                            onClick={toggleTheme}
                            className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors"
                          >
                            <div className="flex items-center">
                              <Palette size={18} weight="duotone" className="mr-3 text-purple-500" />
                              <span>Tema</span>
                            </div>
                            <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-300">
                              {theme === 'dark' ? 'Oscuro' : 'Claro'}
                              <ChevronRight size={16} className="ml-2" />
                            </div>
                          </button>

                          <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mt-6 mb-2">CUENTA</h4>

                          <button className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center">
                              <Bell size={18} weight="duotone" className="mr-3 text-blue-500" />
                              <span>Notificaciones</span>
                            </div>
                            <ChevronRight size={16} className="text-neutral-400" />
                          </button>

                          <button className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center">
                              <Key size={18} weight="duotone" className="mr-3 text-amber-500" />
                              <span>Seguridad</span>
                            </div>
                            <ChevronRight size={16} className="text-neutral-400" />
                          </button>

                          <button className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center">
                              <Question size={18} weight="duotone" className="mr-3 text-emerald-500" />
                              <span>Ayuda y soporte</span>
                            </div>
                            <ChevronRight size={16} className="text-neutral-400" />
                          </button>

                          <div className="pt-4">
                            <button
                              onClick={() => navigateToPanel('main')}
                              className="w-full py-2.5 px-4 text-sm font-medium text-[#F48120] hover:bg-[#F48120]/10 dark:hover:bg-[#F48120]/20 rounded-lg transition-colors"
                            >
                              Volver al menú
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )} */}
                    {activePanel === 'profile' && (
                      <motion.div
                        key="profile"
                        className="p-4 absolute inset-0"
                        custom={direction}
                        variants={panelVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                      >
                        <div className="flex flex-col items-center text-center mb-6">
                          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 p-0.5 mb-3">
                            <div className="w-full h-full rounded-full bg-white dark:bg-neutral-800 flex items-center justify-center text-2xl font-bold text-[#F48120]">
                              U
                            </div>
                          </div>
                          <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">Usuario</h3>
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">usuario@ejemplo.com</p>
                        </div>

                        <div className="space-y-3">
                          <button className="w-full py-2.5 px-4 text-sm font-medium bg-[#F48120] hover:bg-[#e6731a] text-white rounded-lg transition-colors">
                            Ver perfil completo
                          </button>

                          <button className="w-full py-2.5 px-4 text-sm font-medium border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 rounded-lg transition-colors">
                            Cerrar sesión
                          </button>

                          <div className="pt-2">
                            <button
                              onClick={() => navigateToPanel('main')}
                              className="w-full py-2 text-sm font-medium text-[#F48120] hover:bg-[#F48120]/10 dark:hover:bg-[#F48120]/20 rounded-lg transition-colors"
                            >
                              ← Volver al menú
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
