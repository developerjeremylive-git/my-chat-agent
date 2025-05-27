import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, type Variants } from "framer-motion";
import { Gear, List, X, Sun, Moon, User, Bell, Question, Palette, Key, CaretRight as ChevronRight } from "@phosphor-icons/react";
import { Button } from "../button/Button";
import { useTheme } from "next-themes";

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
}

export function SettingsDropdown({
  isSidebarOpen,
  toggleSidebar,
  isSettingsOpen,
  toggleSettings,
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<'main' | 'settings' | 'profile'>('main');
  const [direction, setDirection] = useState(0);
  const [prevPanel, setPrevPanel] = useState<'main' | 'settings' | 'profile'>('main');
  const { theme, setTheme } = useTheme();
  const controls = useAnimation();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Handle menu item click
  const handleMenuItemClick = (action: () => void) => {
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
    <div className="relative" ref={dropdownRef}>
      {/* Mobile FAB */}
      <motion.div 
        className="fixed bottom-6 right-6 z-40 md:hidden"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          transition: { delay: 0.2 }
        }}
      >
        <Button
          variant="ghost"
          size="lg"
          className={`relative w-14 h-14 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 shadow-lg 
                   hover:shadow-xl hover:shadow-[#F48120]/30 dark:hover:shadow-purple-500/30
                   transition-all duration-300 ${isOpen ? 'rotate-45' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menú de configuración"
        >
          <Gear 
            size={24} 
            className="text-white transition-transform duration-300"
            weight="duotone"
          />
        </Button>
      </motion.div>

      {/* Desktop Button */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group
                   hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25
                   transform hover:scale-110 active:scale-95 transition-all duration-300"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menú de configuración"
        >
          <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center
                      overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0
                      before:transition-all before:duration-300 group-hover:before:opacity-100">
            <Gear 
              size={20} 
              className={`relative z-10 text-[#F48120] group-hover:text-white transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              weight="duotone"
            />
          </div>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <div className="fixed inset-0 flex items-center justify-center z-50 px-4 py-4 pointer-events-none">
              <motion.div
                className="w-full max-w-sm bg-white/80 dark:bg-neutral-800/90 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-neutral-700/50 overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto mx-auto my-auto"
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={springTransition}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 dark:border-neutral-700/50 bg-gradient-to-r from-[#F48120]/10 to-purple-500/10">
                  <div className="flex items-center">
                    <button 
                      onClick={() => setActivePanel('main')}
                      className={`mr-4 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        activePanel === 'main' 
                          ? 'bg-white dark:bg-neutral-700 text-[#F48120] shadow-sm' 
                          : 'text-neutral-600 dark:text-neutral-300 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                      }`}
                    >
                      Menú
                    </button>
                    <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                      {activePanel === 'main' ? 'Menú' : activePanel === 'settings' ? 'Configuración' : 'Perfil'}
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
                  <motion.button
                    onClick={() => handleMenuItemClick(toggleSidebar)}
                    className={`flex w-full items-center px-4 py-3 text-sm rounded-xl transition-all duration-200 mb-1 ${
                      isSidebarOpen 
                        ? 'bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 text-[#F48120] font-medium' 
                        : 'text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50'
                    }`}
                    variants={menuItemVariants}
                    custom={0}
                    initial="closed"
                    animate="open"
                  >
                    <List size={18} weight="duotone" className="mr-3" />
                    {isSidebarOpen ? 'Ocultar barra lateral' : 'Mostrar barra lateral'}
                  </motion.button>
                  
                  <motion.button
                    onClick={() => navigateToPanel('profile')}
                    className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                    variants={menuItemVariants}
                    custom={1}
                    initial="closed"
                    animate="open"
                  >
                    <User size={18} weight="duotone" className="mr-3 text-blue-500" />
                    Perfil de usuario
                  </motion.button>

                  <motion.button
                    onClick={() => navigateToPanel('settings')}
                    className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                    variants={menuItemVariants}
                    custom={2}
                    initial="closed"
                    animate="open"
                  >
                    <Gear size={18} weight="duotone" className="mr-3 text-purple-500" />
                    Configuración
                  </motion.button>

                  <motion.button
                    onClick={toggleTheme}
                    className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                    variants={menuItemVariants}
                    custom={3}
                    initial="closed"
                    animate="open"
                  >
                    {theme === 'dark' ? (
                      <Sun size={18} weight="duotone" className="mr-3 text-yellow-500" />
                    ) : (
                      <Moon size={18} weight="duotone" className="mr-3 text-indigo-500" />
                    )}
                    {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                  </motion.button>

                      </motion.div>
                    )}
                    {activePanel === 'settings' && (
                      <motion.div 
                        key="settings"
                        className="p-4 absolute inset-0"
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
                    )}
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
