'use client'

import { useRef, useEffect } from 'react'
import { Send, Loader2, User, Sparkles, FileText, Plus, Copy, RefreshCw, Check, X, ExternalLink, Calendar } from 'lucide-react'
import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SearchResult } from './types'
import { type Message } from 'ai'
import { CharacterCounter } from './character-counter'
import Image from 'next/image'
import { MarkdownRenderer } from './markdown-renderer'
import { StockChart } from './stock-chart'

interface MessageData {
  sources: SearchResult[]
  followUpQuestions: string[]
  ticker?: string
}

interface ChatInterfaceProps {
  messages: Message[]
  sources: SearchResult[]
  followUpQuestions: string[]
  searchStatus: string
  isLoading: boolean
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  messageData?: Map<number, MessageData>
  currentTicker?: string | null
}

export function FireplexityChatInterface({ messages, sources, followUpQuestions, searchStatus, isLoading, input, handleInputChange, handleSubmit, messageData, currentTicker }: ChatInterfaceProps) {
  const [selectedSource, setSelectedSource] = useState<SearchResult | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Simple theme detection based on document class
  const theme = typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  
  // Extract the current query and check if we're waiting for response
  let query = '';
  let isWaitingForResponse = false;
  let currentAssistantMessage = null;
  
  if (messages.length > 0) {
    const lastMessage = messages[messages.length - 1];
    
    if (lastMessage.role === 'assistant') {
      // We have an assistant message
      currentAssistantMessage = lastMessage;
      // Find the most recent user message before this assistant message
      for (let i = messages.length - 2; i >= 0; i--) {
        if (messages[i].role === 'user') {
          query = messages[i].content;
          break;
        }
      }
      isWaitingForResponse = false;
    } else if (lastMessage.role === 'user') {
      // Waiting for response to this user message
      query = lastMessage.content;
      isWaitingForResponse = true;
    }
  }

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when new content appears
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    
    // Always scroll to bottom when new messages arrive
    setTimeout(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }, 100)
  }, [messages, sources, followUpQuestions])

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    handleSubmit(e);
    
    // Scroll to bottom after submitting
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        })
      }
    }, 100)
  }

  const handleFollowUpClick = (question: string) => {
    // Set the input and immediately submit
    handleInputChange({ target: { value: question } } as React.ChangeEvent<HTMLTextAreaElement>)
    // Submit the form after a brief delay to ensure input is set
    setTimeout(() => {
      formRef.current?.requestSubmit()
    }, 50)
  }

  const handleCopy = (content: string, messageId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedMessageId(messageId)
    setTimeout(() => setCopiedMessageId(null), 2000)
  }

  const handleRewrite = () => {
    // Get the last user message and resubmit it
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user')
    if (lastUserMessage) {
      handleInputChange({ target: { value: lastUserMessage.content } } as React.ChangeEvent<HTMLTextAreaElement>)
      // Submit the form
      setTimeout(() => {
        formRef.current?.requestSubmit()
      }, 100)
    }
  }


  return (
    <div className="flex flex-col h-full relative" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Top gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent dark:from-zinc-900 dark:to-transparent pointer-events-none z-10" />
      
      
      {/* Main content area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pb-24 pt-8 scroll-smooth relative scrollbar-hide" 
        style={{ 
          scrollBehavior: 'smooth', 
          overscrollBehavior: 'contain', 
          WebkitOverflowScrolling: 'touch',
          isolation: 'isolate'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-6 pb-8">
          {/* Previous conversations */}
          {messages.length > 2 && (
            <>
              {/* Group messages in pairs (user + assistant) */}
              {(() => {
                const pairs: Array<{user: Message, assistant?: Message}> = []
                for (let i = 0; i < messages.length - 2; i += 2) {
                  pairs.push({
                    user: messages[i],
                    assistant: messages[i + 1]
                  })
                }
                return pairs
              })().map((pair, pairIndex) => {
                const assistantIndex = pairIndex
                const storedData = messageData?.get(assistantIndex)
                const messageSources = storedData?.sources || []
                const messageFollowUpQuestions = storedData?.followUpQuestions || []
                const messageTicker = storedData?.ticker || null
                
                return (
                  <div key={pairIndex} className="space-y-6">
                    {/* User message */}
                    {pair.user && (
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{pair.user.content}</h2>
                      </div>
                    )}
                    {pair.assistant && (
                      <>
                        {/* Sources - Show for each assistant response */}
                        {messageSources.length > 0 && (
                          <div className="opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-yellow-500" />
                                <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Sources</h2>
                              </div>
                              {messageSources.length > 5 && (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">+{messageSources.length - 5} more</span>
                                  <div className="flex -space-x-2">
                                    {messageSources.slice(5, 10).map((result, idx) => (
                                      <div key={idx} className="w-5 h-5 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                        {result.favicon ? (
                                          <Image
                                            src={result.favicon}
                                            alt=""
                                            width={16}
                                            height={16}
                                            className="w-4 h-4 object-contain"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        ) : (
                                          <FileText className="h-3 w-3 text-gray-400" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {messageSources.slice(0, 5).map((result, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                                  onClick={() => setSelectedSource(result)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                                      {result.favicon ? (
                                        <Image
                                          src={result.favicon}
                                          alt=""
                                          width={16}
                                          height={16}
                                          className="w-4 h-4 object-contain"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      ) : (
                                        <FileText className="h-3 w-3 text-gray-400" />
                                      )}
                                    </div>
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                                      {result.title || new URL(result.url).hostname}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Assistant message content */}
                        <div className="mt-4">
                          <MarkdownRenderer content={pair.assistant.content} />
                        </div>

                        {/* Stock Chart */}
                        {messageTicker && (
                          <div className="mt-4">
                            <StockChart ticker={messageTicker} theme={theme} />
                          </div>
                        )}

                        {/* Follow-up questions */}
                        {messageFollowUpQuestions.length > 0 && (
                          <div className="mt-6 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
                            <div className="flex items-center gap-2 mb-3">
                              <Sparkles className="h-4 w-4 text-purple-500" />
                              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Follow-up</h3>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {messageFollowUpQuestions.map((question, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleFollowUpClick(question)}
                                  className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* Current conversation */}
          <div className="space-y-6">
            {/* User query */}
            {query && !isWaitingForResponse && messages.length <= 2 && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{query}</h2>
            )}

            {/* Loading state / Search status */}
            {isLoading && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                <p className="text-sm">{searchStatus || 'Searching...'}</p>
              </div>
            )}

            {/* Sources for current response */}
            {sources.length > 0 && (
              <div className="opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:200ms] [animation-fill-mode:forwards]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-yellow-500" />
                    <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400">Sources</h2>
                  </div>
                  {sources.length > 5 && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">+{sources.length - 5} more</span>
                      <div className="flex -space-x-2">
                        {sources.slice(5, 10).map((result, idx) => (
                          <div key={idx} className="w-5 h-5 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                            {result.favicon ? (
                              <Image
                                src={result.favicon}
                                alt=""
                                width={16}
                                height={16}
                                className="w-4 h-4 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <FileText className="h-3 w-3 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {sources.slice(0, 5).map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedSource(result)}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-white dark:bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 dark:border-gray-600">
                          {result.favicon ? (
                            <Image
                              src={result.favicon}
                              alt=""
                              width={16}
                              height={16}
                              className="w-4 h-4 object-contain"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <FileText className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {result.title || new URL(result.url).hostname}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Assistant response content */}
            {currentAssistantMessage && (
              <div className="mt-4">
                <MarkdownRenderer content={currentAssistantMessage.content} />
              </div>
            )}

            {/* Stock Chart for current response */}
            {currentTicker && (
              <div className="mt-4">
                <StockChart ticker={currentTicker} theme={theme} />
              </div>
            )}

            {/* Follow-up questions for current response */}
            {followUpQuestions.length > 0 && !isLoading && (
              <div className="mt-6 opacity-0 animate-fade-up [animation-duration:500ms] [animation-delay:600ms] [animation-fill-mode:forwards]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Follow-up</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {followUpQuestions.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleFollowUpClick(question)}
                      className="bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-300 px-3 py-1.5 rounded-lg text-sm hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom input area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white to-transparent dark:from-zinc-900 dark:to-transparent pointer-events-none z-10 h-24" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
        <div className="max-w-4xl mx-auto">
          <form ref={formRef} onSubmit={handleFormSubmit} className="relative">
            <Textarea
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a follow-up question or start a new search..."
              className="w-full pr-20 pl-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-800 resize-none transition-colors focus:ring-2 focus:ring-orange-500/50"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e as any);
                }
              }}
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <CharacterCounter input={input} />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                variant="orange"
                size="icon"
                className="rounded-full"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Source Detail Modal */}
      <Dialog open={!!selectedSource} onOpenChange={() => setSelectedSource(null)}>
        <DialogContent className="max-w-3xl w-full h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="truncate pr-12">{selectedSource?.title || 'Source Detail'}</DialogTitle>
            <a href={selectedSource?.url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline truncate">
              {selectedSource?.url}
            </a>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">
              {selectedSource?.content}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}