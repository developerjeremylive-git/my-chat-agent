import React, { useEffect, useRef, useState, useMemo } from 'react';
import { emojis, emojiCategories, type EmojiCategory } from '@/lib/emojis';
import { Smiley, MagnifyingGlass, X, ArrowLeft, Check } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

type EmojiColor = 'default' | 'yellow' | 'orange' | 'red' | 'purple' | 'blue' | 'teal' | 'green';

const colorMap: Record<EmojiColor, string> = {
  default: 'filter-none',
  yellow: 'filter-hue-rotate-0 brightness-100 contrast-100',
  orange: 'filter-hue-rotate-[-30deg] brightness-100 contrast-100',
  red: 'filter-hue-rotate-[-50deg] brightness-100 contrast-100',
  purple: 'filter-hue-rotate-[-120deg] brightness-100 contrast-100',
  blue: 'filter-hue-rotate-[-200deg] brightness-100 contrast-100',
  teal: 'filter-hue-rotate-[-160deg] brightness-100 contrast-100',
  green: 'filter-hue-rotate-[-80deg] brightness-100 contrast-100',
};

const colorOptions: { id: EmojiColor; bg: string; selectedBg: string }[] = [
  { id: 'yellow', bg: 'bg-yellow-400', selectedBg: 'ring-2 ring-offset-2 ring-yellow-400' },
  { id: 'orange', bg: 'bg-orange-400', selectedBg: 'ring-2 ring-offset-2 ring-orange-400' },
  { id: 'red', bg: 'bg-red-400', selectedBg: 'ring-2 ring-offset-2 ring-red-400' },
  { id: 'purple', bg: 'bg-purple-400', selectedBg: 'ring-2 ring-offset-2 ring-purple-400' },
  { id: 'blue', bg: 'bg-blue-400', selectedBg: 'ring-2 ring-offset-2 ring-blue-400' },
  { id: 'teal', bg: 'bg-teal-400', selectedBg: 'ring-2 ring-offset-2 ring-teal-400' },
  { id: 'green', bg: 'bg-green-400', selectedBg: 'ring-2 ring-offset-2 ring-green-400' },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  selectedEmoji?: string;
  position?: 'top' | 'bottom';
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ 
  onSelect, 
  onClose, 
  selectedEmoji,
  position = 'bottom'
}) => {
  const [activeCategory, setActiveCategory] = useState<EmojiCategory | null>(null);
  const [selectedColor, setSelectedColor] = useState<EmojiColor>('default');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle Escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showColorPicker) {
          setShowColorPicker(false);
        } else if (activeCategory) {
          setActiveCategory(null);
        } else {
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, activeCategory, showColorPicker]);
  
  // Handle click outside to close the picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isColorPicker = colorPickerRef.current?.contains(target);
      const isPicker = pickerRef.current?.contains(target);
      
      // Only close if clicking outside both the picker and color picker
      if (!isPicker && !isColorPicker) {
        onClose();
      }
    };
    
    // Use a small timeout to prevent immediate click handling
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji: string, event: React.MouseEvent) => {
    // Only close for regular emoji selection, not for category navigation
    event.stopPropagation();
    event.preventDefault();
    onSelect(emoji);
    onClose();
  };

  const handleCategoryClick = (category: EmojiCategory, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    // Don't close the picker, just update the category
    setActiveCategory(category);
  };

  const handleBack = (event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveCategory(null);
  };

  const positionClasses = 'fixed inset-0 flex items-center justify-center bg-black/50 z-50';
  const pickerClasses = 'relative bg-white dark:bg-[#1F1F1F] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden w-[420px] max-h-[500px] flex flex-col';

  // Handle click on the overlay (outside the picker)
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the overlay, not on any children
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  // Stop propagation for all internal clicks
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  return (
    <AnimatePresence>
      <div className={positionClasses} onClick={handleOverlayClick}>
        <motion.div
          ref={pickerRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className={pickerClasses}
          onClick={stopPropagation}
          onMouseDown={stopPropagation}
        >
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex-shrink-0">
          <div className="relative mb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
                {activeCategory || 'Emoji'}
              </h3>
              <div className="flex items-center gap-2">
                <div className="relative" ref={colorPickerRef}>
                  <button 
                    onClick={() => setShowColorPicker(!showColorPicker)}
                    className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2F2F2F] text-neutral-500 dark:text-neutral-400"
                    aria-label="Cambiar color"
                  >
                    <div className={`w-5 h-5 rounded-full ${selectedColor === 'default' ? 'bg-gradient-to-br from-yellow-400 to-orange-400' : colorOptions.find(c => c.id === selectedColor)?.bg}`} />
                  </button>
                  
                  <AnimatePresence>
                    {showColorPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 p-3 bg-white dark:bg-[#2A2A2A] rounded-xl shadow-xl border border-neutral-100 dark:border-neutral-700 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="grid grid-cols-7 gap-2">
                          {colorOptions.map((color) => (
                            <motion.button
                              key={color.id}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedColor(color.id);
                              }}
                              className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center transition-all ${selectedColor === color.id ? 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-[#2A2A2A] ring-white' : ''}`}
                              aria-label={`Color ${color.id}`}
                            >
                              {selectedColor === color.id && <Check size={12} weight="bold" className="text-white" />}
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2F2F2F] text-neutral-500 dark:text-neutral-400"
                  aria-label="Cerrar"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>
          </div>
          

        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {activeCategory ? (
            <div className="grid grid-cols-9 gap-2 justify-items-center">
              {emojis[activeCategory].map((emoji) => (
                <motion.button
                  key={emoji}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => handleEmojiClick(emoji, e)}
                  className={`text-2xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2F2F2F] transition-transform will-change-transform ${
                    selectedEmoji === emoji ? 'bg-neutral-100 dark:bg-[#2F2F2F]' : ''
                  } ${selectedColor !== 'default' ? colorMap[selectedColor] : ''}`}
                  style={{ transformOrigin: 'center' }}
                  aria-label={`Emoji ${emoji}`}
                >
                  {emoji}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 px-1">
                  Categorías
                </h3>
                <div className="grid grid-cols-8 gap-2 justify-items-center">
                  {emojiCategories.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleCategoryClick(category, e)}
                      className="w-11 h-11 flex flex-col items-center justify-center rounded-xl hover:bg-neutral-100 dark:hover:bg-[#2A2A2A] transition-colors"
                      title={category}
                    >
                      <span className="text-2xl">
                        {emojis[category][0]}
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1">
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-3 px-1">
                  Recientes
                </h3>
                <div className="grid grid-cols-8 gap-1 justify-items-center">
                  {['😊', '👍', '❤️', '🔥', '🎉', '👋', '🤔', '😍'].map((emoji) => (
                    <motion.button
                      key={emoji}
                      whileHover={{ scale: 1.2, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleEmojiClick(emoji, e)}
                      className={`text-2xl w-9 h-9 flex items-center justify-center rounded-lg hover:bg-neutral-100 dark:hover:bg-[#2F2F2F] transition-transform will-change-transform ${
                        selectedColor !== 'default' ? colorMap[selectedColor] : ''
                      }`}
                      style={{ transformOrigin: 'center' }}
                      aria-label={`Emoji ${emoji}`}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
    </AnimatePresence>
  );
};
