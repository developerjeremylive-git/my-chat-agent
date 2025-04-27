import React, { useState, useEffect, useRef } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';

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
    <div className="my-4 w-full">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 shadow-md transition-all duration-300">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Pensamiento del Asistente
          </div>
          <button className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
            {isExpanded ? <CaretDown size={20} /> : <CaretUp size={20} />}
          </button>
        </div>
        
        <div className={`mt-2 overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
          <div className="text-gray-700 dark:text-gray-300 text-sm">
            {displayedText}
            {isTyping && <span className="animate-pulse">|</span>}
          </div>
        </div>
      </div>
    </div>
  );
};