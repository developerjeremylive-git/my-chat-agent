import { useEffect, useState, useRef, useCallback, use } from "react";
import { useAgent } from "agents/react";
import { useAgentChat } from "agents/ai-react";
import type { Message } from "@ai-sdk/react";
import { APPROVAL } from "./shared";
import type { tools } from "./tools";
import { AIConfigProvider, useAIConfig } from "@/contexts/AIConfigContext";
import "@/styles/markdown.css";
import { MessageView } from "@/components/message/MessageView";

// Component imports
import { Button } from "@/components/button/Button";
import { Card } from "@/components/card/Card";
import { Input } from "@/components/input/Input";
import { Avatar } from "@/components/avatar/Avatar";
import { Toggle } from "@/components/toggle/Toggle";
import { Tooltip } from "@/components/tooltip/Tooltip";
import { AISettingsPanel } from "@/components/settings/AISettingsPanel";
import { Sidebar } from "@/components/sidebar/Sidebar";

// Icon imports
import {
  Bug,
  Moon,
  PaperPlaneRight,
  Robot,
  Sun,
  Trash,
  Gear,
  List
} from "@phosphor-icons/react";
import AuthPopup from "./components/AuthPopup";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// List of tools that require human confirmation
const toolsRequiringConfirmation: (keyof typeof tools)[] = [
  "getWeatherInformation",
];

