import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Check, Sparkle, MagicWand } from '@phosphor-icons/react';
import { EmojiPicker } from '@/components/ui/emoji-picker';

interface WorkspaceFormData {
  title: string;
  emoji: string;
  emojiColor?: string;
  description: string;
  instructions: string;
}

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WorkspaceFormData) => void;
  initialData?: Partial<WorkspaceFormData> | null;
  systemPrompt?: string;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  systemPrompt = ''
}) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    emoji: initialData?.emoji || '📁',
    emojiColor: initialData?.emojiColor || '',
    description: initialData?.description || '',
    instructions: initialData?.instructions || '',
  });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);

  const instructionExamples = [
    'Responde siempre en un tono profesional y técnico. Sé conciso pero completo en tus explicaciones. Si no estás seguro de algo, admítelo en lugar de especular.',
    'Actúa como un asistente de programación experto. Proporciona ejemplos de código cuando sea relevante y explica los conceptos de manera clara. Si el código tiene posibles problemas, menciónalos.',
    'Eres un asistente creativo. Responde con ideas innovadoras y pensamiento lateral. Fomenta la creatividad y la exploración de conceptos inusuales.',
    'Como asistente educativo, adapta tus respuestas para explicar conceptos complejos de manera sencilla. Usa analogías y ejemplos prácticos para facilitar la comprensión.',
    'Responde siempre en español neutro. Mantén un tono amable y profesional. Si la pregunta es ambigua, pide aclaraciones antes de responder.',
    'Eres un experto en productividad. Proporciona consejos prácticos, técnicas y estrategias para mejorar la gestión del tiempo y la eficiencia en el trabajo.',
    'Como asistente de escritura, ayuda a mejorar la claridad, coherencia y estilo del texto. Sugiere sinónimos, reestructura oraciones y ofrece alternativas para mejorar la fluidez.',
    'Actúa como un mentor de negocios. Proporciona análisis estratégicos, identifica oportunidades y ofrece recomendaciones basadas en las mejores prácticas de la industria.'
  ];

  const handleAIClick = () => {
    const randomIndex = Math.floor(Math.random() * instructionExamples.length);
    setFormData(prev => ({
      ...prev,
      instructions: instructionExamples[randomIndex]
    }));
  };

  // Update form data when opening/closing or when systemPrompt changes
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        title: initialData?.title || '',
        emoji: initialData?.emoji || '📁',
        emojiColor: initialData?.emojiColor || '',
        description: initialData?.description || '',
        instructions: initialData?.instructions || systemPrompt || prev.instructions,
      }));
    }
  }, [isOpen, initialData, systemPrompt]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiButtonRef.current && 
        !emojiButtonRef.current.contains(event.target as Node) &&
        showEmojiPicker
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmojiSelect = (emoji: string, color?: string) => {
    setFormData(prev => ({
      ...prev,
      emoji,
      emojiColor: color || ''
    }));
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        emoji: formData.emoji,
        emojiColor: formData.emojiColor,
        description: formData.description.trim(),
        instructions: formData.instructions.trim(),
      });
      onClose();
    } catch (error) {
      console.error('Error submitting workspace:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ 
            type: 'spring',
            damping: 25,
            stiffness: 500,
            mass: 0.5
          }}
          className="relative w-full max-w-md bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderPlus size={24} weight="duotone" className="text-blue-500" />
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {initialData ? 'Editar espacio' : 'Nuevo espacio'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors"
                aria-label="Cerrar"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              Organiza tus conversaciones en espacios temáticos
            </p>
          </div>

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 pt-4">
            <div className="space-y-5">
              {/* Title & Emoji Row */}
              <div className="flex gap-3">
                <div className="relative">
                  <button
                    ref={emojiButtonRef}
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center text-2xl rounded-xl bg-neutral-100 dark:bg-neutral-700/50 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                    aria-label="Seleccionar emoji"
                    dangerouslySetInnerHTML={{ __html: formData.emoji }}
                  />
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <div className="absolute left-0 bottom-full mb-2 z-10">
                      <EmojiPicker
                        onSelect={handleEmojiSelect}
                        onClose={() => setShowEmojiPicker(false)}
                        selectedEmoji={formData.emoji}
                        position="top"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <label htmlFor="title" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Título <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Mi espacio de trabajo"
                    className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Un espacio para organizar mis conversaciones sobre..."
                  rows={2}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              {/* Custom Instructions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="instructions" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Instrucciones personalizadas (opcional)
                  </label>
                  <button
                    type="button"
                    onClick={handleAIClick}
                    className="inline-flex items-center gap-1 text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
                    title="Generar instrucciones de ejemplo"
                  >
                    <Sparkle size={14} weight="fill" />
                    IA
                  </button>
                </div>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  placeholder="Ej: Responde siempre en español y proporciona respuestas detalladas..."
                  rows={4}
                  className="w-full px-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                />
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  Estas instrucciones afectarán a todos los hilos de este espacio.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!formData.title.trim() || isSubmitting}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all flex items-center gap-2 ${
                  !formData.title.trim() || isSubmitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check size={18} weight="bold" />
                    {initialData ? 'Guardar cambios' : 'Crear espacio'}
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
