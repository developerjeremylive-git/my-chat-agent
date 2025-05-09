import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple } from '@phosphor-icons/react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

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
              <textarea
                ref={textareaRef}
                value={instructions}
                onChange={handleInstructionsChange}
                className="w-full h-32 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                placeholder="Escribe tus instrucciones aquí. Usa @ para insertar herramientas..."
              />
              
              {showToolMenu && (
                <div
                  ref={menuRef}
                  className="absolute z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-2 min-w-[200px]"
                  style={{
                    top: `${menuPosition.top}px`,
                    left: `${menuPosition.left}px`
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

              {/* Google Drive Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">1.</span>
                <span>Show me recently added files to my</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <Files weight="fill" className="text-[#F48120]" size={16} />
                  <span>Google Drive</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleImprove}
              >
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {/* Google Calendar Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">2.</span>
                <span>Preview my meetings from</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <Calendar weight="fill" className="text-[#F48120]" size={16} />
                  <span>Google Calendar</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleImprove}
              >
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {/* Gmail Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">3.</span>
                <span>Highlight any interviews from</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <EnvelopeSimple weight="fill" className="text-[#F48120]" size={16} />
                  <span>Gmail</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={handleImprove}
              >
                    <X size={14} />
                  </Button>
                </div>
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