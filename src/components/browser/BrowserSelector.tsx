import { cn } from "@/lib/utils";
import { CaretDown, Globe, LockKey, Code, Check } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMediaQuery } from 'react-responsive';

type BrowserType = 'firefox' | 'chrome' | 'rendering';

import { ApiKeyModal } from './ApiKeyModal';
import { ApiKeyInput } from "./ApiKeyInput";

interface BrowserOption {
  id: BrowserType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  className?: string;
  isLoading?: boolean;
  chatId?: string;
}

export const browserOptions: BrowserOption[] = [
  // {
  //   id: 'firefox',
  //   name: 'Firefox',
  //   description: 'Standard Firefox browser',
  //   icon: <Globe className="text-orange-500" size={18} />,
  // },
  // {
  //   id: 'chrome',
  //   name: 'Chrome',
  //   description: 'Standard Chrome browser',
  //   icon: <Globe className="text-blue-500" size={18} />,
  // },
  {
    id: 'rendering',
    name: 'Rendering API',
    description: "Cloudflare's Browser Rendering API",
    icon: <Code weight="duotone" className="text-purple-500" size={18} />,
  },
];

export function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  className,
  isLoading = false,
  chatId
}: BrowserSelectorProps) {
  // Asegurarse de que onBrowserChange sea una función
  const handleBrowserChange = useCallback((browser: BrowserType) => {
    if (typeof onBrowserChange === 'function') {
      onBrowserChange(browser);
    }
  }, [onBrowserChange]);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isLoadingKey, setIsLoadingKey] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);
  const [showApiKeySection, setShowApiKeySection] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ maxWidth: 640 });
  
  const selectedOption = browserOptions.find(b => b.id === selectedBrowser) || browserOptions[0];

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if we have an API key when the component mounts or when chatId changes
  useEffect(() => {
    async function checkApiKey() {
      if (!chatId) return;
      
      try {
        setIsLoadingKey(true);
        const response = await fetch(`/api/browser-config?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json() as { fireplexityApiKey?: string };
          if (data.fireplexityApiKey) {
            setApiKey(data.fireplexityApiKey);
          }
        }
      } catch (error) {
        console.error('Error checking API key:', error);
      } finally {
        setIsLoadingKey(false);
      }
    }

    checkApiKey();
  }, [chatId]);

  const handleSelect = useCallback((browser: BrowserType) => {
    if (browser === 'rendering' && !apiKey) {
      setIsApiKeyModalOpen(true);
    } else {
      handleBrowserChange(browser);
    }
  }, [apiKey, handleBrowserChange]);  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleSaveApiKey = async (key: string) => {
    if (!chatId) return;

    setIsLoadingKey(true);
    try {
      const response = await fetch('/api/browser-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          browser: 'rendering',
          fireplexityApiKey: key,
        }),
      });

      interface ApiResponse {
        success: boolean;
        error?: string | { message: string };
        [key: string]: any;
      }
      
      const data: ApiResponse = await response.json();

      if (response.ok) {
        setApiKey(key);
        handleBrowserChange('rendering');
        setIsApiKeyModalOpen(false);
        
        // Mostrar notificación de éxito
        if (typeof window !== 'undefined') {
          const toast = document.createElement('div');
          toast.className = 'fixed bottom-4 right-4 p-4 rounded-md bg-green-500 text-white max-w-sm z-50';
          toast.innerHTML = `
            <div class="font-bold">¡Éxito!</div>
            <div class="text-sm">La clave API se ha guardado correctamente</div>
          `;
          document.body.appendChild(toast);
          
          setTimeout(() => {
            toast.remove();
          }, 5000);
        }
      } else {
        const errorMessage = 
          (typeof data.error === 'object' ? data.error?.message : data.error) || 
          'Error al guardar la clave API';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error al guardar la clave API:', error);
      
      // Mostrar notificación de error
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 p-4 rounded-md bg-red-500 text-white max-w-sm z-50';
        toast.innerHTML = `
          <div class="font-bold">Error</div>
          <div class="text-sm">${error instanceof Error ? error.message : 'Error al guardar la clave API'}</div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.remove();
        }, 5000);
      }
      
      throw error;
    } finally {
      setIsLoadingKey(false);
    }
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <div className="relative w-full sm:w-auto">
        <button
          type="button"
          className={cn(
            "inline-flex items-center justify-between w-full transition-all duration-200",
            "hover:opacity-80 focus:outline-none",
            "bg-transparent py-2 px-3 h-auto min-h-9 text-sm sm:text-base",
            "text-left"
          )}
          id="browser-selector"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={toggleMenu}
          disabled={isLoading || isLoadingKey}
        >
          <div className="flex items-center space-x-2">
            {selectedOption.icon || <Globe className="h-4 w-4" />}
            <span className="font-medium">
              {selectedOption.name}
            </span>
          </div>
          {isLoading || isLoadingKey ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <CaretDown 
              className={cn(
                "ml-2 h-4 w-4 opacity-70 transition-transform duration-200",
                isOpen ? "rotate-180" : ""
              )} 
              aria-hidden="true" 
            />
          )}
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-[calc(100vw-2rem)] max-w-md md:max-w-lg',
              'rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-gray-200 dark:ring-gray-600',
              'overflow-hidden py-1.5 max-h-[80vh] overflow-y-auto',
              'transform' // Ensure transform works properly
            )}
            role="listbox"
            aria-orientation="vertical"
            aria-labelledby="browser-selector"
            tabIndex={-1}
          >
            <div className="px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              Select Browser Type
            </div>
            <div className="p-1.5 space-y-1" role="none">
              {browserOptions.map((browser) => {
                const isSelected = selectedBrowser === browser.id;
                const needsApiKey = browser.id === 'rendering' && !apiKey;
                
                return (
                  <motion.button
                    key={browser.id}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'flex w-full items-center px-3 py-2.5 text-sm rounded-md',
                      'transition-colors duration-150',
                      'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/50',
                      isSelected 
                        ? 'bg-accent text-accent-foreground font-medium' 
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                      needsApiKey ? 'pr-10' : ''
                    )}
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => handleSelect(browser.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0 mr-3 flex items-center justify-center h-8 w-8 rounded-md bg-background dark:bg-gray-700/50 text-foreground/80">
                        {browser.icon || <Globe className="h-4 w-4" />}
                      </div>
                      <div className="text-left w-full">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{browser.name}</span>
                            {needsApiKey && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800/50">
                                <LockKey weight="fill" className="h-2.5 w-2.5 mr-1 flex-shrink-0" />
                                Key Required
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {browser.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="ml-auto h-4 w-4 text-blue-600 dark:text-blue-400" weight="bold" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSave={handleSaveApiKey}
        initialApiKey={apiKey}
      />
      
      <div className="flex items-center mt-2 gap-2">
        {selectedBrowser === 'rendering' && (
          <>
            <input
              type="checkbox"
              id="showApiKeySection"
              checked={showApiKeySection}
              onChange={(e) => setShowApiKeySection(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showApiKeySection" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Configure API Key
            </label>
          </>
        )}
      </div>
      
      {selectedBrowser === 'rendering' && showApiKeySection && (
        <div className="mt-2">
          <ApiKeyInput 
            chatId={chatId || ''}
            currentBrowser={selectedBrowser}
            onApiKeySaved={(hasKey: boolean) => {
              if (hasKey) {
                // Update the local state to reflect that the key is saved
                setApiKey(apiKey || '');
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
