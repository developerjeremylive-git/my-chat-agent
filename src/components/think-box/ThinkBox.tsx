import React, { useState, useEffect, useRef } from 'react';
import { Brain, CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

interface ThinkBoxProps {
  content: string;
}

export const ThinkBox: React.FC<ThinkBoxProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const textRef = useRef(content);
  
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 30; // Velocidad de escritura en milisegundos
    
    if (content !== textRef.current) {
      setDisplayedText('');
      currentIndex = 0;
      textRef.current = content;
      setIsTyping(true);
    }

    const typingInterval = setInterval(() => {
      if (currentIndex < content.length) {
        setDisplayedText(prev => prev + content[currentIndex]);
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTyping(false);
      }
    }, typingSpeed);

    return () => clearInterval(typingInterval);
  }, [content]);

  return (
    <div className="my-2 w-full">
      <div className="bg-[#F48120]/10 rounded-lg overflow-hidden border border-[#F48120]/20 transition-all duration-300">
        <div 
          className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#F48120]/5 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Brain size={18} weight="duotone" className="text-[#F48120]" />
            <span className="text-[#F48120] text-sm font-medium">
              {isTyping ? 'Pensando...' : 'Pensamiento'}
            </span>
          </div>
          <CaretDown
            size={16}
            weight="bold"
            className={cn(
              'text-[#F48120] transition-transform duration-200',
              isExpanded ? 'rotate-180' : ''
            )}
          />
        </div>
        
        <div className={cn(
          'overflow-hidden transition-[max-height] duration-200 ease-in-out',
          isExpanded ? 'max-h-96' : 'max-h-0'
        )}>
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            {displayedText}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  );
};