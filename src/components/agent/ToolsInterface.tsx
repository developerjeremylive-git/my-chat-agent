import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ComputerTower, Image as ImageIcon, Globe, Code, Robot, Rocket, PlugsConnected } from '@phosphor-icons/react';

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
    selected: boolean;
}

const initialTools: Tool[] = [
    {
        id: 'ai_assistant',
        name: 'USB',
        description: 'Conecta con IA',
        icon: <PlugsConnected size={24} />,
        status: 'available',
        selected: false
    },
    {
        id: 'ai_agent',
        name: 'Agente Inteligente',
        description: 'Crea flujos de trabajo',
        icon: <Robot size={24} />,
        status: 'available',
        selected: false
    },
    {
        id: 'web_search',
        name: 'Búsqueda Web',
        description: 'Encuentra información al instante',
        icon: <Globe size={24} />,
        status: 'available',
        selected: false
    },
    {
        id: 'canvas',
        name: 'Lienzo Colaborativo',
        description: 'Edita documentos en tiempo real',
        icon: <ComputerTower size={24} />,
        status: 'coming_soon',
        selected: false
    },
    {
        id: 'image_generation',
        name: 'Generación de Imágenes',
        description: 'Crea imágenes con IA',
        icon: <ImageIcon size={24} />,
        status: 'coming_soon',
        selected: false
    },
    {
        id: 'code_interpreter',
        name: 'Intérprete de Código',
        description: 'Analiza código con IA',
        icon: <Code size={24} />,
        status: 'coming_soon',
        selected: false
    }
];

export const ToolsInterface: React.FC<ToolsInterfaceProps> = ({ isOpen, onClose }) => {
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [tools, setTools] = useState<Tool[]>(initialTools);
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
                    className="fixed bottom-29 left-4 z-50 w-80 overflow-hidden ml-2"
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
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    className={`group flex items-center gap-3 p-3 rounded-lg
                      ${tool.status === 'available' ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800' : 'opacity-70'}
                      ${(tool.id === 'ai_assistant' || tool.id === 'ai_agent') ? 'bg-gradient-to-r from-[#F48120]/5 to-purple-500/5 dark:from-[#F48120]/10 dark:to-purple-500/10 border-2 border-[#F48120] dark:border-[#F48120]/50' : ''}
                      transition-all duration-200`}
                                    onClick={() => {
                                        if (tool.status === 'available') {
                                            setSelectedTool(tool.id === selectedTool ? null : tool.id);
                                            if (tool.id === 'ai_assistant') {
                                                onClose();
                                                window.dispatchEvent(new CustomEvent('openModernAgentInterface'));
                                            } else if (tool.id === 'ai_agent') {
                                                onClose();
                                                window.dispatchEvent(new CustomEvent('openToolsInterface'));
                                            }
                                        }
                                    }}
                                >
                                    <div className={`p-2 rounded-lg ${tool.status === 'available' ? 'bg-[#F48120]/10 text-[#F48120]' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'}`}>
                                        {tool.icon}
                                    </div>
                                    <div className="flex-1 min-w-0 flex items-center justify-between relative">
                                        <div className="flex flex-col flex-grow pr-16">
                                            <div className="flex items-center gap-2">
                                                <h3 className={`font-medium truncate ${tool.status === 'available' ? 'text-neutral-900 dark:text-white' : 'text-neutral-500'}`}>
                                                    {tool.name}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{tool.description}</p>
                                            {tool.status === 'coming_soon' && (
                                                <span className="absolute bottom-0 right-0 px-1.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 rounded">
                                                    Próximamente
                                                </span>
                                            )}
                                        </div>
                                        {tool.status === 'available' && (
                                            <div className="absolute right-0 top-0">
                                                <div
                                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors duration-200 ${tool.selected ? 'border-[#F48120] bg-[#F48120]' : 'border-neutral-300 dark:border-neutral-600'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setTools(tools.map(t =>
                                                            t.id === tool.id ? { ...t, selected: !t.selected } : t
                                                        ));
                                                    }}
                                                >
                                                    {tool.selected && (
                                                        <div className="w-2 h-2 rounded-full bg-white" />
                                                    )}
                                                </div>
                                            </div>
                                        )}
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