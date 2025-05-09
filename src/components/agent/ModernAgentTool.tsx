import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple, PencilSimple } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';

interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const availableTools: Tool[] = [
  { id: 'drive', name: 'Google Drive', icon: <Files weight="fill" size={16} className="text-[#F48120]" /> },
  { id: 'calendar', name: 'Google Calendar', icon: <Calendar weight="fill" size={16} className="text-[#F48120]" /> },
  { id: 'gmail', name: 'Gmail', icon: <EnvelopeSimple weight="fill" size={16} className="text-[#F48120]" /> }
];

const useCases = [
  "Muéstrame los archivos recientes de Google Drive y resalta los documentos importantes.",
  "Programa una reunión con el equipo de desarrollo para mañana a las 10 AM.",
  "Revisa mi bandeja de entrada y destaca los correos urgentes de clientes.",
  "Organiza mis archivos de Drive por fecha de modificación y tipo de contenido."
];

interface Task {
  id: string;
  text: string;
  tools: Tool[];
}

interface ModernAgentToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModernAgentTool({ isOpen, onClose }: ModernAgentToolProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [title, setTitle] = useState('My New Agent');
  const [description, setDescription] = useState('Add description');
  const [instructions, setInstructions] = useState('');
  const [showToolMenu, setShowToolMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [filteredTools, setFilteredTools] = useState<Tool[]>([]);
  const [currentUseCaseIndex, setCurrentUseCaseIndex] = useState(0);
  const [selectedToolIndex, setSelectedToolIndex] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const editTaskRef = useRef<HTMLDivElement>(null);

  const renderInstructionsWithTools = (text: string, isPreview: boolean = false) => {
    const parts = text.split(/\[(.*?)\]/);
    return parts.map((part, index) => {
      const tool = availableTools.find(t => t.name === part);
      if (tool) {
        return (
          <div
            key={index}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm ${!isPreview ? 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors' : ''}`}
            onClick={() => (!isPreview && setSelectedToolIndex(index))}
          >
            {tool.icon}
            <span>{tool.name}</span>
            {(!isPreview && (selectedToolIndex === index)) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute z-50 mt-2 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 min-w-[200px] overflow-hidden"
              >
                {availableTools.map((t, idx) => (
                  <motion.div
                    key={t.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10 dark:hover:from-[#F48120]/20 dark:hover:to-purple-500/20 cursor-pointer group transition-all duration-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      const parts = text.split(/\[(.*?)\]/);
                      const newParts = parts.map((part, i) => {
                        if (i === index) {
                          return `[${t.name}]`;
                        } else if (availableTools.find(tool => tool.name === part)) {
                          return `[${part}]`;
                        }
                        return part;
                      });
                      const newText = newParts.join('');
                      setInstructions(newText);
                      setSelectedToolIndex(null);
                    }}
                  >
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {t.icon}
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-300 group-hover:text-[#F48120] transition-colors duration-300">
                      {t.name}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        );
      }
      return <span key={index}>{part}</span>;
    });
  
  };

  const handleTitleClick = () => {
    const titleInput = document.createElement('input');
    titleInput.value = title;
    titleInput.className = 'text-2xl font-bold bg-transparent w-full focus:outline-none';
    titleInput.onblur = (e: FocusEvent) => setTitle((e.target as HTMLInputElement).value);
    titleInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        titleInput.blur();
      }
    };
    document.querySelector('h2')?.replaceWith(titleInput);
    titleInput.focus();
  };

  const handleDescriptionClick = () => {
    const descInput = document.createElement('input');
    descInput.value = description;
    descInput.className = 'text-neutral-600 dark:text-neutral-400 w-full focus:outline-none';
    descInput.onblur = (e: FocusEvent) => setDescription((e.target as HTMLInputElement).value);
    descInput.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        descInput.blur();
      }
    };
    document.querySelector('p')?.replaceWith(descInput);
    descInput.focus();
  };

  const handleInstructionsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInstructions(text);
    
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = text.slice(0, cursorPosition);
    const match = textBeforeCursor.match(/@([^\s]*)$/);

    if (match) {
      const searchTerm = match[1].toLowerCase();
      const filtered = availableTools.filter(tool =>
        tool.name.toLowerCase().includes(searchTerm)
      );
      setFilteredTools(filtered);

      if (textareaRef.current) {
        const coords = getCaretCoordinates(textareaRef.current, cursorPosition);
        setMenuPosition({
          top: coords.top + 20,
          left: coords.left
        });
        setShowToolMenu(true);
      }
    } else {
      setShowToolMenu(false);
    }
  };

  const insertTool = (tool: Tool) => {
    if (textareaRef.current) {
      const text = instructions;
      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = text.slice(0, cursorPosition);
      const textAfterCursor = text.slice(cursorPosition);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      const newText = textBeforeCursor.slice(0, lastAtIndex) +
        `[${tool.name}]` + textAfterCursor;
      setInstructions(newText);
      setShowToolMenu(false);
      textareaRef.current.focus();
    }
  };

  const handleImprove = () => {
    setInstructions(useCases[currentUseCaseIndex]);
    setCurrentUseCaseIndex((prevIndex) => (prevIndex + 1) % useCases.length);
  };

  const handleAddTask = () => {
    if (instructions.trim()) {
      const toolMatches = instructions.match(/\[(.*?)\]/g) || [];
      const tools = toolMatches
        .map(match => {
          const toolName = match.slice(1, -1);
          return availableTools.find(t => t.name === toolName);
        })
        .filter((tool): tool is Tool => tool !== undefined);

      const newTask: Task = {
        id: Date.now().toString(),
        text: instructions,
        tools: tools
      };

      setTasks(prevTasks => [...prevTasks, newTask]);
      setInstructions('');
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setInstructions(task.text);
      setEditingTaskId(taskId);
    }
  };

  const handleUpdateTask = () => {
    if (editingTaskId) {
      const toolMatches = instructions.match(/\[(.*?)\]/g) || [];
      const tools = toolMatches
        .map(match => {
          const toolName = match.slice(1, -1);
          return availableTools.find(t => t.name === toolName);
        })
        .filter((tool): tool is Tool => tool !== undefined);

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === editingTaskId
            ? { ...task, text: instructions, tools: tools }
            : task
        )
      );
      setInstructions('');
      setEditingTaskId(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (editTaskRef.current && !editTaskRef.current.contains(event.target as Node)) {
        setSelectedToolIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getCaretCoordinates = (element: HTMLTextAreaElement, position: number) => {
    const { offsetLeft, offsetTop } = element;
    const div = document.createElement('div');
    const styles = getComputedStyle(element);
    const properties = [
      'boxSizing', 'width', 'height', 'padding', 'border', 'lineHeight',
      'fontFamily', 'fontSize', 'fontWeight', 'letterSpacing'
    ];

    properties.forEach(prop => {
      div.style[prop as any] = styles[prop as any];
    });

    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.textContent = element.value.substring(0, position);

    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);

    document.body.appendChild(div);
    const { offsetLeft: spanLeft, offsetTop: spanTop } = span;
    document.body.removeChild(div);

    return {
      left: offsetLeft + spanLeft,
      top: offsetTop + spanTop
    };
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowToolMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-300`}>
      <Card className="w-full max-w-2xl bg-white dark:bg-neutral-900 p-6 m-4 relative overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        <div className="space-y-6">
          {/* Encabezado */}
          <div>
            <h2 
              className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent cursor-pointer"
              onClick={handleTitleClick}
            >
              {title}
            </h2>
            <p 
              className="text-neutral-600 dark:text-neutral-400 mt-1 cursor-pointer"
              onClick={handleDescriptionClick}
            >
              {description}
            </p>
          </div>

          {/* Instrucciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Instructions</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#F48120] hover:text-[#F48120]/80"
                onClick={handleImprove}
              >
                ✨ Improve
              </Button>
            </div>

            <div className="space-y-3 relative">
              <div className="space-y-3">
                <textarea
                  ref={textareaRef}
                  value={instructions}
                  onChange={handleInstructionsChange}
                  className="w-full h-32 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                  placeholder="Escribe tus instrucciones aquí. Usa @ para insertar herramientas..."
                />
                {/* <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 min-h-[50px] relative">
                  {renderInstructionsWithTools(instructions)}
                </div> */}
                <motion.div 
                  className="flex justify-end space-x-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >   
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
                      onClick={() => {
                        setInstructions('');
                        setEditingTaskId(null);
                      }}
                    >
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        Cancelar
                      </motion.span>
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      variant="primary"
                      size="sm"
                      className={`${editingTaskId ? 'bg-gradient-to-r from-[#F48120] to-purple-500 shadow-lg hover:shadow-xl' : 'bg-[#F48120] hover:bg-[#F48120]/90'} text-white transition-all duration-300 transform hover:-translate-y-0.5`}
                      onClick={editingTaskId ? handleUpdateTask : handleAddTask}
                    >
                      <motion.span
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        {editingTaskId ? 'Actualizar Tarea' : 'Agregar Tarea'}
                      </motion.span>
                    </Button>
                  </motion.div>
                </motion.div>
              </div>
              
              {showToolMenu && (
                <div
                  ref={menuRef}
                  className="absolute z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 min-w-[200px]"
                  style={{
                    top: `${menuPosition.top}px`,
                    left: `${Math.min(menuPosition.left, window.innerWidth - 220)}px`
                  }}
                >
                  {filteredTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 cursor-pointer"
                      onClick={() => insertTool(tool)}
                    >
                      {tool.icon}
                      <span>{tool.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Lista de Tareas */}
              <div className="space-y-2" ref={editTaskRef}>
                <AnimatePresence>
                  {tasks.map((task, index) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      className={`flex items-center gap-2 p-2 rounded-lg group transform transition-all duration-300 ${editingTaskId === task.id ? 'bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 border-2 border-[#F48120] scale-102' : 'hover:bg-gradient-to-r hover:from-neutral-100/50 hover:to-neutral-100 dark:hover:from-neutral-800/50 dark:hover:to-neutral-800 hover:scale-[1.02]'}`}
                    >
                      <motion.span 
                        className="text-[#F48120] font-medium"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        {index + 1}.
                      </motion.span>
                      <div className="flex-1">{renderInstructionsWithTools(task.text, editingTaskId !== task.id)}</div>
                      <motion.div 
                        className="flex items-center gap-2 transition-all duration-300"
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#F48120] hover:bg-[#F48120]/10 transition-colors duration-300"
                          onClick={() => handleEditTask(task.id)}
                        >
                          <PencilSimple size={16} className="transform transition-transform duration-300 hover:rotate-12" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-500/10 transition-colors duration-300"
                          onClick={() => handleDeleteTask(task.id)}
                          disabled={editingTaskId === task.id}
                        >
                          <X size={16} className="transform transition-transform duration-300 hover:rotate-90" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Include Knowledge */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Include Knowledge</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <Files weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Drive</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <EnvelopeSimple weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Gmail</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <Calendar weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Calendar</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg border-dashed border-2"
                onClick={handleImprove}
              >
                Libraries 1
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}