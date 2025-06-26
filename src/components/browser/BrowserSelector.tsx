import { cn } from "@/lib/utils";
import { CaretDown, Check, X } from "@phosphor-icons/react";
import { useState, useEffect, useRef } from 'react';
import { useMediaQuery } from 'react-responsive';
import type { BrowserType } from "@/types/api";

interface BrowserOption {
  id: BrowserType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface BrowserSelectorProps {
  selectedBrowser: BrowserType;
  onBrowserChange: (browser: BrowserType) => void;
  isLoading?: boolean;
  className?: string;
}

export const browserOptions: BrowserOption[] = [
  {
    id: "browserbase",
    name: "BrowserBase",
    description: "Web automation with BrowserBase",
    icon: <span className="text-blue-500">BB</span>
  },
  {
    id: "rendering",
    name: "Rendering API",
    description: "Cloudflare's Browser Rendering API",
    icon: <span className="text-orange-500">CF</span>
  }
];

export function BrowserSelector({ 
  selectedBrowser, 
  onBrowserChange, 
  className,
  isLoading = false
}: BrowserSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = browserOptions.find(opt => opt.id === selectedBrowser) || browserOptions[0];
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery({ query: '(max-width: 640px)' });

  // Close dropdown when clicking outside
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

  const handleSelect = (browser: BrowserType) => {
    onBrowserChange(browser);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block text-left w-full sm:w-auto", className)} ref={dropdownRef}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-between w-full sm:w-auto rounded-md border border-gray-300 dark:border-gray-600",
          "px-3 sm:px-4 py-2.5 sm:py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200",
          "hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500",
          "transition-all duration-200 min-w-[50px] sm:min-w-[140px]"
        )}
        id="browser-options"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        aria-label={`Browser selector, current: ${selectedOption.name}`}
      >
        <div className="flex items-center gap-1 sm:gap-2">
          {selectedOption.icon}
          <span className="hidden sm:inline">{selectedOption.name}</span>
        </div>
        <CaretDown 
          className={cn(
            "ml-1 sm:ml-2 -mr-1 h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200",
            isOpen ? 'transform rotate-180' : ''
          )} 
          aria-hidden="true"
        />
      </button>

      {/* Mobile Bottom Sheet */}
      <div 
        className={cn(
          "fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300 sm:hidden",
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      >
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl p-4 pt-6",
            "transform transition-transform duration-300 ease-in-out",
            isOpen ? 'translate-y-0' : 'translate-y-full'
          )}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Browser</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Close browser selector"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pb-4">
            {browserOptions.map((option) => (
              <button
                key={option.id}
                className={cn(
                  "w-full text-left p-4 rounded-lg flex items-center justify-between",
                  "transition-colors duration-200",
                  selectedBrowser === option.id 
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100'
                )}
                onClick={() => {
                  handleSelect(option.id);
                  setIsOpen(false);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-lg">{option.icon}</div>
                  <div className="text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </div>
                {selectedBrowser === option.id && (
                  <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Dropdown */}
      {!isMobile && isOpen && (
        <div
          className="origin-bottom-right absolute right-0 bottom-full mb-2 w-56 rounded-lg shadow-xl bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50 overflow-hidden"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="browser-options"
          style={{
            transform: 'translateY(-8px)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="py-1" role="none">
            {browserOptions.map((option) => (
              <button
                key={option.id}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm flex items-center justify-between",
                  "transition-colors duration-150",
                  selectedBrowser === option.id 
                    ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' 
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                )}
                role="menuitem"
                onClick={() => handleSelect(option.id)}
              >
                <div className="flex items-center gap-3">
                  {option.icon}
                  <div className="text-left">
                    <div className="font-medium">{option.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                </div>
                {selectedBrowser === option.id && (
                  <Check className="h-4 w-4 text-orange-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
          {/* Flecha decorativa */}
          <div className="absolute -bottom-2 right-3 w-4 h-4 transform rotate-45 bg-white dark:bg-gray-800 border-r border-b border-gray-200 dark:border-gray-600 z-0"></div>
        </div>
      )}
    </div>
  );
}
