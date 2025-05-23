import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { APPROVAL } from "./shared";
import type { tools } from "./tools";
import { AIConfigProvider, useAIConfig } from "@/contexts/AIConfigContext";
import { ModelProvider, useModel } from "@/contexts/ModelContext";
import { ChatProvider } from "@/contexts/ChatContext";
import "@/styles/markdown.css";
import { MessageView } from "@/components/message/MessageView";
import { ChatHeader } from "@/components/chat/ChatHeader";
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Tooltip } from "@/components/tooltip/Tooltip";
import { AISettingsPanel } from "@/components/settings/AISettingsPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { SideMenu } from "@/components/sidemenu/SideMenu";
import { useAuth } from "@/contexts/AuthContext";
import { createPortal } from "react-dom";

// Icon imports
import {
  Bug,
  Moon,
  PaperPlaneRight,
  Robot,
  Sun,
  Trash,
  Gear,
  List,
  Brain,
  X,
  Question,
  CaretLeft,
  CaretRight,
  CaretCircleDown,
  CaretCircleDoubleUp,
  Wrench,
  Files,
  DotsThreeCircleVertical,
  Rocket,
  Users,
  ArrowRight,
  ArrowsOut,
  PlusCircle,
  Stop,
  ListBullets,
  ChatCenteredDots,
  PaintBrushBroad,
  Minus,
  Plus,
  GearSix,
  DotsThreeVertical
} from "@phosphor-icons/react";
import AuthPopup from "./components/AuthPopup";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ClearHistoryDialog } from "./components/dialog/ClearHistoryDialog";
import { OIAICreator } from "./components/modal/OIAICreator";
import { useState as useOIAIState } from "react";
import { ModernAgentInterface } from "@/components/agent/ModernAgentInterface";
import { ToolsInterface } from "@/components/agent/ToolsInterface";
import { ModernAgentTool } from "./components/agent/ModernAgentTool";
import { AgentDashboard } from "./components/agent/AgentDashboard";
import { Modal } from "./components/modal/Modal";
import { Input } from "./components/input/Input";
import { InputSystemPrompt } from "./components/input/InputSystemPrompt";
import { ModelSelect } from "./components/model/ModelSelect";
import { GeminiConfigModal } from "./components/modal/GeminiConfigModal";
import { ListHeart } from "@phosphor-icons/react/dist/ssr";
import type { ChatMessage, FormattedChatMessage, APIResponse } from "./types/api";

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  // "getWeatherInformation",
];

