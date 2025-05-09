import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ComputerTower, Image as ImageIcon, Globe, Code } from '@phosphor-icons/react';

interface ToolsInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'available' | 'coming_soon';
}

const tools: Tool[] = [
  {
    id: 'canvas',
    name: 'Lienzo Colaborativo',
    description: 'Colabora en documentos en tiempo real con tu equipo',
    icon: <ComputerTower size={24} />,
    status: 'available'
  },
  {
    id: 'image_generation',
    name: 'Generación de Imágenes',
    description: 'Crea imágenes impactantes con IA',
    icon: <ImageIcon size={24} />,
    status: 'coming_soon'
  },
  {
    id: 'web_search',
    name: 'Búsqueda Web',
    description: 'Encuentra información relevante al instante',
    icon: <Globe size={24} />,
    status: 'available'
  },
  {
    id: 'code_interpreter',
    name: 'Intérprete de Código',
    description: 'Genera y analiza código con asistencia de IA',
    icon: <Code size={24} />,
    status: 'coming_soon'
  }
];

export const ToolsInterface: React.FC<ToolsInterfaceProps> = ({ isOpen, onClose }) => {
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-29 left-4 z-50 w-80 overflow-hidden"
        >
          <Card ref={menuRef} className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-lg rounded-xl">
              <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                    Herramientas
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={onClose}
                  >
                    <X size={18} />
                  </Button>
                </div>
              </div>

              <div className="p-2 space-y-1">
                {tools.map((tool) => (
                  <motion.div
                    key={tool.id}
                    whileHover={{ scale: 1.02 }}
                    className={`group flex items-center gap-3 p-3 rounded-lg
                      ${tool.status === 'available' ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : 'opacity-70'}
                      transition-all duration-200`}
                    onClick={() => tool.status === 'available' && setSelectedTool(tool)}
                  >
                    <div className={`p-2 rounded-lg ${tool.status === 'available' ? 'bg-[#F48120]/10 text-[#F48120]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                      {tool.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium truncate ${tool.status === 'available' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                          {tool.name}
                        </h3>
                        {tool.status === 'coming_soon' && (
                          <span className="px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                            Próximamente
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{tool.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
};