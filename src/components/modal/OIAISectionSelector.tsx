import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { useState } from 'react';

type SectionProps = {
  title: string;
  options: string[];
  selectedOptions: string[];
  onSelect: (option: string) => void;
};

export const OIAISectionSelector = ({
  title,
  options,
  selectedOptions,
  onSelect,
}: SectionProps) => {
  const [newOption, setNewOption] = useState('');

  const handleAddOption = () => {
    if (newOption.trim() && !options.includes(newOption.trim())) {
      onSelect(newOption.trim());
      setNewOption('');
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-20rem)]">
      <h3 className="text-lg font-semibold sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 py-2">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Agregar nueva opción..."
          className="flex-1 px-4 py-2 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:outline-none focus:border-primary/50 text-sm"
          onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
        />
        <Button
          onClick={handleAddOption}
          disabled={!newOption.trim()}
          className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          Agregar
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 overflow-y-auto h-[calc(100%-8rem)] pr-2 scrollbar-thin scrollbar-thumb-[#F48120]/20 scrollbar-track-transparent">
        {options.map((option) => (
          <Card
            key={option}
            className={`group relative transform transition-all duration-300 p-4 overflow-hidden rounded-xl ${
              selectedOptions.includes(option)
                ? 'bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 border-2 border-[#F48120]/30 dark:border-[#F48120]/20 shadow-lg shadow-[#F48120]/10'
                : 'hover:bg-gradient-to-br hover:from-white/95 hover:to-neutral-50/95 dark:hover:from-gray-800/95 dark:hover:to-gray-700/95 border border-[#F48120]/20 dark:border-[#F48120]/10 hover:shadow-lg hover:shadow-[#F48120]/5'
            }`}
            // onClick={() => {
              // if (!e.target.closest('button')) {
              // }
              // onSelect(option);
            // }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex justify-between items-center gap-3">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-[#F48120] transition-colors duration-200">{option}</p>
                <div className="h-0.5 bg-gradient-to-r from-[#F48120]/30 to-purple-500/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"></div>
              </div>
              <button
                type="button"
                className=" group-hover:opacity-100 transition-all duration-200 w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:scale-110 active:scale-95 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(option);
                }}
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};