import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useAnimation, type Variants } from "framer-motion";
import { Gear, List, X, Sun, Moon, User, Bell, Question, Palette, Key, DotsThreeVertical, CaretRight as ChevronRight, PaintBrushBroad, PlusCircle, Trash, Minus, Plus, Robot, UserCirclePlus, PaintBrushHousehold, FloppyDisk, MagnifyingGlass, PencilSimple, NotePencil, CaretDown } from "@phosphor-icons/react";
import { createPortal } from "react-dom";
import { Button } from "../button/Button";
import { InputSystemPrompt } from "../input/InputSystemPrompt";
import { cn } from "../../lib/utils";
import { useTheme } from "next-themes";
import { AISettingsPanel } from "../settings/AISettingsPanel";
import { ModelSelect } from "../model/ModelSelect";
import { useModel } from "@/contexts/ModelContext";
import { Modal } from "../modal/Modal";
import { Notebook } from "lucide-react";

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
  hasMessages?: boolean;
}

export const SettingsDropdown = ({
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
  hasMessages = false,
}: SettingsDropdownProps) => {
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [promptName, setPromptName] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<Array<{ id: string, name: string, content: string }>>([]);
  const [promptToDelete, setPromptToDelete] = useState<{ id: string, name: string } | null>(null);
  const [promptToEdit, setPromptToEdit] = useState<{ id: string, name: string, content: string } | null>(null);
  const [editPromptName, setEditPromptName] = useState('');
  const [editPromptContent, setEditPromptContent] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
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
    // setIsOpen(false);
  };

  // Cargar prompts guardados al montar el componente
  useEffect(() => {
    const loadedPrompts = localStorage.getItem("systemPrompts");
    if (loadedPrompts) {
      setSavedPrompts(JSON.parse(loadedPrompts));
    }

    // Listen for system prompt updates from OIAI creator
    const handleSystemPromptUpdate = (event: CustomEvent) => {
      const { content } = event.detail;
      setSystemPrompt(content);
    };

    // @ts-ignore - CustomEvent type needs to be handled
    window.addEventListener('openSystemPrompt', handleSystemPromptUpdate);
    
    return () => {
      // @ts-ignore - CustomEvent type needs to be handled
      window.removeEventListener('openSystemPrompt', handleSystemPromptUpdate);
    };
  }, []);

  // Guardar prompts en localStorage cuando cambien
  useEffect(() => {
    if (savedPrompts.length > 0) {
      localStorage.setItem("systemPrompts", JSON.stringify(savedPrompts));
    }
  }, [savedPrompts]);

  // Handle click on overlay to close dropdown
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  // Guardar un nuevo prompt
  const savePrompt = () => {
    if (!promptName.trim() || !systemPrompt) return;

    const newPrompt = {
      id: Date.now().toString(),
      name: promptName,
      content: systemPrompt,
    };

    const updatedPrompts = [...savedPrompts, newPrompt];
    setSavedPrompts(updatedPrompts);
    setIsPromptModalOpen(false);
    setPromptName('');
  };

  // Seleccionar un prompt guardado
  const selectPrompt = (prompt: { id: string, name: string, content: string }) => {
    setSystemPrompt(prompt.content);
    setIsDropdownOpen(false);
  };

  // Confirmar eliminación de un prompt
  const confirmDelete = () => {
    if (!promptToDelete) return;

    const updatedPrompts = savedPrompts.filter(p => p.id !== promptToDelete.id);
    setSavedPrompts(updatedPrompts);
    setIsDeleteModalOpen(false);
    setPromptToDelete(null);
  };

  // Confirmar edición de un prompt
  const confirmEdit = () => {
    if (!promptToEdit || !editPromptName.trim() || !editPromptContent.trim()) return;

    const updatedPrompts = savedPrompts.map(p =>
      p.id === promptToEdit.id
        ? { ...p, name: editPromptName, content: editPromptContent }
        : p
    );

    setSavedPrompts(updatedPrompts);
    setIsEditModalOpen(false);
    setPromptToEdit(null);
    setEditPromptName('');
    setEditPromptContent('');
  };

  // Filtrar prompts por término de búsqueda
  const filteredPrompts = savedPrompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle theme
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Handle menu item click
  const handleMenuItemClick = (action: () => void, customAction?: () => void) => {
    if (customAction) customAction();
    action();
    // controls.start('closed').then(() => {
    //   setTimeout(() => setIsOpen(false), 150);
    // });
  };

  const navigateToPanel = (panel: 'main' | 'settings' | 'profile') => {
    setPrevPanel(activePanel);
    setDirection(panel === 'main' ? -1 : (activePanel === 'main' ? 1 : 0));
    setActivePanel(panel);
  };

  return (
    <div className="relative">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
        aria-label="Abrir menú de configuración"
        aria-expanded={isOpen}
      >
        <Gear size={20} weight="bold" className="text-white" />
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={handleOverlayClick}
          >
            <div className="fixed inset-0 flex items-center justify-center z-[1001] px-4 py-4">
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl border border-white/20 dark:border-neutral-700/50 overflow-hidden max-h-[90vh] flex flex-col mx-auto my-auto"
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
                <div className="relative flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait" custom={direction} initial={false}>
                    {activePanel === 'main' && (
                      <motion.div
                        key="main"
                        className="p-2 w-full pb-4"
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
                        {/* {selectedModel === 'gemini-2.0-flash' && (
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
                        )} */}


                        {/* <motion.button
                          onClick={() => {
                            setShowSettingsMenu(true);
                            setIsOpen(false);
                          }}
                          className="flex w-full items-center px-4 py-3 text-sm rounded-xl text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/50 dark:hover:bg-neutral-700/50 transition-colors mb-1"
                          variants={menuItemVariants}
                          custom={3}
                          initial="closed"
                          animate="open"
                        >
                          <PaintBrushBroad size={18} weight="duotone" className="mr-3 text-green-500" />
                          Personalizar Apariencia
                        </motion.button> */}

                        {/* Prompt del Sistema Section */}
                        {/* {hasMessages && ( */}
                        <div className="px-2 py-2">

                          <div className="px-2 py-2 space-y-2">
                            {/* <div className="space-y-2">
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                <div className="relative w-full" ref={dropdownRef}>
                                  <button
                                    onClick={() => {
                                      setIsDropdownOpen(!isDropdownOpen);
                                      if (!isDropdownOpen) setSearchTerm('');
                                    }}
                                    className="w-full px-4 py-3 text-sm text-left rounded-xl bg-white/90 dark:bg-neutral-900/90 border-2 border-neutral-200/90 dark:border-neutral-700/90 hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-200 flex justify-between items-center group"
                                    aria-label={savedPrompts.length > 0 ? 'Seleccionar prompt guardado' : 'No hay prompts guardados'}
                                  >
                                    <div className="flex items-center min-w-0">
                                      <Notebook size={16} className="text-[#F48120] mr-2 flex-shrink-0" />
                                      <span className="truncate">
                                        {savedPrompts.length > 0 ? 'Seleccionar prompt guardado...' : 'No hay prompts guardados'}
                                      </span>
                                    </div>
                                    <CaretDown
                                      size={18}
                                      weight="bold"
                                      className={`flex-shrink-0 ml-2 transition-transform duration-200 text-gray-500 group-hover:text-[#F48120] ${isDropdownOpen ? 'transform rotate-180' : ''}`}
                                    />
                                  </button>

                                  {isDropdownOpen && (
                                    <>
                                      <div
                                        className="fixed inset-0 bg-black/30 dark:bg-black/50 z-[999]"
                                        onClick={() => setIsDropdownOpen(false)}
                                        aria-hidden="true"
                                      />
                                      <div className="absolute z-[1000] mt-1 w-full bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-gray-200 dark:border-neutral-700 overflow-hidden">
                                        <div className="sticky top-0 bg-white dark:bg-neutral-800 z-10 p-3 border-b border-gray-100 dark:border-neutral-700 shadow-sm">
                                          <div className="relative">
                                            <input
                                              type="text"
                                              placeholder="Buscar prompt..."
                                              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-neutral-900 border-2 border-gray-200 dark:border-neutral-600 rounded-xl focus:ring-0 focus:border-[#F48120] dark:focus:border-[#F48120] transition-colors placeholder-gray-400 dark:placeholder-gray-500"
                                              value={searchTerm}
                                              onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                            <MagnifyingGlass
                                              size={18}
                                              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                              weight="duotone"
                                            />
                                            {searchTerm && (
                                              <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                aria-label="Limpiar búsqueda"
                                              >
                                                <X size={16} weight="bold" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                          {filteredPrompts.length > 0 ? (
                                            filteredPrompts.map((prompt) => (
                                              <div
                                                key={prompt.id}
                                                className="group px-4 py-3 hover:bg-gray-50 dark:hover:bg-neutral-700/50 cursor-pointer border-b border-gray-100 dark:border-neutral-700 last:border-0 transition-colors duration-150"
                                                onClick={() => selectPrompt(prompt)}
                                              >
                                                <div className="flex items-start justify-between gap-3">
                                                  <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                      <span className="truncate">{prompt.name}</span>
                                                      {systemPrompt === prompt.content && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F48120]/10 text-[#F48120] border border-[#F48120]/20">
                                                          En uso
                                                        </span>
                                                      )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 break-words">
                                                      {prompt.content}
                                                    </p>
                                                  </div>
                                                  <div className="flex space-x-1 flex-shrink-0 pt-1">
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPromptToEdit(prompt);
                                                        setEditPromptName(prompt.name);
                                                        setEditPromptContent(prompt.content);
                                                        setIsEditModalOpen(true);
                                                        setIsDropdownOpen(false);
                                                      }}
                                                      className="p-1.5 text-gray-500 hover:text-[#F48120] rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
                                                      title="Editar prompt"
                                                      aria-label={`Editar ${prompt.name}`}
                                                    >
                                                      <PencilSimple size={16} weight="bold" />
                                                    </button>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setPromptToDelete(prompt);
                                                        setIsDeleteModalOpen(true);
                                                        setIsDropdownOpen(false);
                                                      }}
                                                      className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-600 transition-colors"
                                                      title="Eliminar prompt"
                                                      aria-label={`Eliminar ${prompt.name}`}
                                                    >
                                                      <Trash size={16} weight="bold" />
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                                              {searchTerm ? 'No se encontraron resultados' : 'No hay prompts guardados'}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                  <button
                                    onClick={() => setIsPromptModalOpen(true)}
                                    className="flex-1 sm:flex-none flex items-center justify-center p-3 sm:p-2.5 rounded-lg bg-[#F48120]/10 hover:bg-[#F48120]/20 text-[#F48120] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    aria-label="Guardar prompt"
                                    disabled={!systemPrompt.trim()}
                                  >
                                    <FloppyDisk size={20} weight="duotone" className="sm:block" />
                                    <span className="ml-2 sm:hidden text-sm">Guardar</span>
                                  </button>
                                </div>
                              </div>

                              <div className="relative">
                                <div
                                  className="text-sm p-4 pr-12 bg-white/50 dark:bg-neutral-800/50 rounded-lg border border-dashed border-gray-200 dark:border-neutral-700 cursor-pointer transition-colors hover:bg-white/70 dark:hover:bg-neutral-800/70 active:bg-white/90 dark:active:bg-neutral-800/90 min-h-[80px]"
                                  onClick={() => setIsModalOpen(true)}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && setIsModalOpen(true)}
                                  aria-label="Editar prompt del sistema"
                                >
                                  <p 
                                    className={`${!systemPrompt ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-700 dark:text-gray-300'} 
                                    break-words overflow-hidden text-ellipsis line-clamp-3`}
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      maxHeight: '4.5em' 
                                    }}
                                  >
                                    {systemPrompt || 'Haz clic para editar el prompt del sistema...'}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsModalOpen(true);
                                  }}
                                  className="absolute right-2 bottom-2 p-2 rounded-lg bg-white/80 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/50 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 hover:bg-[#F48120]/10 transition-colors"
                                  aria-label="Editar prompt"
                                >
                                  <NotePencil size={18} weight="duotone" className="text-[#F48120]" />
                                </button>
                              </div>
                            </div> */}

                            {/* Modals */}
                            {createPortal(
                              <Modal
                                isOpen={isModalOpen}
                                onClose={() => setIsModalOpen(false)}
                                className="w-full max-w-6xl mx-auto flex flex-col"
                                hideSubmitButton={true}
                              >
                                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Editor de Prompt</h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Edita el contenido del prompt del sistema
                                  </p>
                                </div>
                                <div className="flex-1 overflow-hidden flex flex-col">
                                  <div className="flex-1 overflow-auto p-1">
                                    <textarea
                                      className="w-full h-full min-h-[200px] p-4 text-base md:text-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                                      value={systemPrompt}
                                      onChange={(e) => setSystemPrompt(e.target.value)}
                                      placeholder="Escribe aquí el prompt del sistema..."
                                      aria-label="Editor de prompt del sistema"
                                      spellCheck="false"
                                      autoCapitalize="off"
                                      autoComplete="off"
                                      autoCorrect="off"
                                      autoFocus
                                    />
                                  </div>
                                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setIsModalOpen(false)}
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                                    >
                                      Cerrar
                                    </button>
                                  </div>
                                </div>
                              </Modal>,
                              document.body
                            )}

                            {createPortal(
                              <Modal
                                isOpen={isPromptModalOpen}
                                onClose={() => setIsPromptModalOpen(false)}
                                className="w-full max-w-[min(95vw,500px)] mx-auto"
                                hideSubmitButton={true}
                              >
                                <div className="p-5 sm:p-6 space-y-5">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Guardar Prompt del Sistema</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Asigna un nombre descriptivo para tu prompt</p>
                                  </div>
                                  <div className="space-y-3">
                                    <div>
                                      <label htmlFor="prompt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del prompt
                                      </label>
                                      <input
                                        id="prompt-name"
                                        type="text"
                                        placeholder="Ej: Respuestas profesionales"
                                        className="w-full px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                                        value={promptName}
                                        onChange={(e) => setPromptName(e.target.value)}
                                        autoFocus
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3 pt-2">
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                                      onClick={() => setIsPromptModalOpen(false)}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                                      onClick={() => {
                                        savePrompt();
                                      }}
                                    >
                                      <FloppyDisk size={18} weight="bold" />
                                      Guardar
                                    </button>
                                  </div>
                                </div>
                              </Modal>,
                              document.body
                            )}

                            {createPortal(
                              <Modal
                                isOpen={isDeleteModalOpen}
                                onClose={() => {
                                  setIsDeleteModalOpen(false);
                                  setPromptToDelete(null);
                                }}
                                className="w-full max-w-[min(95vw,500px)] mx-auto"
                                hideSubmitButton={true}
                              >
                                <div className="p-5 sm:p-6 space-y-5">
                                  <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 mb-3">
                                      <Trash size={24} className="text-red-600 dark:text-red-400" weight="fill" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">¿Eliminar prompt?</h3>
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-500 dark:text-gray-400">
                                        ¿Estás seguro de que deseas eliminar "{promptToDelete?.name}"? Esta acción no se puede deshacer.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3 pt-2">
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                                      onClick={() => {
                                        setIsDeleteModalOpen(false);
                                        setPromptToDelete(null);
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                                      onClick={() => {
                                        confirmDelete();
                                      }}
                                    >
                                      <Trash size={18} weight="bold" />
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </Modal>,
                              document.body
                            )}

                            {createPortal(
                              <Modal
                                isOpen={isEditModalOpen}
                                onClose={() => {
                                  setIsEditModalOpen(false);
                                  setPromptToEdit(null);
                                  setEditPromptName('');
                                  setEditPromptContent('');
                                }}
                                className="w-full max-w-[min(95vw,500px)] mx-auto"
                                hideSubmitButton={true}
                              >
                                <div className="p-5 sm:p-6 space-y-5">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Editar Prompt del Sistema</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Actualiza los detalles del prompt</p>
                                  </div>
                                  <div className="space-y-4">
                                    <div>
                                      <label htmlFor="edit-prompt-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre del prompt
                                      </label>
                                      <input
                                        id="edit-prompt-name"
                                        type="text"
                                        placeholder="Ej: Respuestas profesionales"
                                        className="w-full px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                                        value={editPromptName}
                                        onChange={(e) => setEditPromptName(e.target.value)}
                                        autoFocus
                                      />
                                    </div>
                                    <div>
                                      <label htmlFor="edit-prompt-content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Contenido
                                      </label>
                                      <textarea
                                        id="edit-prompt-content"
                                        placeholder="Escribe el contenido del prompt..."
                                        className="w-full h-40 px-4 py-2.5 text-sm sm:text-base rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                                        value={editPromptContent}
                                        onChange={(e) => setEditPromptContent(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-3 pt-2">
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-gray-900"
                                      onClick={() => {
                                        setIsEditModalOpen(false);
                                        setPromptToEdit(null);
                                        setEditPromptName('');
                                        setEditPromptContent('');
                                      }}
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      className="px-4 py-2.5 text-sm font-medium rounded-lg bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-900 transition-colors flex items-center gap-2"
                                      onClick={() => {
                                        confirmEdit();
                                      }}
                                    >
                                      <FloppyDisk size={18} weight="bold" />
                                      Guardar Cambios
                                    </button>
                                  </div>
                                </div>
                              </Modal>,
                              document.body
                            )}
                          </div>

                          <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Prompt del Sistema</h4>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSidebar();
                              setIsOpen(false);
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors"
                            variants={menuItemVariants}
                            custom={isMobile ? 1 : 0}
                            initial="closed"
                            animate="open"
                          >
                            <UserCirclePlus size={18} weight="duotone" className="mr-3 text-[#F48120]" />
                            Personaliza tus prompts
                          </motion.button>
                        </div>

                        {/* Comportamiento Section */}
                        {/* <div className="px-2 py-1 mt-4 mb-2">
                          <div className="text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80 mb-2">Comportamiento</div>
                        </div> */}

                        {/* Categoría: Configuración de IA */}
                        <div className="px-2 py-2">
                          <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 mt-2">Configuración de IA</h4>

                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAISettingsClick();
                              setIsOpen(false);
                              // controls.start('closed').then(() => {
                              //   setTimeout(() => setIsOpen(false), 150);
                              // });
                            }}
                            className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors"
                            variants={menuItemVariants}
                            custom={1}
                            initial="closed"
                            animate="open"
                          >
                            <Gear size={18} weight="duotone" className="mr-3 text-purple-500" />
                            Configuración Asistente IA
                          </motion.button>
                        </div>
                        <div className="px-2 py-2">
                          {/* Categoría: Ajustes de Interfaz */}
                          <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 mt-2">Ajustes de Interfaz</h4>

                          <motion.button
                            // onClick={() => navigateToPanel('settings')}
                            onClick={() => setShowSettingsMenu(true)}
                            className="flex w-full items-center justify-between px-4 py-3 rounded-xl bg-white dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-purple-500/50 transition-colors"
                            variants={menuItemVariants}
                            custom={3}
                            initial="closed"
                            animate="open"
                          >
                            <PaintBrushBroad size={18} weight="duotone" className="mr-3 text-green-500" />
                            Ajustes Personalizados
                          </motion.button>

                        </div>
                        {/* Nivel de Asistencia */}
                        {selectedModel === 'gemini-2.0-flash' && (
                          <div className="px-2 py-2">
                            <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2 mt-2">Nivel de Asistencia</h4>
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

                        {/* Opciones Avanzadas Section */}
                        {/* <div className="px-2 py-1 mt-4 mb-2">
                          <div className="text-xs font-bold text-[#F48120] tracking-wide uppercase opacity-80 mb-2">Opciones Avanzadas</div>
                        </div> */}

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
                        <div className="pt-4">
                          <button
                            onClick={() => navigateToPanel('main')}
                            className="w-full py-2.5 px-4 text-sm font-medium text-[#F48120] hover:bg-[#F48120]/10 dark:hover:bg-[#F48120]/20 rounded-lg transition-colors"
                          >
                            Volver al menú
                          </button>
                        </div>
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
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
