import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { APPROVAL } from "./shared";
import type { tools } from "./tools";
import { AIConfigProvider, useAIConfig } from "@/contexts/AIConfigContext";
import { ModelProvider, useModel } from "@/contexts/ModelContext";
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
  Stop
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

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  "getWeatherInformation",
];

function ChatComponent() {
  const { config } = useAIConfig();
  const { selectedModel } = useModel();
  const [showOIAICreator, setShowOIAICreator] = useOIAIState(false);

  const handleOIAICopy = (content: string) => {
    setInputText(content);
    setShowOIAICreator(false);
  };
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  const syncSystemPrompt = async () => {
    try {
      const response = await fetch('/api/system-prompt');
      const data = await response.json() as SystemPromptResponse;
      setInputText(data.prompt);
    } catch (error) {
      console.error('Error al obtener el prompt del sistema:', error);
    }
  };

  // Sincronizar el prompt del sistema al montar el componente
  useEffect(() => {
    syncSystemPrompt();
  }, []);

  // Función para actualizar el prompt del sistema en el servidor
  const updateSystemPrompt = async (newPrompt: string) => {
    try {
      await fetch('/api/system-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: newPrompt }),
      });
    } catch (error) {
      console.error('Error al actualizar el prompt del sistema:', error);
    }
  };
  const [showTextModal, setShowTextModal] = useState(false);
  const [showAgent, setShowAgent] = useState(false);
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

  const agent = useAgent({
    agent: "chat",
    config: {
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      topK: config.topK,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      seed: config.seed,
      stream: config.stream,
    },
    // stream: config.stream,
    // onStreamEnd: () => {
    //   scrollToBottom();
    //   console.log('Stream finalizado');
    // }
  });
  console.log('Configuración:', config);

  const {
    messages: agentMessages,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory,
    isLoading,
    stop
  } = useAgentChat({
    agent,
    maxSteps: 5,
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
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleChatWidth = (event: CustomEvent<{ width: 'narrow' | 'default' | 'full' }>) => {
      setChatWidth(event.detail.width);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && settingsButtonRef.current &&
        !settingsMenuRef.current.contains(event.target as Node) &&
        !settingsButtonRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    window.addEventListener('toggleChatWidth', handleChatWidth as EventListener);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('toggleChatWidth', handleChatWidth as EventListener);
      document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onThemeChange={toggleTheme}
        onPromptSelect={(prompt) => handleAgentInputChange({ target: { value: prompt } } as any)}
      />
      <main className="flex-1 w-full px-4 py-4 relative">
        {/* Botón flotante de configuración */}
        <div className="fixed left-4 top-1/2 -translate-y-1/2 z-10">
          <div className="relative flex flex-col gap-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150">
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
              <Wrench size={20} className="text-[#F48120]" weight="duotone" />
            </Button>

            <Button
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
            </Button>

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
                className="fixed z-50 min-w-[200px] bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150"
                style={{
                  left: settingsButtonRef.current?.getBoundingClientRect().right ?? 0 + 8,
                  top: settingsButtonRef.current?.getBoundingClientRect().top ?? 0
                }}
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

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-16 max-h-[calc(100vh-1rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                                    className={`p-3 rounded-md bg-neutral-100 dark:bg-neutral-900 ${isUser
                                      ? "rounded-br-none"
                                      : "rounded-bl-none border-assistant-border"
                                      } ${part.text.startsWith("scheduled message")
                                        ? "border-accent/50"
                                        : ""
                                      } relative ${textSize === 'small' ? 'text-sm' : textSize === 'large' ? 'text-lg' : 'text-base'}`}
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

          <div className={`${systemPrompt ? 'hidden' : ''} pl-4 pr-10 rounded-full mb-0 border-b border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm transition-all duration-300 w-58 ml-2 mr-2`}>
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

              <div className={`flex-1 flex transition-all duration-300 opacity-100 max-w-full`}>
                <ModelSelect />
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
              <div className={`transition-all duration-300 opacity-100 max-w-full`}>
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
              </div>
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

          <div className="flex p-2 max-h-[calc(100vh-1rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Tooltip content={systemPrompt ? "Minimizar" : "Expandir"}>
              <Button
                variant="ghost"
                size="md"
                shape="square"
                className="mb-1 mr-1 pt-1"
                onClick={() => setSystemPrompt(!systemPrompt)}
              >
                {systemPrompt ? (
                  <CaretCircleDown size={20} className="text-[#F48120]" weight="duotone" />
                ) : (
                  <CaretCircleDoubleUp size={20} className="text-[#F48120]" weight="duotone" />
                )}
              </Button>
            </Tooltip>

            {/* Input Area */}
            <form
              onSubmit={(e) =>{
                e.preventDefault();
                handleAgentSubmit(e);}
                // handleAgentSubmit(e, {
                //   data: {
                //     annotations: {
                //       hello: "world",
                //     },
                //   },
                // })
              }
              className="ml-9 p-2 bg-input-background absolute bottom-0 left-0 right-0 z-10 border-neutral-300 dark:border-neutral-800"
            >
              {/* <div className={`transition-all duration-300 ${!systemPrompt ? 'opacity-100 max-w-full' : 'opacity-0 overflow-hidden'}`}>
              <h2 className='text-lg font-medium text-neutral-800 dark:text-neutral-200'>
                <span className="text-[#F48120] mr-2 ml-1">💡Escribe Tu Consulta</span>
              </h2>
            </div> */}
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <div className="flex">
                    {/* <p className="mt-2">
                    <span className="text-[#F48120] mr-2 ml-1 ">Usuario</span>
                  </p> */}
                    {/* Action Buttons Frame */}
                    <Input
                      disabled={pendingToolCallConfirmation}
                      placeholder={
                        pendingToolCallConfirmation
                          ? "Please respond to the tool confirmation above..."
                          : "Empieza a escribir tu consulta..."
                      }
                      className="pl-4 pr-10 py-2 w-full rounded-full"
                      value={agentInput}
                      onChange={handleAgentInputChange}
                      onValueChange={undefined}
                    />
                  </div>
                </div>

                <div className="relative">
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="inline-flex items-center justify-center p-2.5 text-red-500 hover:text-white bg-white/95 dark:bg-gray-800/95 hover:bg-gradient-to-br hover:from-red-500 hover:to-rose-600 rounded-full border-2 border-red-200/50 dark:border-red-700/30 shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-all duration-300 transform hover:scale-105 active:scale-95"
                      aria-label="Detener generación"
                    >
                      <Stop size={18} weight="bold" />
                    </button>
                  ) : (
                    <Button
                      type="submit"
                      shape="square"
                      className="inline-flex items-center justify-center p-2.5 text-[#F48120] hover:text-white bg-white/95 dark:bg-gray-800/95 hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full border-2 border-[#F48120]/20 dark:border-[#F48120]/10 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/95 dark:disabled:hover:bg-gray-800/95 disabled:hover:text-[#F48120] disabled:hover:scale-100"
                      disabled={pendingToolCallConfirmation || !agentInput.trim()}
                      onClick={async (e) => {
                        try {
                          updateSystemPrompt(inputText),
                            // Actualizar el modelo y el prompt del sistema en el servidor antes de enviar el mensaje
                            await Promise.all([
                              fetch('/api/model', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ model: selectedModel }),
                              })
                            ]);

                          // Proceder con el envío del mensaje
                          if (!user) {
                            setIsLoginOpen(true);
                            return;
                          } else {
                            // e.preventDefault();
                            // handleAgentSubmit(e);
                          }
                        } catch (error) {
                          console.error('Error al actualizar el modelo:', error);
                        }
                      }}
                    >
                      <PaperPlaneRight size={18} weight="bold" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
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

      {showAgentInterface && (
        <ModernAgentInterface
          isOpen={showAgentInterface}
          onClose={() => setShowAgentInterface(false)}
        />
      )}
    </div>
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

const hasOpenAiKeyPromise = fetch("/check-open-ai-key").then((res) =>
  res.json<{ success: boolean }>()
);

function HasOpenAIKey() {
  const hasOpenAiKey = use(hasOpenAiKeyPromise);

  if (!hasOpenAiKey.success) {
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
  }
  return null;
}
