import React, { useState } from 'react';
import { CaretDown, CaretUp } from '@phosphor-icons/react';

interface ThinkBoxProps {
  content: string;
}

export const ThinkBox: React.FC<ThinkBoxProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(true);

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
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};