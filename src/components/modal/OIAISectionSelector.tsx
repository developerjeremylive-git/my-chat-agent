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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-y-auto h-[calc(100%-8rem)] pr-2 scrollbar-thin scrollbar-thumb-[#F48120]/20 scrollbar-track-transparent">
        {options.map((option) => (
          <Card
            key={option}
            className={`cursor-pointer p-4 transition-colors ${selectedOptions.includes(option) ? 'border-primary bg-primary/10' : 'hover:border-primary/50'} flex justify-between items-center group`}
            onClick={() => onSelect(option)}
          >
            <p className="text-sm flex-1">{option}</p>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(option);
              }}
            >
              ×
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};