function ChatComponent() {
  const { config } = useAIConfig();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {

    // Check localStorage first, default to dark if not found
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as "dark" | "light") || "dark";
  });
  const [showDebug, setShowDebug] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      />
      <main className="flex-1 container mx-auto px-4 py-4">
        <div className="h-[calc(100vh-2rem)] w-full mx-auto max-w-lg flex flex-col shadow-xl rounded-md overflow-hidden relative border border-neutral-300 dark:border-neutral-800">
          <div className="px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 flex items-center gap-3 sticky top-0 z-10">
            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-9 w-9"
              onClick={() => setIsSidebarOpen(true)}
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
                    d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7m-7.9-16.9c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3m0 41.4c1.6 0 3 1.3 3 3s-1.3 3-3 3-3-1.3-3-3 1.4-3 3-3M44.3 72c-.4.2-.7.3-1.1.3-.2 0-.4.1-.5.1h-.2c-.9.1-1.7 0-2.6-.3-1-.3-1.9-.9-2.7-1.7-.7-.8-1.3-1.7-1.6-2.7l-.3-1.5v-.7q0-.75.3-1.5c.1-.2.1-.4.2-.7s.3-.6.5-.9c0-.1.1-.1.1-.2.1-.1.1-.2.2-.3s.1-.2.2-.3c0 0 0-.1.1-.1l.6-.6-2.7-3.5c-1.3 1.1-2.3 2.4-2.9 3.9-.2.4-.4.9-.5 1.3v.1c-.1.2-.1.4-.1.6-.3 1.1-.4 2.3-.3 3.4-.3 0-.7 0-1-.1-2.2-.4-4.2-1.5-5.5-3.2-1.4-1.7-2-3.9-1.8-6.1q.15-1.2.6-2.4l.3-.6c.1-.2.2-.4.3-.5 0 0 0-.1.1-.1.4-.7.9-1.3 1.5-1.9 1.6-1.5 3.8-2.3 6-2.3q1.05 0 2.1.3v-4.5c-.7-.1-1.4-.2-2.1-.2-1.8 0-3.5.4-5.2 1.1-.7.3-1.3.6-1.9 1s-1.1.8-1.7 1.3c-.3.2-.5.5-.8.8-.6-.8-1-1.6-1.3-2.6-.2-1-.2-2 0-2.9.2-1 .6-1.9 1.3-2.6.6-.8 1.4-1.4 2.3-1.8l1.8-.9-.7-1.9c-.4-1-.5-2.1-.4-3.1s.5-2.1 1.1-2.9q.9-1.35 2.4-2.1c.9-.5 2-.8 3-.7.5 0 1 .1 1.5.2 1 .2 1.8.7 2.6 1.3s1.4 1.4 1.8 2.3l4.1-1.5c-.9-2-2.3-3.7-4.2-4.9q-.6-.3-.9-.6c.4-.7 1-1.4 1.6-1.9.8-.7 1.8-1.1 2.9-1.3.9-.2 1.7-.1 2.6 0 .4.1.7.2 1.1.3V72zm25-22.3c-1.6 0-3-1.3-3-3 0-1.6 1.3-3 3-3s3 1.3 3 3c0 1.6-1.3 3-3 3"
                  />
                </symbol>
                <use href="#ai:local:agents" />
              </svg>
            </div>

            <div className="flex-1">
              <h2 className="font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Asistente Inteligente</h2>
            </div>

            <div className="flex items-center gap-2 mr-2">
              <Bug size={16} />
              <Toggle
                toggled={showDebug}
                aria-label="Toggle debug mode"
                onClick={() => setShowDebug((prev) => !prev)}
              />
            </div>

            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-9 w-9"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Gear size={20} />
            </Button>

            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-9 w-9"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </Button>

            <Button
              variant="ghost"
              size="md"
              shape="square"
              className="rounded-full h-9 w-9"
              onClick={clearHistory}
            >
              <Trash size={20} />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 max-h-[calc(100vh-10rem)] scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {agentMessages.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <Card className="p-8 max-w-md mx-auto bg-gradient-to-b from-neutral-100/80 to-neutral-50 dark:from-neutral-900/80 dark:to-neutral-950 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-800/50 shadow-xl hover:shadow-2xl transition-all duration-300">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="absolute -inset-4 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-full blur-2xl dark:from-[#F48120]/10 dark:to-purple-500/10"></div>
                      <div className="bg-gradient-to-r from-[#F48120] to-[#F48120]/80 text-white rounded-full p-4 inline-flex relative transform hover:scale-105 transition-transform duration-300 shadow-lg">
                        <Robot size={28} weight="duotone" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="font-bold text-2xl bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Bienvenido a tu Asistente IA</h3>
                      <p className="text-neutral-600 dark:text-neutral-300 text-base leading-relaxed">
                        Tu compañero inteligente para resolver dudas y automatizar tareas. Potenciado por tecnología IA avanzada.
                      </p>
                    </div>
                    <div className="bg-white/50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-4 backdrop-blur-sm border border-neutral-200/50 dark:border-neutral-700/50">
                      <h4 className="font-medium text-neutral-800 dark:text-neutral-200">Explora mis capacidades:</h4>
                      <ul className="text-base space-y-3">
                        <li className="group relative flex items-center gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200">
                          <span className="flex-shrink-0 w-8 h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120]">🌤️</span>
                          </span>
                          <div className="flex flex-col">
                            <span>Obtén datos meteorológicos precisos y actualizados</span>
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">Consulta el clima, pronósticos y condiciones atmosféricas</span>
                          </div>
                          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-3 rounded-lg shadow-xl -top-24 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <p className="text-sm font-medium mb-2">Ejemplo de uso:</p>
                            <p className="text-xs italic">"¿Cuál es el pronóstico del tiempo para Madrid este fin de semana? Incluye temperatura y probabilidad de lluvia."</p>
                          </div>
                        </li>
                        <li className="group relative flex items-center gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200">
                          <span className="flex-shrink-0 w-8 h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120]">🌍</span>
                          </span>
                          <div className="flex flex-col">
                            <span>Maneja zonas horarias con precisión</span>
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">Coordina reuniones y eventos internacionales sin complicaciones</span>
                          </div>
                          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-3 rounded-lg shadow-xl -top-24 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <p className="text-sm font-medium mb-2">Ejemplo de uso:</p>
                            <p className="text-xs italic">"¿Qué hora será en Tokyo cuando sean las 15:00 en Madrid? Programa una reunión considerando el horario laboral de ambas ciudades."</p>
                          </div>
                        </li>
                        <li className="group relative flex items-center gap-3 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 p-2 rounded-lg transition-all duration-200">
                          <span className="flex-shrink-0 w-8 h-8 bg-[#F48120]/10 dark:bg-[#F48120]/20 rounded-full flex items-center justify-center">
                            <span className="text-[#F48120]">💡</span>
                          </span>
                          <div className="flex flex-col">
                            <span>Recibe asistencia inteligente y personalizada</span>
                            <span className="text-sm text-neutral-500 dark:text-neutral-400">Obtén respuestas adaptadas a tus necesidades específicas</span>
                          </div>
                          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 bg-neutral-800 dark:bg-neutral-700 text-white p-3 rounded-lg shadow-xl -top-24 left-0 right-0 mx-4 transition-all duration-200 z-10">
                            <p className="text-sm font-medium mb-2">Ejemplo de uso:</p>
                            <p className="text-xs italic">"¿Podrías ayudarme a crear un plan de estudio personalizado para aprender desarrollo web en 3 meses? Tengo conocimientos básicos de HTML y CSS."</p>
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
                                      } relative`}
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
            className="p-3 bg-input-background absolute bottom-0 left-0 right-0 z-10 border-t border-neutral-300 dark:border-neutral-800"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  disabled={pendingToolCallConfirmation}
                  placeholder={
                    pendingToolCallConfirmation
                      ? "Please respond to the tool confirmation above..."
                      : "Type your message..."
                  }
                  className="pl-4 pr-10 py-2 w-full rounded-full"
                  value={agentInput}
                  onChange={handleAgentInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAgentSubmit(e as unknown as React.FormEvent);
                    }
                  }}
                  onValueChange={undefined}
                />
              </div>

              <Button
                type="submit"
                shape="square"
                className="rounded-full h-10 w-10 flex-shrink-0"
                disabled={pendingToolCallConfirmation || !agentInput.trim()}
              >
                <PaperPlaneRight size={16} />
              </Button>
            </div>
          </form>
        </div>
      </main>
      <AISettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <AuthPopup />
    </div>
  );
}

export default function Chat() {
  return (
    <AIConfigProvider>
      <ChatComponent />
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