function ChatComponent() {
  const { config } = useAIConfig();
  const { selectedModel } = useModel();
  const [showOIAICreator, setShowOIAICreator] = useOIAIState(false);
  const [showGeminiConfig, setShowGeminiConfig] = useState(false);
  const [currentMessages, setCurrentMessages] = useState<FormattedChatMessage[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const handleChatSelect = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      if (response.ok) {
        const data = await response.json() as APIResponse<ChatMessage>;
        if (data.success && Array.isArray(data.messages)) {
          const formattedMessages = data.messages.map(msg => {
            return {
              ...msg,
              createdAt: new Date(msg.createdAt)
            } as FormattedChatMessage;
          });
          setCurrentMessages(formattedMessages);
          setSelectedChatId(chatId);

          // Disparar evento para actualizar la interfaz
          window.dispatchEvent(new CustomEvent('chatSelected', {
            detail: {
              chatId,
              messages: formattedMessages,
              isInitialLoad: false
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  };

  const handleNewChat = () => {
    setCurrentMessages([]);
    setSelectedChatId(null);
  };

  const handleOIAICopy = (content: string) => {
    setInputText(content);
    setShowOIAICreator(false);
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAutoHidden, setIsAutoHidden] = useState(false);

  // Auto-hide sidebar after inactivity on desktop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const handleActivity = () => {
      setIsAutoHidden(false);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (window.innerWidth >= 1024) { // lg breakpoint
          setIsAutoHidden(true);
        }
      }, 5000); // 5 seconds of inactivity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearTimeout(timeoutId);
    };
  }, []);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);

  // Efecto para cerrar el menú de configuración cuando se abre la barra lateral
  useEffect(() => {
    if (isSidebarOpen) {
      setShowSettingsMenu(false);
    }
  }, [isSidebarOpen]);
  const [theme, setTheme] = useState<"dark" | "light">(() => {

    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(false);
  const [showAgentInterface, setShowAgentInterface] = useState(false);
  const [showToolsInterface, setShowToolsInterface] = useState(false);
  const [inputText, setInputText] = useState('');

  // Interfaz para la respuesta de la API
  interface SystemPromptResponse {
    prompt: string;
  }

  // Función para sincronizar el prompt del sistema con el servidor
  // const syncSystemPrompt = async () => {
  //   try {
  //     const response = await fetch('/api/system-prompt');
  //     const data = await response.json() as SystemPromptResponse;
  //     setInputText(data.prompt);
  //   } catch (error) {
  //     console.error('Error al obtener el prompt del sistema:', error);
  //   }
  // };

  // // Sincronizar el prompt del sistema al montar el componente
  // useEffect(() => {
  //   syncSystemPrompt();
  // }, []);

  // Función para actualizar el prompt del sistema en el servidor
  // const updateSystemPrompt = async (newPrompt: string) => {
  //   try {
  //     await fetch('/api/system-prompt', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ prompt: newPrompt }),
  //     });
  //   } catch (error) {
  //     console.error('Error al actualizar el prompt del sistema:', error);
  //   }
  // };
  const [stepMax, setStepMax] = useState(1);
  const [isUpdatingStepMax, setIsUpdatingStepMax] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
  const [showAssistantControls, setShowAssistantControls] = useState(false);
  const [showAssistantControlsAvanced, setShowAssistantControlsAvanced] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'small'>(() => {
    const savedSize = localStorage.getItem('textSize');
    return (savedSize as 'normal' | 'large' | 'small') || 'normal';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, setIsLoginOpen } = useAuth();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    // Apply theme class on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }

    // Save theme preference to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Escuchar el evento de carga inicial del chat
  useEffect(() => {
    const handleInitialChatLoaded = (event: CustomEvent<{ chatId: string; messages: ChatMessage[] }>) => {
      const formattedMessages = (event.detail.messages || []).map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt)
      }));
      setCurrentMessages(formattedMessages);
    };

    window.addEventListener('initialChatLoaded', handleInitialChatLoaded as EventListener);

    return () => {
      window.removeEventListener('initialChatLoaded', handleInitialChatLoaded as EventListener);
    };
  }, []);

  // Escuchar el evento de selección de chat
  // useEffect(() => {
  //   const handleChatSelected = (event: CustomEvent<{ chatId: string; messages: ChatMessage[] }>) => {
  //     const formattedMessages = (event.detail.messages || []).map(msg => ({
  //       ...msg,
  //       createdAt: new Date(msg.createdAt)
  //     }));
  //     setCurrentMessages(formattedMessages);
  //   };

  //   window.addEventListener('chatSelected', handleChatSelected as EventListener);

  //   return () => {
  //     window.removeEventListener('chatSelected', handleChatSelected as EventListener);
  //   };
  // }, []);

  useEffect(() => {
    // Save text size preference to localStorage
    localStorage.setItem('textSize', textSize);
  }, [textSize]);

  useEffect(() => {
    const handleOpenModernAgentInterface = () => {
      setShowAgentInterface(true);
    };

    const handleOpenToolsInterface = () => {
      setShowAgent(true);
    };

    const handleOpenSystemPrompt = () => {
      setSystemPrompt(true);
    };

    window.addEventListener('openModernAgentInterface', handleOpenModernAgentInterface);
    window.addEventListener('openToolsInterface', handleOpenToolsInterface);
    window.addEventListener('openSystemPrompt', handleOpenSystemPrompt);

    return () => {
      window.removeEventListener('openModernAgentInterface', handleOpenModernAgentInterface);
      window.removeEventListener('openToolsInterface', handleOpenToolsInterface);
      window.removeEventListener('openSystemPrompt', handleOpenSystemPrompt);
    };
  }, []);

  // Scroll to bottom on mount
  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  interface AgentInstance {
    setConfig: (config: any) => void;
  }

  const agent = useAgent({
    agent: "chat",
  }) as AgentInstance;

  // useEffect(() => {
  //   console.log('Configuración:', config);
  // }, [config]);

  const {
    messages: agentMessages,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory
    // isLoading,
    // stop
  } = useAgentChat({
    agent,
    maxSteps: stepMax,
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    agentMessages.length > 0 && scrollToBottom();
  }, [agentMessages, scrollToBottom]);

  const pendingToolCallConfirmation = agentMessages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(
          part.toolInvocation.toolName as keyof typeof tools
        )
    )
  );

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const [chatWidth, setChatWidth] = useState<'narrow' | 'default' | 'full'>('default');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Cerrar menú al hacer clic fuera de él
  useEffect(() => {
    const handleClickAnywhere = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menu = menuRef.current;
      const button = menuButtonRef.current;

      // Verificar si el clic fue fuera del menú y del botón
      if (menu && button && !menu.contains(target) && !button.contains(target)) {
        // console.log('Clic fuera del menú, cerrando...');
        setShowMenu(false);
      }
    };

    if (showMenu) {
      // console.log('Añadiendo event listener para cerrar menú');
      document.addEventListener('mousedown', handleClickAnywhere);
    }

    return () => {
      // console.log('Limpiando event listener de cierre de menú');
      document.removeEventListener('mousedown', handleClickAnywhere);
    };
  }, [showMenu]);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const assistantControlsRef = useRef<HTMLDivElement>(null);
  const assistantButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleChatWidth = (event: CustomEvent<{ width: 'narrow' | 'default' | 'full' }>) => {
      setChatWidth(event.detail.width);
    };

    const handleClickOutsideSettings = (event: MouseEvent) => {
      if (settingsMenuRef.current && settingsButtonRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        !settingsButtonRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    const handleClickOutsideAssistant = (event: MouseEvent) => {
      if (assistantControlsRef.current && assistantButtonRef.current &&
        !assistantControlsRef.current.contains(event.target as Node) &&
        !assistantButtonRef.current.contains(event.target as Node)) {
        setShowAssistantControls(false);
      }
    };

    window.addEventListener('toggleChatWidth', handleChatWidth as EventListener);
    document.addEventListener('mousedown', handleClickOutsideSettings);
    document.addEventListener('mousedown', handleClickOutsideAssistant);

    return () => {
      window.removeEventListener('toggleChatWidth', handleChatWidth as EventListener);
      document.removeEventListener('mousedown', handleClickOutsideSettings);
      document.removeEventListener('mousedown', handleClickOutsideAssistant);
    };
  }, []);

  const getMainWidth = () => {
    switch (chatWidth) {
      case 'narrow':
        return 'max-w-3xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-6xl';
    }
  };

  return (
    <ChatProvider>
      <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
        <GeminiConfigModal isOpen={showGeminiConfig} onClose={() => setShowGeminiConfig(false)} />
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          theme={theme}
          onThemeChange={toggleTheme}
          onPromptSelect={(prompt) => handleAgentInputChange({ target: { value: prompt } } as any)}
        />
        <SideMenu
          isOpen={isSideMenuOpen}
          onClose={() => setIsSideMenuOpen(false)}
          onOpenSettings={() => setShowSettingsMenu(true)}
          onOpenTools={() => setShowToolsInterface(true)}
          onClearHistory={() => setShowClearDialog(true)}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
          selectedChatId={selectedChatId}
        />
        <main className="flex-1 w-full px-4 py-4 relative">
          {/* Botón flotante de configuración */}
          {/* Mobile Menu Button */}
          <div className="lg:hidden fixed top-0 left-0 right-0 px-4 py-3 flex justify-between items-center z-20 bg-gradient-to-b from-white/80 to-white/0 dark:from-neutral-900/80 dark:to-neutral-900/0 backdrop-blur-sm">
            <Button
              variant="ghost"
              size="sm"
              className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group
                         hover:shadow-lg hover:shadow-[#F48120]/25 dark:hover:shadow-purple-500/25
                         transform hover:scale-110 active:scale-95 transition-all duration-300"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <div className="absolute inset-[1px] rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center
                            overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#F48120] before:to-purple-500 before:opacity-0
                            before:transition-opacity before:duration-300 group-hover:before:opacity-100">
                <List size={20} className="relative z-10 text-[#F48120] group-hover:text-white transition-colors duration-300" weight="duotone" />
              </div>
            </Button>

            {/* Dropdown Menu */}
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
                  // console.log('Botón de menú clickeado');
                  setShowMenu(prev => !prev);
                }}
              >
                <DotsThreeVertical size={20} className="text-[#F48120]" weight="duotone" />
              </Button>

              {showMenu && (
                <div
                  ref={menuRef}
                  className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100%-1rem)] sm:w-56 max-w-sm origin-top-right rounded-xl bg-white dark:bg-neutral-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden
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
                      {/* Compact Assistant Level Selector */}
                      <div className="px-4 py-2 space-y-2">
                        {/* Level Indicator Bar */}
                        <div className="relative h-2 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full overflow-hidden shadow-inner">
                          <div
                            className="h-full bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-lg"
                            style={{ width: `${(stepMax / 10) * 100}%` }}
                          ></div>
                        </div>
                        {/* Level Labels */}
                        <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
                          <span className={stepMax <= 2 ? 'text-[#F48120] font-semibold' : ''}>Rápido</span>
                          <span className={stepMax > 2 && stepMax <= 5 ? 'text-[#F48120] font-semibold' : ''}>Equilibrado</span>
                          <span className={stepMax > 5 && stepMax <= 8 ? 'text-[#F48120] font-semibold' : ''}>Profundo</span>
                          <span className={stepMax > 8 ? 'text-[#F48120] font-semibold' : ''}>Experto</span>
                        </div>
                        {/* Preset Buttons */}
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setStepMax(1)}
                            className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                              ${stepMax === 1 ?
                                'bg-gradient-to-br from-[#F48120]/20 to-orange-400/20 border-2 border-[#F48120]/50 shadow-lg shadow-[#F48120]/20' :
                                'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-[#F48120]/30 hover:shadow-md'}`}
                          >
                            <span className="text-lg">🎯</span>
                            <div className="text-xs font-bold">Básico</div>
                          </button>
                          <button
                            onClick={() => setStepMax(3)}
                            className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                              ${stepMax > 1 && stepMax <= 3 ?
                                'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20' :
                                'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-blue-500/30 hover:shadow-md'}`}
                          >
                            <span className="text-lg">🧠</span>
                            <div className="text-xs font-bold">Equilibrado</div>
                          </button>
                          <button
                            onClick={() => setStepMax(7)}
                            className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                              ${stepMax > 3 && stepMax <= 7 ?
                                'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' :
                                'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-purple-500/30 hover:shadow-md'}`}
                          >
                            <span className="text-lg">🚀</span>
                            <div className="text-xs font-bold">Avanzado</div>
                          </button>
                          <button
                            onClick={() => setStepMax(10)}
                            className={`group relative overflow-hidden p-2 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                              ${stepMax > 7 ?
                                'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20' :
                                'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-emerald-500/30 hover:shadow-md'}`}
                          >
                            <span className="text-lg">🤖</span>
                            <div className="text-xs font-bold">Experto</div>
                          </button>
                        </div>
                        {/* Fine-tune Slider */}
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
                            onChange={(e) => {
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
              className="relative w-10 h-10 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 p-[1.5px] group
                         hover:shadow-lg hover:sha  dow-[#F48120]/25 dark:hover:shadow-purple-500/25
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

          {/* Desktop Sidebar */}
          <div
            className={`fixed left-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-in-out group
                      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                      ${isAutoHidden ? 'lg:-translate-x-full' : ''}
                      hover:translate-x-0`}>
            {/* Hover indicator */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full 
                          w-1.5 h-20 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-r-lg
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          lg:opacity-100 pointer-events-none"></div>
            <div className="relative flex flex-col gap-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150">
              {/* <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-center"
                onClick={() => setIsSideMenuOpen(true)}
              >
                <ChatCenteredDots size={20} className="text-[#F48120]" weight="duotone" />
              </Button> */}
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-center"
                onClick={() => setIsSidebarOpen(true)}
              >
                <List size={20} className="text-[#F48120]" weight="duotone" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-center"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Gear size={20} className="text-[#F48120]" weight="duotone" />
              </Button>

              <Button
                ref={settingsButtonRef}
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-center"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              >
                <PaintBrushBroad size={20} className="text-[#F48120]" weight="duotone" />
              </Button>

              {/* <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-center"
                onClick={() => setShowToolsInterface(true)}
              >
                <Rocket size={20} weight="duotone" className="text-[#F48120]" />
              </Button> */}

              {/* <Tooltip content="Configurar Gemini API">
              <Button
                variant="ghost"
                size="md"
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                flex items-center justify-center"
                onClick={() => setShowGeminiConfig(true)}
              >
                <Brain className="text-[#F48120]" size={20} weight="duotone" />
              </Button>
            </Tooltip> */}

              <Tooltip content="Limpiar historial">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                flex items-center justify-center"
                  onClick={() => setShowClearDialog(true)}
                >
                  <Trash className="text-[#F48120]" size={20} weight="duotone" />
                </Button>
              </Tooltip>

              <Tooltip content="Crear IA">
                <Button
                  variant="ghost"
                  size="md"
                  className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                flex items-center justify-center"
                  onClick={() => setShowOIAICreator(true)}
                >
                  <PlusCircle className="text-[#F48120]" size={29} weight="duotone" />
                </Button>
              </Tooltip>

              {showSettingsMenu && createPortal(
                <div
                  ref={settingsMenuRef}
                  className="fixed bottom-16 left-1/2 -translate-x-1/2 sm:absolute sm:bottom-auto sm:left-auto sm:translate-x-0 sm:mt-2 
                         w-[calc(100vw-2rem)] sm:min-w-[200px] sm:w-auto
                         bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150 z-50"
                  style={window.innerWidth >= 640 ? {
                    left: settingsButtonRef.current?.getBoundingClientRect().right ?? 0 + 8,
                    top: settingsButtonRef.current?.getBoundingClientRect().top ?? 0
                  } : {}}
                >
                  <div className="p-2 space-y-1">
                    <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Ancho del chat</div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                      onClick={() => {
                        const event = new CustomEvent('toggleChatWidth', {
                          detail: { width: 'narrow' }
                        });
                        window.dispatchEvent(event);
                        setShowSettingsMenu(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                      <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Reducido</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                      onClick={() => {
                        const event = new CustomEvent('toggleChatWidth', {
                          detail: { width: 'default' }
                        });
                        window.dispatchEvent(event);
                        setShowSettingsMenu(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                      <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Normal</span>
                    </button>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                      onClick={() => {
                        const event = new CustomEvent('toggleChatWidth', {
                          detail: { width: 'full' }
                        });
                        window.dispatchEvent(event);
                        setShowSettingsMenu(false);
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                      <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Completo</span>
                    </button>
                    <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
                    <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Tamaño del texto</div>
                    <div className="flex items-center justify-center gap-2 px-4 py-2">
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                                text-neutral-700 dark:text-neutral-300
                                hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                transition-all duration-300 ${textSize === 'small' ? 'bg-[#F48120]/10 text-[#F48120]' : ''}
                                group/item`}
                        onClick={() => {
                          setTextSize('small');
                          setShowSettingsMenu(false);
                        }}
                      >
                        <span className="text-xs font-bold group-hover/item:text-[#F48120] transition-colors duration-300">A</span>
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                                text-neutral-700 dark:text-neutral-300
                                hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                transition-all duration-300 ${textSize === 'normal' ? 'bg-[#F48120]/10 text-[#F48120]' : ''}
                                group/item`}
                        onClick={() => {
                          setTextSize('normal');
                          setShowSettingsMenu(false);
                        }}
                      >
                        <span className="text-sm font-bold group-hover/item:text-[#F48120] transition-colors duration-300">A</span>
                      </button>
                      <button
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                                text-neutral-700 dark:text-neutral-300
                                hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                                dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                                transition-all duration-300 ${textSize === 'large' ? 'bg-[#F48120]/10 text-[#F48120]' : ''}
                                group/item`}
                        onClick={() => {
                          setTextSize('large');
                          setShowSettingsMenu(false);
                        }}
                      >
                        <span className="text-base font-bold group-hover/item:text-[#F48120] transition-colors duration-300">A</span>
                      </button>
                    </div>
                    <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
                    <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Tema</div>
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                      onClick={() => {
                        toggleTheme();
                        setShowSettingsMenu(false);
                      }}
                    >
                      {theme === "dark" ?
                        <Sun weight="duotone" className="w-5 h-5 text-amber-400" /> :
                        <Moon weight="duotone" className="w-5 h-5 text-blue-400" />
                      }
                      <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">
                        {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                      </span>
                    </button>
                  </div>
                </div>,
                document.body
              )}
              <div
                id="settingsMenu"
                className="absolute left-full ml-2 top-0 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                       border border-neutral-200/50 dark:border-neutral-700/50
                       backdrop-blur-lg backdrop-saturate-150
                       opacity-0 invisible -translate-y-2 transition-all duration-300 z-50"
              >
                <div className="p-2 space-y-1">
                  <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Ancho del chat</div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                           text-neutral-700 dark:text-neutral-300
                           hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                           dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                           transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'narrow' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Reducido</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                           text-neutral-700 dark:text-neutral-300
                           hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                           dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                           transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'default' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Normal</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                           text-neutral-700 dark:text-neutral-300
                           hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                           dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                           transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'full' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Completo</span>
                  </button>
                  <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
                  <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Tema</div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                           text-neutral-700 dark:text-neutral-300
                           hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                           dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                           transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={toggleTheme}
                  >
                    {theme === "dark" ?
                      <Sun weight="duotone" className="w-5 h-5 text-amber-400" /> :
                      <Moon weight="duotone" className="w-5 h-5 text-blue-400" />
                    }
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">
                      {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={`h-[calc(100vh-2rem)] w-full ${getMainWidth()} mx-auto flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800 transition-all duration-300`}>
            {/* Header with buttons */}
            {/* <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-2 flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors md:hidden"
                  aria-label="Abrir menú"
                >
                  <List size={20} className="text-neutral-700 dark:text-neutral-300" />
                </button>
                <h1 className="text-lg font-semibold text-neutral-800 dark:text-white">Asistente IA</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors relative"
                  aria-label="Configuración"
                >
                  <GearSix size={20} className="text-neutral-700 dark:text-neutral-300" />
                </button>
                
                <button
                  onClick={() => setShowAgent(!showAgent)}
                  className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="Herramientas de agente"
                >
                  <Robot size={20} className="text-neutral-700 dark:text-neutral-300" />
                </button>
              </div>
            </div> */}
            {/* <ChatHeader
            onOpenSidebar={() => {
              setIsSidebarOpen(true);
              document.dispatchEvent(new Event('sidebarOpen'));
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            showDebug={showDebug}
            onToggleDebug={() => setShowDebug((prev) => !prev)}
            textSize={textSize}
            onTextSizeChange={setTextSize}
          /> */}
            {/* <div className="flex items-center gap-2 justify-between w-full px-4 py-3">
            <div className="flex-1"></div>
          </div> */}

            {showAgent && (
              <ModernAgentTool
                isOpen={showAgent}
                onClose={() => setShowAgent(false)}
                onSaveAgent={(agent) => {
                  console.log('Agent saved:', agent);
                  setShowAgent(false);
                }}
              />
            )}

            {showToolsInterface && (
              <ToolsInterface
                isOpen={showToolsInterface}
                onClose={() => setShowToolsInterface(false)}
              />
            )}

            {showOIAICreator && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[85vh] overflow-hidden relative transform transition-all duration-300 scale-100 opacity-100">
                  <OIAICreator
                    onCopyContent={handleOIAICopy}
                    onClose={() => setShowOIAICreator(false)}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-1rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {agentMessages.length === 0 && (
                <div className="h-full flex items-center justify-center">
                  <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    className="w-full h-[85vh]"
                  >
                    <textarea
                      className="w-full h-[80vh] p-4 bg-transparent border-none focus:outline-none resize-none text-base md:text-lg"
                      value={agentInput}
                      onChange={handleAgentInputChange}
                      placeholder="Escribe tu mensaje aquí..."
                    />
                  </Modal>
                  <Card className="p-6 w-full max-w-md mx-auto bg-gradient-to-b from-neutral-100/80 to-neutral-50 dark:from-neutral-900/80 dark:to-neutral-950 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <div className="text-center space-y-6">
                      <div className="relative">
                        <div className="absolute -inset-4 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-full blur-2xl dark:from-[#F48120]/10 dark:to-purple-500/10"></div>
                        <div className="bg-gradient-to-r from-[#F48120] to-[#F48120]/80 text-white rounded-full p-4 inline-flex relative transform hover:scale-105 transition-transform duration-300 shadow-lg">
                          <Robot size={28} weight="duotone" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="font-bold text-2xl bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Asistente IA</h3>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div onClick={() => {
                          setShowModal(true);
                          handleAgentInputChange({ target: { value: "¿Cuál es el pronóstico del tiempo para Madrid este fin de semana?" } } as any);
                        }} className="group p-4 rounded-xl bg-[#F48120]/5 hover:bg-[#F48120]/10 dark:bg-[#F48120]/5 dark:hover:bg-[#F48120]/10 cursor-pointer transition-all duration-300 border border-transparent hover:border-[#F48120]/20">
                          <span className="text-2xl mb-2 block">🌤️</span>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Clima</span>
                        </div>

                        <div onClick={() => {
                          setShowModal(true);
                          handleAgentInputChange({ target: { value: "¿Qué hora es en Tokyo cuando son las 15:00 en Madrid?" } } as any);
                        }} className="group p-4 rounded-xl bg-[#F48120]/5 hover:bg-[#F48120]/10 dark:bg-[#F48120]/5 dark:hover:bg-[#F48120]/10 cursor-pointer transition-all duration-300 border border-transparent hover:border-[#F48120]/20">
                          <span className="text-2xl mb-2 block">🌍</span>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Horarios</span>
                        </div>

                        <div onClick={() => {
                          setShowModal(true);
                          handleAgentInputChange({ target: { value: "¿Podrías ayudarme a crear un plan de estudio?" } } as any);
                        }} className="group p-4 rounded-xl bg-[#F48120]/5 hover:bg-[#F48120]/10 dark:bg-[#F48120]/5 dark:hover:bg-[#F48120]/10 cursor-pointer transition-all duration-300 border border-transparent hover:border-[#F48120]/20">
                          <span className="text-2xl mb-2 block">💡</span>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Ayuda</span>
                        </div>
                      </div>

                      <div className="animate-bounce mt-8 text-neutral-500 dark:text-neutral-400">
                        <CaretCircleDown size={24} className="mx-auto" />
                        <p className="text-sm mt-2">Escribe tu consulta</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {agentMessages.map((m: Message, index) => {
                const isUser = m.role === "user";
                const showAvatar =
                  index === 0 || agentMessages[index - 1]?.role !== m.role;
                const showRole = showAvatar && !isUser;

                return (
                  <div key={m.id}>
                    {showDebug && (
                      <pre className="text-xs text-muted-foreground overflow-scroll">
                        {JSON.stringify(m, null, 2)}
                      </pre>
                    )}
                    <div
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"
                          }`}
                      >
                        {showAvatar && !isUser ? (
                          <Avatar username={"AI"} />
                        ) : (
                          !isUser && <div className="w-8" />
                        )}

                        <div>
                          <div>
                            {m.parts?.map((part, i) => {
                              if (part.type === "text") {
                                return (
                                  // biome-ignore lint/suspicious/noArrayIndexKey: it's fine here
                                  <div key={i}>
                                    <Card
                                      className={`p-4 rounded-2xl ${isUser
                                        ? 'bg-[#F48120]/10 dark:bg-[#F48120]/10 rounded-br-none ml-8'
                                        : 'bg-neutral-100 dark:bg-neutral-900/80 backdrop-blur-sm rounded-bl-none mr-8 border border-neutral-200 dark:border-neutral-700'
                                        } ${part.text.startsWith("scheduled message")
                                          ? "border-accent/50"
                                          : ""
                                        } relative ${textSize === 'small' ? 'text-sm' : textSize === 'large' ? 'text-lg' : 'text-base'} shadow-sm break-words transition-all duration-200`}
                                    >
                                      {part.text.startsWith(
                                        "scheduled message"
                                      ) && (
                                          <span className="absolute -top-3 -left-2 text-base">
                                            🕒
                                          </span>
                                        )}
                                      <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                          <MessageView
                                            key={`${m.id}-${i}`}
                                            text={part.text.replace(/^scheduled message: /, "")}
                                            onCopy={() => navigator.clipboard.writeText(part.text.replace(/^scheduled message: /, ""))}
                                          />
                                        </div>
                                      </div>
                                      {/* <div
                                      id={`message-${m.id}-${i}`}
                                      className="markdown-content"
                                    >
                                      <div className="text-sm">
                                        {document.getElementById(`message-${m.id}-${i}`)?.classList.contains('markdown-view') ? (
                                          <ReactMarkdown
                                            components={{
                                              code({node, inline, className, children, ...props}: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                  <SyntaxHighlighter
                                                    style={vscDarkPlus}
                                                    language={match[1]}
                                                    PreTag="div"
                                                    {...props}
                                                  >
                                                    {String(children).replace(/\n$/, '')}
                                                  </SyntaxHighlighter>
                                                ) : (
                                                  <code className={className} {...props}>
                                                    {children}
                                                  </code>
                                                );
                                              },
                                              h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-4" {...props} />,
                                              h2: ({node, ...props}) => <h2 className="text-xl font-bold my-3" {...props} />,
                                              h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
                                              p: ({node, ...props}) => <p className="my-2" {...props} />,
                                              ul: ({node, ...props}) => <ul className="list-disc list-inside my-2" {...props} />,
                                              ol: ({node, ...props}) => <ol className="list-decimal list-inside my-2" {...props} />,
                                              li: ({node, ...props}) => <li className="my-1" {...props} />,
                                              blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 pl-4 my-2 italic" {...props} />,
                                              em: ({node, ...props}) => <em className="italic" {...props} />,
                                              strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                                              a: ({node, ...props}) => <a className="text-blue-500 hover:underline" {...props} />
                                            }}
                                          >
                                            {part.text.replace(/^scheduled message: /, "")}
                                          </ReactMarkdown>
                                        ) : (
                                          <p className="whitespace-pre-wrap">
                                            {part.text.replace(/^scheduled message: /, "")}
                                          </p>
                                        )}
                                      </div>
                                    </div> */}
                                    </Card>
                                    <p
                                      className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : "text-left"
                                        }`}
                                    >
                                      {formatTime(
                                        new Date(m.createdAt as unknown as string)
                                      )}
                                    </p>
                                  </div>
                                );
                              }

                              if (part.type === "tool-invocation") {
                                const toolInvocation = part.toolInvocation;
                                const toolCallId = toolInvocation.toolCallId;

                                if (
                                  toolsRequiringConfirmation.includes(
                                    toolInvocation.toolName as keyof typeof tools
                                  ) &&
                                  toolInvocation.state === "call"
                                ) {
                                  return (
                                    <Card
                                      // biome-ignore lint/suspicious/noArrayIndexKey: it's fine here
                                      key={i}
                                      className="p-4 my-3 rounded-md bg-neutral-100 dark:bg-neutral-900"
                                    >
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="bg-[#F48120]/10 p-1.5 rounded-full">
                                          <Robot
                                            size={16}
                                            className="text-[#F48120]"
                                          />
                                        </div>
                                        <h4 className="font-medium">
                                          {toolInvocation.toolName}
                                        </h4>
                                      </div>

                                      <div className="mb-3">
                                        <h5 className="text-xs font-medium mb-1 text-muted-foreground">
                                          Arguments:
                                        </h5>
                                        <pre className="bg-background/80 p-2 rounded-md text-xs overflow-auto">
                                          {JSON.stringify(
                                            toolInvocation.args,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>

                                      <div className="flex gap-2 justify-end">
                                        <Button
                                          variant="primary"
                                          size="sm"
                                          onClick={() =>
                                            addToolResult({
                                              toolCallId,
                                              result: APPROVAL.NO,
                                            })
                                          }
                                        >
                                          Reject
                                        </Button>
                                        <Tooltip content={"Accept action"}>
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() =>
                                              addToolResult({
                                                toolCallId,
                                                result: APPROVAL.YES,
                                              })
                                            }
                                          >
                                            Approve
                                          </Button>
                                        </Tooltip>
                                      </div>
                                    </Card>
                                  );
                                }
                                return null;
                              }
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className={`${systemPrompt ? 'hidden' : ''} w-full max-w-7xl mx-auto pl-4 pr-10 rounded-full mb-0 border-b border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm transition-all duration-300 sm:mx-4 md:mx-8 lg:mx-auto`}>
              <div className="flex items-center justify-between gap-3">
                {/* <div className="flex items-center gap-2"> */}
                {/* <Tooltip content="Guía">
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                    onClick={() => setShowOiaiGuide(true)}
                  >
                    <Question size={20} weight="duotone" />
                  </Button>
                </Tooltip> */}
                {/* <Tooltip content="Crear IA">
                <Button
                  variant="ghost"
                  size="md"
                  shape="square"
                  className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                  onClick={() => setShowOIAICreator(true)}
                >
                  <PlusCircle size={20} weight="duotone" />
                </Button>
              </Tooltip> */}

                <div className={`flex flex-col lg:flex-row items-center justify-center w-full gap-2 ml-4 ${selectedModel !== 'gemini-2.0-flash' ? 'sm:mb-2 mt-2' : ''}`}>
         
                  <div className="w-full lg:w-auto lg:flex-1 max-w-[300px] lg:max-w-none">
                    <div className="relative">
                      <div className="relative">
                        <ModelSelect />
                      </div>
                    </div>
                  </div>

                  <div className="w-full lg:w-auto">
                    {selectedModel === 'gemini-2.0-flash' && !showAssistantControlsAvanced && (
                      <div className="relative group w-full max-w-[300px] mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#F48120]/20 via-purple-500/20 to-[#F48120]/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-lg transition-all duration-500 ease-out"></div>
                        
                        <div className="relative w-full">
                          <button
                            ref={assistantButtonRef}
                            onClick={(e) => {
                              setShowAssistantControls(!showAssistantControls);
                              e.currentTarget.blur();
                            }}
                            onMouseDown={(e) => e.preventDefault()} 
                            className={`relative w-full h-16 lg:h-14 flex items-center justify-between px-5 py-1 rounded-2xl 
                              backdrop-blur-sm overflow-hidden border
                              ${!stepMax ? 'border-[#F48120] animate-pulse shadow-lg' : 'border-neutral-200/60 dark:border-neutral-700/60'}
                              text-sm font-medium text-neutral-800 dark:text-neutral-100 
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F48120]/50 focus:ring-offset-white/90 dark:focus:ring-offset-neutral-900/90
                              transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                              hover:border-[#F48120]/60 dark:hover:border-[#F48120]/60
                              transform hover:scale-[1.01] active:scale-[0.99]
                              cursor-pointer 
                              bg-white/70 dark:bg-neutral-900/70
                              shadow-sm hover:shadow-lg hover:shadow-[#F48120]/5 dark:shadow-neutral-900/20
                              before:absolute before:inset-0 before:bg-gradient-to-br before:from-[#F48120]/5 before:via-purple-500/5 before:to-transparent 
                              before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
                              focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#F48120]/50`}
                          >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-[#F48120]/3 via-purple-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            
                            <div className="relative z-10 w-full flex items-center justify-between">
                              <div className="flex items-center gap-3.5">
                                <div className="relative flex-shrink-0">
                                  <div className="absolute -inset-1.5 bg-gradient-to-r from-[#F48120] to-purple-500 rounded-full opacity-0 group-hover:opacity-20 blur-sm transition-opacity duration-300"></div>
                                  <div className="relative flex items-center justify-center w-9 h-9 bg-transparent">
                                    <span className="text-xl transform group-hover:scale-110 transition-transform duration-300 border-0 outline-none">
                                      {stepMax == 1 ? '🎯' : stepMax <= 3 ? '🧠' : stepMax <= 7 ? '🚀' : '🤖'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-left space-y-0.5">
                                  <div className="text-sm font-semibold tracking-tight bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                                    {stepMax == 1 ? 'Básico' : stepMax <= 3 ? 'Equilibrado' : stepMax <= 7 ? 'Avanzado' : 'Experto'}
                                  </div>
                                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium tracking-wide">
                                    Nivel {stepMax}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2.5">
                                <div className="w-16 h-1.5 bg-neutral-100/70 dark:bg-neutral-800/70 rounded-full overflow-hidden border border-neutral-200/50 dark:border-neutral-700/50">
                                  <div 
                                    className="h-full bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-inner"
                                    style={{ width: `${(stepMax / 10) * 100}%` }}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-transparent w-full h-full opacity-0"></div>
                                  </div>
                                </div>
                                
                                <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/20 dark:to-purple-500/20 border border-[#F48120]/10 dark:border-[#F48120]/20 shadow-sm group-hover:shadow-md transition-all duration-300">
                                  <span className="text-xs font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                                    {stepMax}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {showAssistantControls && createPortal(
                            <div
                              ref={assistantControlsRef}
                              className="fixed bottom-20 left-1/2 -translate-x-1/2 lg:fixed lg:bottom-auto lg:top-1/2 lg:left-1/2 lg:-translate-y-1/2 lg:translate-x-0 lg:mx-0 w-[calc(100vw-1rem)] lg:w-80 max-w-sm bg-white/95 dark:bg-neutral-900/95 rounded-2xl shadow-2xl border border-neutral-200/30 dark:border-neutral-700/30 backdrop-blur-xl backdrop-saturate-150 overflow-hidden transform origin-bottom lg:origin-center transition-all duration-500 z-50"
                              style={{
                                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
                                ...(theme === 'dark' && {
                                  background: 'linear-gradient(135deg, rgba(23,23,23,0.95) 0%, rgba(38,38,38,0.95) 100%)'
                                })
                              }}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-2xl blur-sm opacity-50"></div>
                              
                              <div className="relative p-4 space-y-4">
                                <div className="text-center space-y-2">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">{stepMax}</span>
                                    </div>
                                    <h3 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Nivel de Asistencia</h3>
                                  </div>
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400">Configura la profundidad del análisis</p>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="relative h-3 bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 rounded-full overflow-hidden shadow-inner">
                                    <div 
                                      className="h-full bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 transition-all duration-700 ease-out rounded-full shadow-lg"
                                      style={{ width: `${(stepMax / 10) * 100}%` }}
                                    ></div>
                                    <div 
                                      className="absolute top-0 h-full bg-gradient-to-r from-[#F48120]/50 to-purple-500/50 rounded-full blur-sm transition-all duration-700"
                                      style={{ width: `${(stepMax / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                  
                                  <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400 px-1">
                                    <span className={stepMax <= 2 ? 'text-[#F48120] font-semibold' : ''}>Rápido</span>
                                    <span className={stepMax > 2 && stepMax <= 5 ? 'text-[#F48120] font-semibold' : ''}>Equilibrado</span>
                                    <span className={stepMax > 5 && stepMax <= 8 ? 'text-[#F48120] font-semibold' : ''}>Profundo</span>
                                    <span className={stepMax > 8 ? 'text-[#F48120] font-semibold' : ''}>Experto</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setStepMax(1)}
                                    className={`group relative overflow-hidden p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                      ${stepMax === 1 ? 
                                        'bg-gradient-to-br from-[#F48120]/20 to-orange-400/20 border-2 border-[#F48120]/50 shadow-lg shadow-[#F48120]/20' : 
                                        'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-[#F48120]/30 hover:shadow-md'}`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex flex-col items-center gap-2">
                                      <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🎯</span>
                                      <div className="text-center">
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Básico</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Nivel 1</div>
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setStepMax(3)}
                                    className={`group relative overflow-hidden p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                      ${stepMax > 1 && stepMax <= 3 ? 
                                        'bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/50 shadow-lg shadow-blue-500/20' : 
                                        'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-blue-500/30 hover:shadow-md'}`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex flex-col items-center gap-2">
                                      <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🧠</span>
                                      <div className="text-center">
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Equilibrado</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Nivel 2-3</div>
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setStepMax(7)}
                                    className={`group relative overflow-hidden p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                      ${stepMax > 3 && stepMax <= 7 ? 
                                        'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20' : 
                                        'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-purple-500/30 hover:shadow-md'}`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex flex-col items-center gap-2">
                                      <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🚀</span>
                                      <div className="text-center">
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Avanzado</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Nivel 4-7</div>
                                      </div>
                                    </div>
                                  </button>

                                  <button
                                    onClick={() => setStepMax(10)}
                                    className={`group relative overflow-hidden p-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]
                                      ${stepMax > 7 ? 
                                        'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20' : 
                                        'bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-emerald-500/30 hover:shadow-md'}`}
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex flex-col items-center gap-2">
                                      <span className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🤖</span>
                                      <div className="text-center">
                                        <div className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Experto</div>
                                        <div className="text-xs text-neutral-500 dark:text-neutral-400">Nivel 8-10</div>
                                      </div>
                                    </div>
                                  </button>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gradient-to-r from-neutral-200/30 via-[#F48120]/20 to-neutral-200/30 dark:from-neutral-700/30 dark:via-[#F48120]/20 dark:to-neutral-700/30">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 animate-pulse"></div>
                                      <span className="text-sm font-semibold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Ajuste Fino</span>
                                    </div>
                                    <div className="px-3 py-1.5 bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/20 dark:to-purple-500/20 rounded-full border border-[#F48120]/20 dark:border-[#F48120]/30">
                                      <span className="text-sm font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">{stepMax}/10</span>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-3">
                                    <button
                                      onClick={() => {
                                        if (!isUpdatingStepMax && stepMax > 1) {
                                          setIsUpdatingStepMax(true);
                                          setStepMax(stepMax - 1);
                                          setTimeout(() => setIsUpdatingStepMax(false), 150);
                                        }
                                      }}
                                      disabled={isUpdatingStepMax || stepMax <= 1}
                                      className="group relative w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden
                                        bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700
                                        hover:from-red-50 hover:to-red-100 dark:hover:from-red-900/20 dark:hover:to-red-800/20
                                        disabled:opacity-40 disabled:pointer-events-none
                                        border border-neutral-200 dark:border-neutral-600 hover:border-red-300 dark:hover:border-red-600
                                        transition-all duration-300 transform hover:scale-110 active:scale-95
                                        shadow-sm hover:shadow-md"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <Minus size={18} className="relative z-10 text-red-500 group-hover:text-red-600 transition-colors duration-300" weight="bold" />
                                    </button>

                                    <div className="relative flex-1 h-12 flex items-center">
                                      <div className="absolute inset-0 bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-100 dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-600"></div>
                                      <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={stepMax}
                                        onChange={(e) => {
                                          const value = parseInt(e.target.value);
                                          if (!isUpdatingStepMax) {
                                            setIsUpdatingStepMax(true);
                                            setStepMax(value);
                                            setTimeout(() => setIsUpdatingStepMax(false), 150);
                                          }
                                        }}
                                        className="relative z-10 w-full h-full bg-transparent appearance-none cursor-pointer
                                          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 
                                          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br 
                                          [&::-webkit-slider-thumb]:from-[#F48120] [&::-webkit-slider-thumb]:to-purple-500 
                                          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white 
                                          [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                                          [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-300
                                          [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110"
                                      />
                                      <div className="absolute top-1/2 left-2 right-2 h-2 -translate-y-1/2 bg-gradient-to-r from-[#F48120] via-orange-400 to-purple-500 rounded-full shadow-inner transition-all duration-500"
                                        style={{ 
                                          width: `calc(${(stepMax / 10) * 100}% - 1rem)`,
                                          marginLeft: '0.5rem'
                                        }}
                                      ></div>
                                      <div className="absolute top-1/2 left-2 right-2 -translate-y-1/2 flex justify-between pointer-events-none">
                                        {Array.from({ length: 10 }, (_, i) => (
                                          <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${
                                            i + 1 <= stepMax ? 'bg-white shadow-sm' : 'bg-neutral-300 dark:bg-neutral-600'
                                          }`}></div>
                                        ))}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => {
                                        if (!isUpdatingStepMax && stepMax < 10) {
                                          setIsUpdatingStepMax(true);
                                          setStepMax(stepMax + 1);
                                          setTimeout(() => setIsUpdatingStepMax(false), 150);
                                        }
                                      }}
                                      disabled={isUpdatingStepMax || stepMax >= 10}
                                      className="group relative w-10 h-10 flex items-center justify-center rounded-xl overflow-hidden
                                        bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700
                                        hover:from-green-50 hover:to-green-100 dark:hover:from-green-900/20 dark:hover:to-green-800/20
                                        disabled:opacity-40 disabled:pointer-events-none
                                        border border-neutral-200 dark:border-neutral-600 hover:border-green-300 dark:hover:border-green-600
                                        transition-all duration-300 transform hover:scale-110 active:scale-95
                                        shadow-sm hover:shadow-md"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <Plus size={18} className="relative z-10 text-green-500 group-hover:text-green-600 transition-colors duration-300" weight="bold" />
                                    </button>
                                  </div>
                                  
                                  <div className="mt-3 flex justify-between items-center text-xs">
                                    <div className="flex items-center gap-1">
                                      <div className="w-2 h-2 rounded-full bg-[#F48120]"></div>
                                      <span className="text-neutral-600 dark:text-neutral-400 font-medium">Velocidad</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <span className="text-neutral-600 dark:text-neutral-400 font-medium">Precisión</span>
                                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            , document.body)}
                        </div>

                      </div>
                    )}
                  </div>

                </div> 
                {/* 

              <Tooltip content="Crear Agente">
                <Button
                  variant="ghost"
                  size="md"
                  shape="square"
                  className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                  onClick={() => setShowAgent(true)}
                >
                  <Robot size={20} weight="duotone" />
                </Button>
              </Tooltip> */}
                {/* <Tooltip content={isToolbarExpanded ? "Minimizar barra de herramientas" : "Expandir barra de herramientas"}>
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                    onClick={() => setIsToolbarExpanded(!isToolbarExpanded)}
                  >
                    {isToolbarExpanded ? (
                      <CaretLeft size={20} weight="duotone" />
                    ) : (
                      <CaretRight size={20} weight="duotone" />
                    )}
                  </Button>
                </Tooltip>
              </div> */}

                {/* Botón de Limpiar Historial */}
                {/* <div className={`transition-all duration-300 opacity-100 max-w-full`}>
                <Tooltip content="Limpiar historial">
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9 hover:bg-red-100/10 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors duration-200"
                    onClick={() => setShowClearDialog(true)}
                  >
                    <Trash size={20} weight="duotone" />
                  </Button>
                </Tooltip>
              </div> */}
              </div>
            </div>

            {systemPrompt && (
              <div className="mb-2 items-center justify-between ml-2 mr-2">
                {/* <div className="flex-1"> */}
                <div className="flex">
                  <h2 className="mt-11.5 text-lg font-medium text-neutral-800 dark:text-neutral-200">
                    <span className="text-[#F48120] mr-2 ml-1 flex mt-0.5">Sistema <Robot className="mr-1 ml-2 mt-1.5" /></span>
                  </h2>
                  <InputSystemPrompt
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu consulta del sistema (Optional)"
                    className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10 transition-all duration-300 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/30"
                  />
                </div>
                {/* </div> */}
              </div>
            )}

            <div className="relative p-3 lg:p-4 max-h-[calc(100vh-1rem)] bg-gradient-to-t from-white/95 via-white/90 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-transparent backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-700/50">
              {/* Decorative top border */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-[#F48120] to-purple-500 rounded-full opacity-60"></div>

              <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-3 lg:gap-4">
                {/* Expand/Collapse Button */}
                <div className="flex justify-center lg:justify-start">
                  <Tooltip content={systemPrompt ? "Minimizar" : "Expandir"}>
                    <Button
                      variant="ghost"
                      size="md"
                      shape="square"
                      className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-800 dark:to-neutral-700 border border-neutral-200/50 dark:border-neutral-600/50 hover:border-[#F48120]/30 dark:hover:border-[#F48120]/30 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden"
                      onClick={() => setSystemPrompt(!systemPrompt)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {systemPrompt ? (
                        <CaretCircleDown size={22} className="relative z-10 text-[#F48120] group-hover:text-orange-500 transition-colors duration-300" weight="duotone" />
                      ) : (
                        <CaretCircleDoubleUp size={22} className="relative z-10 text-[#F48120] group-hover:text-orange-500 transition-colors duration-300" weight="duotone" />
                      )}
                    </Button>
                  </Tooltip>
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const updateConfigs = async () => {
                      try {
                        await fetch('/api/assistant', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({ maxStepsTemp: stepMax, prompt: inputText, modelTemp: selectedModel }),
                        });
                        handleAgentSubmit(e);
                      } catch (error) {
                        console.error('Error al actualizar configuraciones:', error);
                      }
                    };
                    updateConfigs();
                  }}
                  className="flex-1 min-w-0"
                >
                  <div className="relative group">
                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500"></div>

                    <div className="relative flex items-center gap-3 p-3 lg:p-4 bg-gradient-to-r from-white via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 group-hover:border-[#F48120]/30 dark:group-hover:border-[#F48120]/30 group-focus-within:border-[#F48120]/50 dark:group-focus-within:border-[#F48120]/50 shadow-lg group-hover:shadow-xl group-focus-within:shadow-xl transition-all duration-300">
                      {/* Background pattern */}
                      <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                      {/* Input field */}
                      <div className="flex-1 relative z-10">
                        <Input
                          disabled={pendingToolCallConfirmation}
                          placeholder={
                            pendingToolCallConfirmation
                              ? "Por favor responde a la confirmación de herramienta arriba..."
                              : "✨ Escribe tu consulta aquí..."
                          }
                          className="w-full bg-transparent border-0 focus:ring-0 text-base lg:text-lg placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium"
                          value={agentInput}
                          onChange={handleAgentInputChange}
                          onValueChange={undefined}
                        />
                      </div>

                      {/* Send button */}
                      <div className="relative z-10">
                        <Button
                          type="submit"
                          shape="square"
                          className="relative w-12 h-12 lg:w-14 lg:h-14 rounded-xl bg-gradient-to-br from-[#F48120] to-purple-500 hover:from-orange-500 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group overflow-hidden"
                          disabled={pendingToolCallConfirmation || !agentInput.trim()}
                          onClick={() => {
                            try {
                              if (!user) {
                                setIsLoginOpen(true);
                                return;
                              }
                            } catch (error) {
                              console.error('Error al procesar la solicitud:', error);
                            }
                          }}
                        >
                          {/* Button glow effect */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                          <PaperPlaneRight size={20} className="relative z-10 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" weight="bold" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </main>
        <AISettingsPanel
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
        <AuthPopup />
        <ClearHistoryDialog
          isOpen={showClearDialog}
          onClose={() => setShowClearDialog(false)}
          onConfirm={clearHistory}
        />

        {
          showAgentInterface && (
            <ModernAgentInterface
              isOpen={showAgentInterface}
              onClose={() => setShowAgentInterface(false)}
            />
          )
        }
      </div >
    </ChatProvider >
  );
}

