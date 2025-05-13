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
  Wrench,
  Files,
  DotsThreeCircleVertical,
  Rocket,
  Users,
  ArrowRight,
  ArrowsOut
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
  const [showOiaiGuide, setShowOiaiGuide] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    stream: config.stream,
    onStreamEnd: () => {
      scrollToBottom();
      console.log('Stream finalizado');
    }
  });
  console.log('Configuración:', config);

  const {
    messages: agentMessages,
    input: agentInput,
    handleInputChange: handleAgentInputChange,
    handleSubmit: handleAgentSubmit,
    addToolResult,
    clearHistory,
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

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onThemeChange={toggleTheme}
        onPromptSelect={(prompt) => handleAgentInputChange({ target: { value: prompt } } as any)}
      />
      <main className="flex-1 w-full px-4 py-4">
        <div className="h-[calc(100vh-2rem)] w-full mx-auto flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800">
          <ChatHeader
            onOpenSidebar={() => setIsSidebarOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            showDebug={showDebug}
            onToggleDebug={() => setShowDebug((prev) => !prev)}
            textSize={textSize}
            onTextSizeChange={setTextSize}
          />

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

          <div className="flex-1 overflow-y-auto p-2 space-y-2 pb-20 max-h-[calc(100vh-14rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                <Card className="p-4 md:p-8 w-full max-w-md mx-auto bg-gradient-to-b from-neutral-100/80 to-neutral-50 dark:from-neutral-900/80 dark:to-neutral-950 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="text-center space-y-4 md:space-y-6">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-full blur-2xl dark:from-[#F48120]/10 dark:to-purple-500/10"></div>
                      <div className="bg-gradient-to-r from-[#F48120] to-[#F48120]/80 text-white rounded-full p-3 md:p-4 inline-flex relative transform hover:scale-105 transition-transform duration-300 shadow-lg">
                        <Robot size={24} weight="duotone" className="md:w-7 md:h-7" />
                      </div>
                    </div>
                    <div className="space-y-2 md:space-y-3">
                      <h3 className="font-bold text-xl md:text-2xl bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Bienvenido a tu Asistente IA</h3>
                      <p className="text-neutral-600 dark:text-neutral-300 text-sm md:text-base leading-relaxed hidden md:block">
                        Tu compañero inteligente para resolver dudas y automatizar tareas. Potenciado por tecnología IA avanzada.
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-3 md:p-4 space-y-3 md:space-y-4 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50">
                      <h4 className="font-medium text-sm md:text-base text-neutral-800 dark:text-neutral-200">Explora mis capacidades:</h4>
                      <ul className="grid gap-2 md:gap-3">
                        <li
                          onClick={() => {
                            setShowModal(true);
                            handleAgentInputChange({ target: { value: "¿Cuál es el pronóstico del tiempo para Madrid este fin de semana? Incluye temperatura y probabilidad de lluvia." } } as any);
                          }}
                          className="group relative flex items-center gap-2 md:gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-98 hover:shadow-md">
                          <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120] text-sm md:text-base">🌤️</span>
                          </span>
                          <div className="flex flex-col flex-1">
                            <span className="text-sm md:text-base font-medium">Datos meteorológicos</span>
                            <span className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">Consulta el clima y pronósticos</span>
                          </div>
                          <div className="text-[#F48120] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ArrowRight size={16} className="md:w-5 md:h-5" />
                          </div>
                          <div className="absolute invisible md:group-hover:visible opacity-0 md:group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-4 rounded-lg shadow-xl -top-32 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <h4 className="font-medium mb-2">Asistente Meteorológico</h4>
                            <p className="text-sm mb-3">Obtén información detallada sobre:</p>
                            <ul className="text-xs space-y-1 list-disc list-inside mb-3">
                              <li>Pronósticos del tiempo actualizados</li>
                              <li>Temperaturas máximas y mínimas</li>
                              <li>Probabilidad de precipitaciones</li>
                              <li>Condiciones atmosféricas</li>
                            </ul>
                            <p className="text-xs italic border-t border-white/10 pt-2">"¿Cuál es el pronóstico del tiempo para Madrid este fin de semana? Incluye temperatura y probabilidad de lluvia."</p>
                          </div>
                        </li>
                        <li
                          onClick={() => {
                            setShowModal(true);
                            handleAgentInputChange({ target: { value: "¿Qué hora será en Tokyo cuando sean las 15:00 en Madrid? Programa una reunión considerando el horario laboral de ambas ciudades." } } as any);
                          }}
                          className="group relative flex items-center gap-2 md:gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-98 hover:shadow-md">
                          <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120] text-sm md:text-base">🌍</span>
                          </span>
                          <div className="flex flex-col flex-1">
                            <span className="text-sm md:text-base font-medium">Zonas horarias</span>
                            <span className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">Coordina reuniones internacionales</span>
                          </div>
                          <div className="text-[#F48120] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ArrowRight size={16} className="md:w-5 md:h-5" />
                          </div>
                          <div className="absolute invisible md:group-hover:visible opacity-0 md:group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-4 rounded-lg shadow-xl -top-32 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <h4 className="font-medium mb-2">Coordinador de Zonas Horarias</h4>
                            <p className="text-sm mb-3">Te ayudo a gestionar:</p>
                            <ul className="text-xs space-y-1 list-disc list-inside mb-3">
                              <li>Diferencias horarias entre ciudades</li>
                              <li>Horarios laborales internacionales</li>
                              <li>Programación de reuniones</li>
                              <li>Conversiones horarias automáticas</li>
                            </ul>
                            <p className="text-xs italic border-t border-white/10 pt-2">"¿Qué hora será en Tokyo cuando sean las 15:00 en Madrid? Programa una reunión considerando el horario laboral de ambas ciudades."</p>
                          </div>
                        </li>
                        <li
                          onClick={() => {
                            setShowModal(true);
                            handleAgentInputChange({ target: { value: "¿Podrías ayudarme a crear un plan de estudio personalizado para aprender desarrollo web en 3 meses? Tengo conocimientos básicos de HTML y CSS." } } as any);
                          }}
                          className="group relative flex items-center gap-2 md:gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200 cursor-pointer active:scale-98 hover:shadow-md">
                          <span className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120] text-sm md:text-base">💡</span>
                          </span>
                          <div className="flex flex-col flex-1">
                            <span className="text-sm md:text-base font-medium">Asistencia personalizada</span>
                            <span className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400 line-clamp-1">Respuestas adaptadas a ti</span>
                          </div>
                          <div className="text-[#F48120] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <ArrowRight size={16} className="md:w-5 md:h-5" />
                          </div>
                          <div className="absolute invisible md:group-hover:visible opacity-0 md:group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-4 rounded-lg shadow-xl -top-32 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <h4 className="font-medium mb-2">Asistente Personal de Aprendizaje</h4>
                            <p className="text-sm mb-3">Te ayudo a desarrollar:</p>
                            <ul className="text-xs space-y-1 list-disc list-inside mb-3">
                              <li>Planes de estudio personalizados</li>
                              <li>Rutas de aprendizaje adaptativas</li>
                              <li>Recomendaciones de recursos</li>
                              <li>Seguimiento de progreso</li>
                            </ul>
                            <p className="text-xs italic border-t border-white/10 pt-2">"¿Podrías ayudarme a crear un plan de estudio personalizado para aprender desarrollo web en 3 meses? Tengo conocimientos básicos de HTML y CSS."</p>
                          </div>
                        </li>
                      </ul>
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

          {/* Messages */}
          {/* Action Buttons Frame */}

          <div className="mr-2 fixed bottom-20 right-4 z-20">
            <Tooltip content={systemPrompt ? "Minimizar" : "Expandir"}>
              <Button
                variant="ghost"
                size="md"
                shape="square"
                className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                onClick={() => setSystemPrompt(!systemPrompt)}
              >
                {systemPrompt ? (
                  <CaretLeft size={20} weight="duotone" />
                ) : (
                  <CaretRight size={20} weight="duotone" />
                )}
              </Button>
            </Tooltip>
          </div>

          <div className={`pl-4 pr-10 rounded-full mb-0 mt-0.5 border-b border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm transition-all duration-300 ${!isToolbarExpanded ? 'w-35' : ''} ml-2 mr-2`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Tooltip content="Guía">
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                    onClick={() => setShowOiaiGuide(true)}
                  >
                    <Question size={20} weight="duotone" />
                  </Button>
                </Tooltip>
                <Tooltip content="Crear OIAI">
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9 hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20 transition-colors duration-200"
                    onClick={() => setShowOIAICreator(true)}
                  >
                    <Brain size={20} weight="duotone" />
                  </Button>
                </Tooltip>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="md"
                    shape="square"
                    className="rounded-full h-9 w-9"
                    onClick={() => setShowToolsInterface(true)}
                  >
                    <Wrench size={20} weight="duotone" className="text-[#F48120]" />
                  </Button>
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
                <Tooltip content={isToolbarExpanded ? "Minimizar" : "Expandir"}>
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
              </div>

              {/* Botón de Limpiar Historial */}
              <div className={`transition-all duration-300 ${isToolbarExpanded ? 'opacity-100 max-w-full' : 'opacity-0 max-w-0 overflow-hidden'}`}>
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
            <div className="mb-15 flex items-center justify-between ml-2 mr-9">
              {/* <div className="flex-1"> */}
                {/* <h2 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                  <span className="text-[#F48120] mr-2 ml-1">Sistema</span>
                </h2> */}
                <div className="flex-1">
                  <InputSystemPrompt
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu consulta de sistema (Optional)"
                    className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm focus:border-[#F48120] dark:focus:border-[#F48120] focus:ring-2 focus:ring-[#F48120]/20 dark:focus:ring-[#F48120]/10 transition-all duration-300 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/30"
                  />
                </div>
              {/* </div> */}
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={(e) =>
              handleAgentSubmit(e, {
                data: {
                  annotations: {
                    hello: "world",
                  },
                },
              })
            }
            className="p-2 bg-input-background absolute bottom-0 left-0 right-0 z-10 border-neutral-300 dark:border-neutral-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <div className={`transition-all duration-300 ${!systemPrompt ? 'opacity-100 max-w-full' : 'opacity-0 overflow-hidden'}`}>
                  <h2 className='text-lg font-medium text-neutral-800 dark:text-neutral-200'>
                    <span className="text-[#F48120] mr-2 ml-1">💡Escribe Tu Consulta</span>
                  </h2>
                </div>
                <div className="flex">
                  {/* <p className="mt-2">
                    <span className="text-[#F48120] mr-2 ml-1 ">Usuario</span>
                  </p> */}
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
                <Button
                  type="submit"
                  shape="square"
                  className="mt-7 rounded-full h-10 w-10 flex-shrink-0 mr-2"
                  disabled={pendingToolCallConfirmation || !agentInput.trim()}
                  onClick={async (e) => {
                    try {
                      // Actualizar el modelo en el servidor antes de enviar el mensaje
                      await fetch('/api/model', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ model: selectedModel }),
                      });

                      // Proceder con el envío del mensaje
                      if (!user) {
                        e.preventDefault();
                        setIsLoginOpen(true);
                        // handleAgentSubmit(e);
                        return;
                      }
                    } catch (error) {
                      console.error('Error al actualizar el modelo:', error);
                    }
                  }}
                >
                  <PaperPlaneRight size={16} />
                </Button>
              </div>
            </div>
          </form>
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
      {/* Modal de Guía etherOI */}
      {showOiaiGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowOiaiGuide(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
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
                  className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
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
                        setShowOIAICreator(true);
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
