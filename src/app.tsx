import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { APPROVAL } from "./shared";
import { transformAPIMessagesToAgentMessages } from "@/utils/messageUtils";
import { useChat } from "@/contexts/ChatContext";
import type { tools } from "./tools";
import { AIConfigProvider, useAIConfig } from "@/contexts/AIConfigContext";
import { ModelProvider, useModel } from "@/contexts/ModelContext";
import { ChatProvider } from "@/contexts/ChatContext";
import "@/styles/markdown.css";
import { ModelSelect } from "@/components/model/ModelSelect";
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
  DotsThreeVertical,
  BookmarkSimple,
  BookmarksSimple,
  Paperclip,
  CaretDown,
  CaretUp
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
import { GeminiConfigModal } from "./components/modal/GeminiConfigModal";
import { ListHeart } from "@phosphor-icons/react/dist/ssr";
import type { ChatMessage, FormattedChatMessage, APIResponse } from "./types/api";
import Header from "./components/header/Header";

interface ChatResponse {
  id: string;
  title: string;
  createdAt: string;
  lastMessageAt: string;
}

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
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  const { selectChat, currentChat, updateChat, chats } = useChat();

  // Auto-select the first chat when chats are loaded
  useEffect(() => {
    const autoSelectChat = async () => {
      if (chats.length > 0 && !selectedChatId) {
        try {
          // Get the first chat from the list
          const firstChat = chats[0];

          if (firstChat) {
            console.log('Auto-selecting first chat:', firstChat.id);

            // Update selected chat state
            setSelectedChatId(firstChat.id);

            // If chat already has messages, update state directly
            if (firstChat.messages && firstChat.messages.length > 0) {
              setCurrentMessages(firstChat.messages);

              // Update chat in context
              if (updateChat) {
                updateChat(firstChat.id, {
                  ...firstChat,
                  messages: firstChat.messages
                });
              }
            } else {
              // If no messages, try to load them
              await handleChatSelect(firstChat.id);
            }

            // Notify context that a chat has been selected
            if (selectChat) {
              selectChat(firstChat.id);
            }
          }
        } catch (error) {
          console.error('Error auto-selecting chat:', error);
        }
      }
    };

    autoSelectChat();
  }, [chats, selectedChatId]);

  const handleChatSelect = async (chatId: string) => {
    try {
      console.log('handleChatSelect called with chatId:', chatId);
      setIsLoadingChat(true);

      // Clear any existing messages
      clearHistory();
      setCurrentMessages([]);

      // Select the chat in the context
      console.log('Selecting chat in context...');
      selectChat(chatId);
      setSelectedChatId(chatId);

      // Fetch the messages for the selected chat
      console.log('Fetching messages for chat:', chatId);
      const response = await fetch(`/api/chats/${chatId}/messages`);

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.status}`);
      }

      // Define the expected API response type
      interface ChatMessagesResponse {
        success: boolean;
        messages?: Array<{
          id: string;
          chatId: string;  // Required by APIMessage type
          role: 'user' | 'assistant' | 'system' | 'data';
          content: any;
          createdAt: string | Date;
          // Add other properties that might be present in the response
          [key: string]: any;
        }>;
      }

      const data = await response.json() as ChatMessagesResponse;
      console.log('API Response:', data);

      if (!data?.success || !Array.isArray(data.messages)) {
        throw new Error('Invalid response format');
      }

      console.log('Raw messages from API:', data.messages);

      // Transform API messages to the format expected by the agent
      const loadedMessages = transformAPIMessagesToAgentMessages(data.messages);
      console.log('Transformed messages:', loadedMessages);

      // Filter to only include user and assistant messages
      const filteredMessages = loadedMessages.filter(msg =>
        msg.role === 'user' || msg.role === 'assistant'
      );

      console.log('Filtered messages:', filteredMessages);

      // Format messages for the chat context
      const chatMessages = filteredMessages.map(msg => ({
        id: msg.id || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        parts: Array.isArray(msg.parts) && msg.parts.length > 0
          ? msg.parts
          : [{ type: 'text', text: msg.content }],
        createdAt: msg.createdAt || new Date()
      }));

      console.log('Formatted chat messages:', chatMessages);

      // Update the chat in the context with the loaded messages
      const lastMessageDate = chatMessages.length > 0
        ? chatMessages[chatMessages.length - 1].createdAt
        : new Date();

      const updatedChat = {
        id: chatId,
        title: currentChat?.title || `Chat ${new Date().toLocaleString()}`,
        messages: chatMessages,
        lastMessageAt: lastMessageDate,
        createdAt: currentChat?.createdAt || new Date()
      };

      console.log('Updating chat in context with messages:', chatMessages.length);
      updateChat(chatId, updatedChat);

      // Update agent's message history using setMessages
      if (chatMessages.length > 0) {
        console.log('Setting agent messages...');
        try {
          // First clear any existing messages
          if (clearHistory) {
            clearHistory();
          }

          // Then set the new messages
          const formattedMessages = chatMessages.map(msg => {
            // Ensure parts is properly typed
            const parts = msg.parts || [];
            const messageParts = parts.length > 0
              ? parts
              : [{ type: 'text' as const, text: msg.content }];

            return {
              id: msg.id,
              role: msg.role,
              content: msg.content,
              parts: messageParts,
              // Add createdAt with current date if not present
              createdAt: 'createdAt' in msg && msg.createdAt
                ? new Date(msg.createdAt)
                : new Date()
            };
          });

          console.log('Formatted messages for setMessages:', formattedMessages);

          // Update agent's messages
          setMessages(formattedMessages as Message[]);

          // Update UI state
          setCurrentMessages(formattedMessages);

          console.log('Agent messages set successfully');

          // Scroll to bottom after a small delay to ensure DOM is updated
          setTimeout(() => {
            scrollToBottom();
          }, 100);
        } catch (error) {
          console.error('Error setting agent messages:', error);
        }
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      // You might want to show an error toast to the user here
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleNewChat = () => {
    // Clear the agent's message history
    clearHistory();

    // Reset local state
    setCurrentMessages([]);
    setSelectedChatId(null);

    // Optionally clear the current chat in the context
    if (currentChat) {
      updateChat(currentChat.id, {
        ...currentChat,
        messages: []
      });
    }
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
  const [savedQueries, setSavedQueries] = useState<string[]>([]);
  const [showSavedQueries, setShowSavedQueries] = useState(false);
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
  const { user, setIsLoginOpen } = useAuth();

  // Refs for scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom function with smooth scrolling
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
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

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  interface AgentInstance {
    setConfig: (config: any) => void;
    chat?: (options: {
      messages: Array<{
        role: 'user' | 'assistant' | 'system' | 'data';
        content: string;
        parts?: Array<{
          type: string;
          text?: string;
          [key: string]: any;
        }>;
      }>;
    }) => Promise<void>;
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
    clearHistory,
    setMessages,
    // isLoading,
    // stop
  } = useAgentChat({
    agent,
    maxSteps: stepMax,
  });


  // Scroll to bottom on mount and when messages change
  useEffect(() => {
    if (agentMessages.length > 0) {
      // Use 'auto' for initial load to prevent janky animation
      const behavior = document.visibilityState === 'visible' ? 'smooth' : 'auto';
      scrollToBottom(behavior);
    }
  }, [agentMessages, scrollToBottom]);

  // Handle auto-scrolling when new messages arrive
  useEffect(() => {
    if (agentMessages.length > 0) {
      // Use 'auto' for initial load to prevent janky animation
      const behavior = document.visibilityState === 'visible' ? 'smooth' : 'auto';
      scrollToBottom(behavior);
    }
    const container = messagesContainerRef.current;
    if (!container) return;

    const isScrolledToBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 50;

    if (isScrolledToBottom) {
      scrollToBottom('smooth');
    }
  }, [agentMessages, scrollToBottom]);

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
      <main className="flex-1 w-full px-4 pb-4 relative">
        {/* Botón flotante de configuración */}

        {/* Desktop Sidebar */}
        {/* <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-10 transition-all duration-300 ease-in-out group
                      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                      ${isAutoHidden ? 'lg:-translate-x-full' : ''}
                      hover:translate-x-0`}> */}
        {/* Hover indicator */}
        {/* <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full 
                          w-1.5 h-20 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-r-lg
                          opacity-0 group-hover:opacity-100 transition-opacity duration-300
                          lg:opacity-100 pointer-events-none"></div>
          <div className="relative flex flex-col gap-2 p-2 bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150"> */}
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
              </Button>

              <Tooltip content="Configurar Gemini API">
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

        {/* <div
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
                  <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover:item:scale-125 transition-transform duration-300"></div>
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">Reducido</span>
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
                  <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover:item:scale-125 transition-transform duration-300"></div>
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">Normal</span>
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
                  <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover:item:scale-125 transition-transform duration-300"></div>
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">Completo</span>
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
                    <span className="text-xs font-bold group-hover:item:text-[#F48120] transition-colors duration-300">A</span>
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
                    <span className="text-sm font-bold group-hover:item:text-[#F48120] transition-colors duration-300">A</span>
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
                    <span className="text-base font-bold group-hover:item:text-[#F48120] transition-colors duration-300">A</span>
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
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">
                    {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                  </span>
                </button>
              </div>
            </div> */}
        {/* </div>
        </div> */}
        {showSettingsMenu && createPortal(
          <div
            ref={settingsMenuRef}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSettingsMenu(false);
              }
            }}
          >
            <div
              className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden
                             border border-neutral-200/50 dark:border-neutral-700/50 animate-fade-in-up"
            >
              <div className="absolute right-3 top-3">
                <button
                  onClick={() => setShowSettingsMenu(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Cerrar configuración"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
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
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">Normal</span>
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
                  <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover:item:scale-125 transition-transform duration-300"></div>
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">Completo</span>
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
                  <span className="font-medium group-hover:item:text-[#F48120] transition-colors duration-300">
                    {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                  </span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
        <div className={`h-[calc(100vh-2rem)] w-full ${getMainWidth()} mx-auto flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800 transition-all duration-300`}>
          {/* Header Component */}
          <div className="sticky top-0 z-60 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
            <Header
              isSidebarOpen={isSidebarOpen}
              setIsSidebarOpen={setIsSidebarOpen}
              isSettingsOpen={isSettingsOpen}
              stepMax={stepMax}
              setStepMax={setStepMax}
              setShowSettingsMenu={setShowSettingsMenu}
              setShowOIAICreator={setShowOIAICreator}
              setShowClearDialog={setShowClearDialog}
              setIsSettingsOpen={setIsSettingsOpen}
              onOpenSideMenu={() => setIsSideMenuOpen(true)}
            />
          </div>

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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center">
              <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[85vh] overflow-hidden relative transform transition-all duration-300 scale-100 opacity-100">                      <OIAICreator
                onCopyContent={handleOIAICopy}
                onClose={() => setShowOIAICreator(false)}
              />
              </div>
            </div>
          )}

          <div
            ref={messagesContainerRef}
            className={`flex-1 overflow-y-auto p-4 space-y-4 ${agentMessages.length === 0 ? 'flex flex-col justify-center items-center min-h-[calc(100vh-15rem)]' : 'pb-24'} max-h-[calc(100vh-5rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden mt-0`}
          >
            {agentMessages.length === 0 && (

              <div className="flex flex-row items-stretch gap-3 p-3 w-full">

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
                          body: JSON.stringify({ maxStepsTemp: stepMax, prompt: inputText, modelTemp: selectedModel, selectedChatId: selectedChatId }),
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
                  <div className="relative group max-w-4xl mx-auto w-full">
                    <div className="relative bg-gradient-to-r from-white via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 group-hover:border-[#F48120]/30 dark:group-hover:border-[#F48120]/30 group-focus-within:border-[#F48120]/50 dark:group-focus-within:border-[#F48120]/50 shadow-lg group-hover:shadow-xl group-focus-within:shadow-xl transition-all duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                      {/* Input field */}
                      <div className="relative z-10 p-3">
                        <div className="relative">
                          <Input
                            disabled={pendingToolCallConfirmation}
                            placeholder={pendingToolCallConfirmation
                              ? "Por favor responde a la confirmación de herramienta arriba..."
                              : "✨ Escribe tu consulta aquí..."}
                            className="w-full bg-transparent border-0 focus:ring-0 text-base lg:text-lg placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium px-2"
                            value={agentInput}
                            onChange={handleAgentInputChange}
                            onValueChange={undefined}
                            onClick={() => { setSystemPrompt(false); }}
                          />
                          <div className="absolute top-26 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-[#F48120] to-purple-500 rounded-full opacity-60"></div>
                        </div>
                      </div>

                      {/* Buttons row below input */}
                      <div className="relative z-10 flex items-center justify-between px-3 pb-3 pt-1">
                        <div className="flex items-center gap-2">
                          {/* Attachment button */}
                          <Tooltip content="Adjuntar archivo">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              shape="square"
                              className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 border border-neutral-200/50 dark:border-neutral-600/50 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 shadow-sm hover:shadow transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                // TODO: Add file attachment logic here
                              }}
                            >
                              <Paperclip size={16} className="relative z-10 text-neutral-500 group-hover:text-[#F48120] dark:group-hover:text-[#F48120] transition-colors duration-300" weight="bold" />
                            </Button>
                          </Tooltip>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Model Select */}
                          <div className="w-40">
                            <ModelSelect mobile={true} />
                          </div>

                          {/* Send button */}
                          <button
                            type="submit"
                            disabled={pendingToolCallConfirmation || !agentInput.trim()}
                            onClick={async (e) => {
                              try {
                                if (!user) {
                                  e.preventDefault();
                                  setIsLoginOpen(true);
                                  return;
                                }

                                // If there's no current chat, create a new one before submitting
                                if (!currentChat) {
                                  e.preventDefault();
                                  const response = await fetch('/api/chats', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                      title: agentInput.substring(0, 30) || 'Nuevo Chat',
                                    }),
                                  });

                                  if (response.ok) {
                                    const newChat = await response.json() as ChatResponse;
                                    selectChat(newChat.id);
                                    setSelectedChatId(newChat.id);

                                    // Submit the form after creating the chat
                                    const form = e.currentTarget.closest('form');
                                    if (form) {
                                      form.requestSubmit();
                                    }
                                  }
                                }

                              } catch (error) {
                                console.error('Error al procesar la solicitud:', error);
                              }
                            }}
                            className={`relative w-12 h-12 rounded-full p-0 flex items-center justify-center 
                              bg-gradient-to-br from-[#F48120] to-purple-500 
                              hover:from-[#ff8f2d] hover:to-purple-600
                              active:from-[#e6731a] active:to-purple-700
                              shadow-lg hover:shadow-xl 
                              transition-all duration-300 
                              transform hover:scale-110 active:scale-95 
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                              group overflow-hidden
                              ${pendingToolCallConfirmation ? 'animate-pulse' : ''}`}
                          >
                            {/* Animated background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 rounded-full"></div>

                            {/* Main icon container */}
                            <div className={`relative z-10 w-6 h-6 flex items-center justify-center transition-all duration-300 transform 
                              ${!pendingToolCallConfirmation ? 'group-hover:scale-110' : 'animate-spin'}`}>

                              {/* Icon with animation */}
                              {pendingToolCallConfirmation ? (
                                <div className="relative w-6 h-6">
                                  {/* Outer rotating circle */}
                                  <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-l-white/80 border-b-white/80 animate-spin"></div>

                                  {/* Pulsing dot */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>

                                  {/* Inner gradient circle */}
                                  <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/60 animate-pulse"></div>

                                  {/* Center dot */}
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/80 rounded-full"></div>
                                </div>
                              ) : (
                                <PaperPlaneRight
                                  size={20}
                                  weight="fill"
                                  className="text-white transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:-translate-y-1"
                                />
                              )}
                            </div>

                            {/* Ripple effect on click */}
                            <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-40 group-active:bg-white transition-opacity duration-500"></div>

                            {/* Subtle pulse effect */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/20 transition-all duration-500"></div>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      {/* Mobile toggle button */}
                      <div className="w-full text-center mt-21 md:hidden absolute -top-19 z-20">
                        <Tooltip content={systemPrompt ? "Minimizar" : "Maximizar"}>
                          <Button
                            variant="ghost"
                            size="lg"
                            shape="circular"
                            className={`ml-4 relative w-16 h-16 rounded-full border-2 border-[#F48120]/20 dark:border-[#F48120]/20 bg-white dark:bg-neutral-800 hover:bg-white dark:hover:bg-neutral-800 shadow-sm transition-all duration-300 ease-out transform active:scale-95 overflow-hidden ${systemPrompt ? 'rotate-0' : '-rotate-180'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSystemPrompt(!systemPrompt);
                            }}
                          >
                            <div className={`transition-transform duration-500 ease-spring ${systemPrompt ? 'rotate-0 translate-y-0' : 'rotate-180 -translate-y-0.5'}`}>
                              {systemPrompt ? (
                                <CaretCircleDown
                                  size={44}
                                  className="relative z-10 text-[#F48120] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 animate-bounce"
                                  weight="duotone"
                                />
                              ) : (
                                <CaretCircleDoubleUp
                                  size={44}
                                  className="mr-4 relative z-10 text-[#F48120] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 animate-pulse"
                                  weight="duotone"
                                />
                              )}
                            </div>
                          </Button>
                        </Tooltip>
                      </div>

                      {/* Desktop toggle button */}
                      <div className="hidden md:flex justify-center w-full absolute mt-21 -top-19 z-20">
                        <Tooltip content={systemPrompt ? "Minimizar" : "Maximizar"}>
                          <Button
                            variant="ghost"
                            size="lg"
                            shape="circular"
                            className={`ml-4 relative w-16 h-16 rounded-full border-2 border-[#F48120]/20 dark:border-[#F48120]/20 bg-white dark:bg-neutral-800 shadow-sm transition-transform duration-300 ease-out transform active:scale-95 overflow-hidden hover:!bg-transparent dark:hover:!bg-transparent ${systemPrompt ? 'rotate-0' : '-rotate-180'}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSystemPrompt(!systemPrompt);
                            }}
                          >
                            <div className={`transition-transform duration-500 ease-spring ${systemPrompt ? 'rotate-0 translate-y-0' : 'rotate-180 -translate-y-0.5'}`}>
                              {systemPrompt ? (
                                <CaretCircleDown
                                  size={44}
                                  className="relative z-10 text-[#F48120] transition-colors duration-300 animate-bounce"
                                  weight="duotone"
                                />
                              ) : (
                                <CaretCircleDoubleUp
                                  size={44}
                                  className="mr-4 relative z-10 text-[#F48120] transition-colors duration-300 animate-pulse"
                                  weight="duotone"
                                />
                              )}
                            </div>
                          </Button>
                        </Tooltip>
                      </div>
                    </div>

                  </div>
                </form>

              </div>

            )}

            {/* Messages container */}
            <div className="space-y-4">
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
                      className={`mt-11 flex ${isUser ? "justify-end" : "justify-start"}`
                      }
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

            {/* <div className={`${systemPrompt ? 'hidden' : ''} w-full max-w-7xl mx-auto pl-4 pr-10 rounded-full mb-0 border-b border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm transition-all duration-300 sm:mx-4 md:mx-8 lg:mx-auto`}>
              <div className="flex items-center justify-between gap-3"> */}
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

            {/* <div className={`flex flex-col lg:flex-row items-center justify-center w-full gap-2 ml-4 ${selectedModel !== 'gemini-2.0-flash' ? 'sm:mb-2 mt-2' : ''}`}>
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
                                          <div key={i} className={`w-1 h-1 rounded-full transition-all duration-300 ${i + 1 <= stepMax ? 'bg-white shadow-sm' : 'bg-neutral-300 dark:bg-neutral-600'
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

                </div> */}
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
            {/* </div>
            </div> */}
            <div className="fixed bottom-0 left-0 right-0 z-60">
              {/* System prompt panel - slides from bottom */}
              <div className={`transform transition-all duration-400 ease-out ${systemPrompt ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="bg-gradient-to-b from-white/95 to-white/90 dark:from-neutral-900/95 dark:to-neutral-900/90 backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-700/30 shadow-lg">
                  <div className="max-w-2xl mx-auto px-4 py-3">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-40 transition-opacity duration-300"></div>
                      <div className="relative">
                        <InputSystemPrompt
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder="Configura el comportamiento del asistente..."
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-white/80 dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-700/50 hover:border-neutral-300/80 dark:hover:border-neutral-600/50 focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 shadow-sm transition-all duration-200 placeholder:text-neutral-400/90 dark:placeholder:text-neutral-500/90"
                        />
                        {/* <Tooltip content="Guardar consulta">
                          <Button
                            variant="ghost"
                            size="sm"
                            shape="square"
                            className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 border border-[#F48120]/20 dark:border-[#F48120]/20 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden"
                            onClick={() => {
                              if (inputText.trim() && !savedQueries.includes(inputText)) {
                                const newQueries = [...savedQueries, inputText];
                                setSavedQueries(newQueries);
                                localStorage.setItem('systemQueries', JSON.stringify(newQueries));
                              }
                            }}
                            disabled={!inputText.trim()}
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/10 via-purple-500/10 to-[#F48120]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <BookmarkSimple size={18} className="relative z-10 text-[#F48120] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300" weight="duotone" />
                          </Button>
                        </Tooltip> */}
                      </div>
                    </div>

                    {/* Saved Queries Section */}
                    {/* <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                          <BookmarksSimple size={16} className="text-[#F48120]" weight="duotone" />
                          Consultas guardadas
                        </div>
                        <button
                          onClick={() => setShowSavedQueries(!showSavedQueries)}
                          className="text-sm text-[#F48120] hover:text-orange-500 dark:hover:text-orange-400 transition-colors duration-300 flex items-center gap-1.5"
                        >
                          {showSavedQueries ? (
                            <>
                              <CaretCircleDown size={16} weight="duotone" />
                              Ocultar
                            </>
                          ) : (
                            <>
                              <CaretCircleDoubleUp size={16} weight="duotone" />
                              Ver todas
                            </>
                          )}
                        </button>
                      </div>
                      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 transition-all duration-500 ${showSavedQueries ? 'max-h-[300px]' : 'max-h-[68px]'} overflow-y-auto pr-2`}>
                        {savedQueries.map((query, index) => (
                          <div key={index} className="group relative">
                            <button
                              onClick={() => setInputText(query)}
                              className="w-full px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 border border-[#F48120]/20 dark:border-[#F48120]/20 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 shadow-sm hover:shadow-md dark:shadow-[#F48120]/5 dark:hover:shadow-[#F48120]/10 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] text-neutral-700 dark:text-neutral-300 hover:text-[#F48120] dark:hover:text-[#F48120] group flex items-center gap-2"
                            >
                              <span className="relative z-50 flex-1 text-left truncate">{query}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newQueries = savedQueries.filter((_, i) => i !== index);
                                  setSavedQueries(newQueries);
                                  localStorage.setItem('systemQueries', JSON.stringify(newQueries));
                                }}
                                className="relative z-50 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 p-1"
                              >
                                <X size={14} weight="bold" />
                              </button>
                            </button>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 via-purple-500/5 to-[#F48120]/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ))}
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>

              {/* Main input area - always visible */}
              {agentMessages.length !== 0 && (
                <div className={`relative bg-gradient-to-t from-white/95 via-white/90 to-transparent dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-transparent backdrop-blur-xl border-t border-neutral-200/50 dark:border-neutral-700/50`}>
                  {/* Decorative top border */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-[#F48120] to-purple-500 rounded-full opacity-60"></div>

                  <div className="flex flex-row items-stretch gap-3 p-3 w-full">
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
                              body: JSON.stringify({ maxStepsTemp: stepMax, prompt: inputText, modelTemp: selectedModel, selectedChatId: selectedChatId }),
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
                      <div className="relative group max-w-4xl mx-auto w-full">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500"></div>

                        <div className="relative">
                          {/* Mobile toggle button */}
                          <div className="w-full text-center md:hidden z-20">
                            <Tooltip content={systemPrompt ? "Minimizar" : "Maximizar"}>
                              <Button
                                variant="ghost"
                                size="lg"
                                shape="circular"
                                className={`ml-1 relative w-16 h-16 rounded-full border-2 border-[#F48120]/20 dark:border-[#F48120]/20 bg-white dark:bg-neutral-800 hover:bg-white dark:hover:bg-neutral-800 shadow-sm transition-all duration-300 ease-out transform active:scale-95 overflow-hidden ${systemPrompt ? 'rotate-0' : '-rotate-180'}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSystemPrompt(!systemPrompt);
                                }}
                              >
                                <div className={`transition-transform duration-500 ease-spring ${systemPrompt ? 'rotate-0 translate-y-0' : 'rotate-180 -translate-y-0.5'}`}>
                                  {systemPrompt ? (
                                    <CaretCircleDown
                                      size={44}
                                      className="ml-2 relative z-10 text-[#F48120] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 animate-bounce"
                                      weight="duotone"
                                    />
                                  ) : (
                                    <CaretCircleDoubleUp
                                      size={44}
                                      className="mr-2.5 relative z-10 text-[#F48120] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors duration-300 animate-pulse"
                                      weight="duotone"
                                    />
                                  )}
                                </div>
                              </Button>
                            </Tooltip>
                          </div>

                          {/* Desktop toggle button */}
                          <div className="hidden md:flex justify-center w-full z-20">
                            <Tooltip content={systemPrompt ? "Minimizar" : "Maximizar"}>
                              <Button
                                variant="ghost"
                                size="lg"
                                shape="circular"
                                className={`ml-1 relative w-16 h-16 rounded-full border-2 border-[#F48120]/20 dark:border-[#F48120]/20 bg-white dark:bg-neutral-800 shadow-sm transition-transform duration-300 ease-out transform active:scale-95 overflow-hidden hover:!bg-transparent dark:hover:!bg-transparent ${systemPrompt ? 'rotate-0' : '-rotate-180'}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSystemPrompt(!systemPrompt);
                                }}
                              >
                                <div className={`transition-transform duration-500 ease-spring ${systemPrompt ? 'rotate-0 translate-y-0' : 'rotate-180 -translate-y-0.5'}`}>
                                  {systemPrompt ? (
                                    <CaretCircleDown
                                      size={44}
                                      className="ml-2 relative z-10 text-[#F48120] transition-colors duration-300 animate-bounce"
                                      weight="duotone"
                                    />
                                  ) : (
                                    <CaretCircleDoubleUp
                                      size={44}
                                      className="mr-2.5 relative z-10 text-[#F48120] transition-colors duration-300 animate-pulse"
                                      weight="duotone"
                                    />
                                  )}
                                </div>
                              </Button>
                            </Tooltip>
                          </div>
                        </div>
                        <div className="relative bg-gradient-to-r from-white via-neutral-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 group-hover:border-[#F48120]/30 dark:group-hover:border-[#F48120]/30 group-focus-within:border-[#F48120]/50 dark:group-focus-within:border-[#F48120]/50 shadow-lg group-hover:shadow-xl group-focus-within:shadow-xl transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 rounded-2xl"></div>

                          {/* Input field */}
                          <div className="relative z-10 p-3">
                            <Input
                              disabled={pendingToolCallConfirmation}
                              placeholder={pendingToolCallConfirmation
                                ? "Por favor responde a la confirmación de herramienta arriba..."
                                : "✨ Escribe tu consulta aquí..."}
                              className="w-full bg-transparent border-0 focus:ring-0 text-base lg:text-lg placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium px-2"
                              value={agentInput}
                              onChange={handleAgentInputChange}
                              onValueChange={undefined}
                              onClick={() => { setSystemPrompt(false); }}
                            />
                          </div>

                          {/* Buttons row below input */}
                          <div className="relative z-10 flex items-center justify-between px-3 pb-3 pt-1">
                            <div className="flex items-center gap-2">
                              {/* Attachment button */}
                              <Tooltip content="Adjuntar archivo">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  shape="square"
                                  className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-white via-neutral-50 to-white dark:from-neutral-800 dark:via-neutral-700 dark:to-neutral-800 border border-neutral-200/50 dark:border-neutral-600/50 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 shadow-sm hover:shadow transition-all duration-300 transform hover:scale-105 active:scale-95 group overflow-hidden"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // TODO: Add file attachment logic here
                                  }}
                                >
                                  <Paperclip size={16} className="relative z-10 text-neutral-500 group-hover:text-[#F48120] dark:group-hover:text-[#F48120] transition-colors duration-300" weight="bold" />
                                </Button>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Model Select */}
                              <div className="w-40">
                                <ModelSelect />
                              </div>

                              {/* Send button */}
                              <button
                                type="submit"
                                disabled={pendingToolCallConfirmation || !agentInput.trim()}
                                onClick={(e) => {
                                  try {
                                    if (!user) {
                                      e.preventDefault();
                                      setIsLoginOpen(true);
                                      return;
                                    }
                                  } catch (error) {
                                    console.error('Error al procesar la solicitud:', error);
                                  }
                                }}
                                className={`relative w-12 h-12 rounded-full p-0 flex items-center justify-center 
                              bg-gradient-to-br from-[#F48120] to-purple-500 
                              hover:from-[#ff8f2d] hover:to-purple-600
                              active:from-[#e6731a] active:to-purple-700
                              shadow-lg hover:shadow-xl 
                              transition-all duration-300 
                              transform hover:scale-110 active:scale-95 
                              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                              group overflow-hidden
                              ${pendingToolCallConfirmation ? 'animate-pulse' : ''}`}
                              >
                                {/* Animated background gradient */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity duration-300 rounded-full"></div>

                                {/* Main icon container */}
                                <div className={`relative z-10 w-6 h-6 flex items-center justify-center transition-all duration-300 transform 
                              ${!pendingToolCallConfirmation ? 'group-hover:scale-110' : 'animate-spin'}`}>

                                  {/* Icon with animation */}
                                  {pendingToolCallConfirmation ? (
                                    <div className="relative w-6 h-6">
                                      {/* Outer rotating circle */}
                                      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-l-white/80 border-b-white/80 animate-spin"></div>

                                      {/* Pulsing dot */}
                                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>

                                      {/* Inner gradient circle */}
                                      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-white/90 to-white/60 animate-pulse"></div>

                                      {/* Center dot */}
                                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white/80 rounded-full"></div>
                                    </div>
                                  ) : (
                                    <PaperPlaneRight
                                      size={20}
                                      weight="fill"
                                      className="text-white transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:-translate-y-1"
                                    />
                                  )}
                                </div>

                                {/* Ripple effect on click */}
                                <div className="absolute inset-0 rounded-full opacity-0 group-active:opacity-40 group-active:bg-white transition-opacity duration-500"></div>

                                {/* Subtle pulse effect */}
                                <div className="absolute inset-0 rounded-full border-2 border-white/10 group-hover:border-white/20 transition-all duration-500"></div>
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div></div>
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
    </div>
  );
}

export default function Chat() {
  return (
    <ChatProvider>
      <AIConfigProvider>
        <ModelProvider>
          <ChatComponent />
        </ModelProvider>
      </AIConfigProvider>
    </ChatProvider>
  );
}

// ...
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