export default function Chat() {
  return (
    <AIConfigProvider>
      <ModelProvider>
        <ChatComponent />
      </ModelProvider>
    </AIConfigProvider>
  );
}

// const hasOpenAiKeyPromise = fetch("/check-open-ai-key").then((res) =>
//   res.json<{ success: boolean }>()
// );

function HasOpenAIKey() {
  // const hasOpenAiKey = use(hasOpenAiKeyPromise);

  // if (!hasOpenAiKey.success) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 backdrop-blur-sm">
      <div className="max-w-3xl mx-auto p-4">
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg border border-red-200 dark:border-red-900 p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-labelledby="warningIcon"
              >
                <title id="warningIcon">Warning Icon</title>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                OpenAI API Key Not Configured
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-1">
                Requests to the API, including from the frontend UI, will not
                work until an OpenAI API key is configured.
              </p>
              <p className="text-neutral-600 dark:text-neutral-300">
                Please configure an OpenAI API key by setting a{" "}
                <a
                  href="https://developers.cloudflare.com/workers/configuration/secrets/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400"
                >
                  secret
                </a>{" "}
                named{" "}
                <code className="bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-mono text-sm">
                  OPENAI_API_KEY
                </code>
                . <br />
                You can also use a different model provider by following these{" "}
                <a
                  href="https://github.com/cloudflare/agents-starter?tab=readme-ov-file#use-a-different-ai-model-provider"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400"
                >
                  instructions.
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  // }
  return null;
}
