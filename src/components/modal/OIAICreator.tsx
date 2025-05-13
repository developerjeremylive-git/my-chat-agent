import { useState } from 'react';
import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { OIAISectionSelector } from './OIAISectionSelector';
import { Modal } from './Modal';
import { X } from "@phosphor-icons/react";
type Profession = 'generador' | 'programador' | 'editor';

type OIAISection = {
  persona: string;
  tarea: string[];
  contexto: string[];
  formato: string[];
};

const plantillasOIAI: Record<Profession, OIAISection> = {
  generador: {
    persona: 'Tu intención es inspirar y alentar la creatividad. Me ayudarás a generar todo tipo de ideas, como regalos, temáticas para fiestas, ideas para historias, actividades para el fin de semana y mucho más.',
    tarea: [
      'Actúa como mi herramienta personal de generación de ideas y bríndame sugerencias que sean relevantes para la instrucción, originales y creativas.',
      'Colabora conmigo y busca entradas que hagan que las ideas sean más relevantes para mis intereses y necesidades.'
    ],
    contexto: [
      'Haz preguntas para encontrar nuevas fuentes de inspiración a partir de las entradas y perfecciona las ideas.',
      'Usa un tono entusiasta y enérgico, y un vocabulario fácil de comprender.',
      'Mantén el contexto durante toda la conversación.'
    ],
    formato: [
      'Comprende mi solicitud haciendo preguntas específicas sobre intereses y necesidades.',
      'Ofrece al menos tres ideas adaptadas a la solicitud.',
      'Comparte ideas en un formato fácil de leer.'
    ]
  },
  programador: {
    persona: 'Tu propósito es ayudarme con tareas como escribir, corregir y comprender código. Compartiré mis objetivos y proyectos contigo, y tú me asistirás para crear el código que necesito para triunfar.',
    tarea: [
      'Creación de código completo que cumpla con los objetivos.',
      'Enseñar los pasos para desarrollar código.',
      'Proporcionar documentación clara para cada paso.'
    ],
    contexto: [
      'Mantener un tono positivo y paciente durante todo el proceso.',
      'Usar lenguaje claro y simple.',
      'Mantener el foco en la programación.'
    ],
    formato: [
      'Reunir información sobre el propósito y uso del código.',
      'Mostrar vista previa de la solución y pasos de desarrollo.',
      'Presentar código de manera fácil de copiar y pegar.'
    ]
  },
  editor: {
    persona: 'Tu propósito es ayudarme a editar lo que escribo. Te compartiré un texto, y tú me mostrarás ediciones y comentarios detallados línea por línea sobre gramática, ortografía, coherencia verbal, dialecto, estilo y estructura.',
    tarea: [
      'Editar diversos tipos de textos y proporcionar comentarios.',
      'Mostrar ediciones específicas línea por línea.',
      'Brindar comentarios detallados sobre el texto.'
    ],
    contexto: [
      'Ofrecer ayuda y críticas constructivas con tono positivo.',
      'Presentar ediciones en formato de viñetas.',
      'Explicar el razonamiento detrás de cada sugerencia.'
    ],
    formato: [
      'Preguntar sobre objetivos de escritura y tipo de comentarios necesarios.',
      'Estructurar comentarios por categorías (gramática, ortografía, etc.).',
      'Ofrecer orientación para el formato final del texto.'
    ]
  }
};

type Step = {
  title: string;
  description: string;
};

const steps: Step[] = [
  {
    title: 'Selecciona tu profesión',
    description: 'Elige el tipo de asistente que mejor se adapte a tus necesidades.'
  },
  {
    title: 'Personaliza la Persona',
    description: 'Define el propósito y personalidad de tu asistente.'
  },
  {
    title: 'Configura las Tareas',
    description: 'Selecciona las principales responsabilidades de tu asistente.'
  },
  {
    title: 'Establece el Contexto',
    description: 'Define cómo tu asistente debe comportarse y comunicarse.'
  },
  {
    title: 'Define el Formato',
    description: 'Especifica cómo tu asistente debe estructurar sus respuestas.'
  }
];

interface OIAICreatorProps {
  onCopyContent?: (content: string) => void;
}

export const OIAICreator = ({ onCopyContent, onClose }: OIAICreatorProps & { onClose?: () => void } = {}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [customOIAI, setCustomOIAI] = useState<OIAISection | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showDesktopPreview, setShowDesktopPreview] = useState(false);

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [copiedContent, setCopiedContent] = useState('');

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleCopyContent = (event?: React.MouseEvent<HTMLButtonElement>) => {
    if (event) {
      event.preventDefault();
    }
    if (!customOIAI) return;

    const content = [
      `Persona:\n${customOIAI.persona}\n`,
      `Tareas:\n${customOIAI.tarea.map(t => `• ${t}`).join('\n')}\n`,
      `Contexto:\n${customOIAI.contexto.map(c => `• ${c}`).join('\n')}\n`,
      `Formato:\n${customOIAI.formato.map(f => `• ${f}`).join('\n')}`
    ].join('\n');

    setShowMobilePreview(false);
    setShowDesktopPreview(false);
    if (onCopyContent) {
      onCopyContent(content);
    }
    handleClose();
  };

  const PreviewContent = () => (
    <div className="space-y-6 text-sm">
      {currentStep >= 1 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-[#F48120]/20 dark:border-[#F48120]/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-[#F48120]/20">1</div>
            <h4 className="font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Persona</h4>
          </div>
          <p className="text-gray-700 dark:text-gray-300 pl-11">{customOIAI?.persona}</p>
        </div>
      )}
      {currentStep >= 2 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-[#F48120]/20 dark:border-[#F48120]/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-[#F48120]/20">2</div>
            <h4 className="font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Tareas</h4>
          </div>
          <ul className="space-y-2 pl-11">
            {customOIAI?.tarea.map((t, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 text-[#F48120]">•</span>
                <span className="text-gray-700 dark:text-gray-300">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {currentStep >= 3 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-[#F48120]/20 dark:border-[#F48120]/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-[#F48120]/20">3</div>
            <h4 className="font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Contexto</h4>
          </div>
          <ul className="space-y-2 pl-11">
            {customOIAI?.contexto.map((c, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 text-[#F48120]">•</span>
                <span className="text-gray-700 dark:text-gray-300">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {currentStep >= 4 && (
        <div className="p-4 rounded-lg bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-800/80 dark:to-gray-900/80 border border-[#F48120]/20 dark:border-[#F48120]/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F48120] to-purple-500 flex items-center justify-center text-white font-semibold shadow-lg shadow-[#F48120]/20">4</div>
            <h4 className="font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Formato</h4>
          </div>
          <ul className="space-y-2 pl-11">
            {customOIAI?.formato.map((f, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-2 text-[#F48120]">•</span>
                <span className="text-gray-700 dark:text-gray-300">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const handleProfessionSelect = (profession: Profession) => {
    setIsAnimating(true);
    setSelectedProfession(profession);
    setCustomOIAI(plantillasOIAI[profession]);
    setTimeout(() => {
      setCurrentStep(1);
      setIsAnimating(false);
    }, 300);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6 h-[calc(93.7vh-20rem)]">
            <h2 className="text-xl md:text-2xl font-bold text-center md:text-left mb-8 bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Selecciona tu profesión</h2>
            <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-4 sm:p-6 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-h-[calc(100vh-240px)] sm:max-h-none before:absolute before:inset-4 sm:before:inset-6 before:bg-gradient-to-br before:from-[#F48120]/5 before:to-purple-500/5 before:opacity-30 before:rounded-3xl before:z-0">
              <div className="absolute inset-0 backdrop-blur-[2px] bg-white/10 dark:bg-gray-900/10 rounded-3xl z-0"></div>
              {[
                {
                  id: 'generador',
                  icon: '💡',
                  title: 'Generador de Ideas',
                  description: 'Para inspirar creatividad y generar ideas'
                },
                {
                  id: 'programador',
                  icon: '👨‍💻',
                  title: 'Programador',
                  description: 'Para asistencia en programación y código'
                },
                {
                  id: 'editor',
                  icon: '✍️',
                  title: 'Editor de Textos',
                  description: 'Para edición y mejora de textos'
                }
              ].map((profession) => (
                <Card
                  key={profession.id}
                  onClick={() => handleProfessionSelect(profession.id as Profession)}
                  className={`group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] touch-manipulation h-auto min-h-[16rem] sm:h-56 flex flex-col justify-between p-6 sm:p-8 ${selectedProfession === profession.id ? 'bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 border-2 border-[#F48120]/30 dark:border-[#F48120]/20 shadow-lg shadow-[#F48120]/10' : 'bg-gradient-to-br from-white/95 to-neutral-50/95 dark:from-gray-900/95 dark:to-gray-800/95 hover:shadow-2xl hover:shadow-[#F48120]/20 dark:hover:shadow-[#F48120]/10 border-2 border-[#F48120]/20 dark:border-[#F48120]/10'} relative overflow-hidden rounded-2xl backdrop-blur-sm`
                  }  >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 flex flex-col h-full gap-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#F48120]/15 to-purple-500/15 dark:from-[#F48120]/10 dark:to-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-[#F48120]/5">
                        <span className="text-2xl sm:text-3xl">{profession.icon}</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:opacity-90 leading-tight">
                        {profession.title}
                      </h3>
                    </div>
                    <p className="text-base text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {profession.description}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#F48120]/30 to-purple-500/30 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full"></div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 h-[calc(93.7vh-20rem)]">
            <div className="flex flex-col space-y-2">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Personaliza la Persona</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define el propósito y personalidad de tu asistente para crear una experiencia única.</p>
            </div>
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 overflow-y-auto scrollbar-none bg-gradient-to-br from-white/95 to-neutral-50/95 dark:from-gray-900/95 dark:to-gray-800/95 backdrop-blur-sm">
              <div className="relative">
                <textarea
                  className="h-116 w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed placeholder-gray-400 dark:placeholder-gray-600"
                  value={customOIAI?.persona || ''}
                  onChange={(e) => customOIAI && setCustomOIAI({ ...customOIAI, persona: e.target.value })}
                  placeholder="Describe la personalidad y propósito de tu asistente..."
                  aria-label="Descripción de la personalidad del asistente"
                />
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F48120]/30 to-purple-500/30 transform scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500 origin-left rounded-full"></div>
              </div>
            </Card>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 h-[calc(93.7vh-20rem)]">
            <div className="flex flex-col space-y-2">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Configura las Tareas</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define las principales responsabilidades y capacidades de tu asistente.</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <OIAISectionSelector
                title="Selecciona o añade tareas"
                options={customOIAI?.tarea || []}
                selectedOptions={customOIAI?.tarea || []}
                onSelect={(option) => {
                  if (customOIAI) {
                    const updatedTareas = customOIAI.tarea.includes(option)
                      ? customOIAI.tarea.filter((t) => t !== option)
                      : [...customOIAI.tarea, option];
                    setCustomOIAI({ ...customOIAI, tarea: updatedTareas });
                  }
                }}
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 h-[calc(93.7vh-20rem)]">
            <div className="flex flex-col space-y-2">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Establece el Contexto</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Define cómo tu asistente debe comportarse y comunicarse durante las interacciones.</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <OIAISectionSelector
                title="Selecciona o añade contextos"
                options={customOIAI?.contexto || []}
                selectedOptions={customOIAI?.contexto || []}
                onSelect={(option) => {
                  if (customOIAI) {
                    const updatedContexto = customOIAI.contexto.includes(option)
                      ? customOIAI.contexto.filter((c) => c !== option)
                      : [...customOIAI.contexto, option];
                    setCustomOIAI({ ...customOIAI, contexto: updatedContexto });
                  }
                }}
              />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 h-[calc(93.7vh-20rem)]">
            <div className="flex flex-col space-y-2">
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Define el Formato</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Especifica cómo tu asistente debe estructurar y presentar sus respuestas.</p>
            </div>
            <div className="flex-1 overflow-hidden">
              <OIAISectionSelector
                title="Selecciona o añade formatos"
                options={customOIAI?.formato || []}
                selectedOptions={customOIAI?.formato || []}
                onSelect={(option) => {
                  if (customOIAI) {
                    const updatedFormato = customOIAI.formato.includes(option)
                      ? customOIAI.formato.filter((f) => f !== option)
                      : [...customOIAI.formato, option];
                    setCustomOIAI({ ...customOIAI, formato: updatedFormato });
                  }
                }}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-white/95 via-white to-neutral-50/95 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950/95 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 min-h-[80vh] sm:min-h-0 flex flex-col relative">
        <div className="absolute top-4 right-4 z-20">
          <Button
            variant="ghost"
            size="sm"
            shape="square"
            className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
            onClick={handleClose}
          >
            <X size={20} weight="bold" />
          </Button>
        </div>

        {/* Modal de vista previa móvil */}
        {showMobilePreview && (
          <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 md:hidden backdrop-blur-sm"
            onClick={() => setShowMobilePreview(false)}
          >
            <div
              className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100"
              style={{
                animation: 'modalAppear 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5">
                <h3 className="font-semibold text-lg bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Resumen</h3>
                <div className="flex gap-2">
                  {/* <Button
                  onClick={handleCopyContent}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
                >
                  📋
                </Button> */}
                  <Button
                    onClick={() => setShowMobilePreview(false)}
                    variant="ghost"
                    size="sm"
                    shape="square"
                    className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
                  >
                    <X size={20} weight="bold" />
                  </Button>
                </div>
              </div>
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <PreviewContent />
              </div>
            </div>
          </div>
        )}

        {/* Modal de vista previa escritorio */}
        {showDesktopPreview && (
          <div
            className="fixed inset-0 z-50 bg-black/50 hidden md:flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowDesktopPreview(false)}
          >
            <div
              className="w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 opacity-100"
              style={{
                animation: 'modalAppear 0.3s ease-out'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5">
                <h3 className="font-semibold text-lg bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Resumen</h3>
                <div className="flex gap-2">
                  {/* <Button
                  onClick={handleCopyContent}
                  variant="ghost"
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
                >
                  📋
                </Button> */}
                  <Button
                    onClick={() => setShowDesktopPreview(false)}
                    variant="ghost"
                    size="sm"
                    shape="square"
                    className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
                  >
                    <X size={20} weight="bold" />
                  </Button>
                </div>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <PreviewContent />
              </div>
            </div>
          </div>
        )}

        <div className="gap-6">
          {/* Barra de progreso */}
          <div className="mb-6 md:mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 opacity-50 rounded-lg"></div>
            <div className="flex justify-between gap-2 md:gap-4 relative z-10 p-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className={`flex flex-col items-center relative group ${index <= currentStep ? 'text-primary' : 'text-gray-400'} transition-colors duration-300`}
                >
                  <div
                    className={`h-10 w-10 rounded-full ${index <= currentStep ? 'bg-gradient-to-br from-[#F48120] to-purple-500 shadow-lg shadow-[#F48120]/20 dark:shadow-[#F48120]/10' : 'bg-neutral-200 dark:bg-neutral-700'} flex items-center justify-center text-white transform transition-all duration-300 ${index < currentStep ? 'scale-110' : ''} hover:scale-105 relative overflow-hidden`}
                    onMouseEnter={() => setIsHovered(`step-${index}`)}
                    onMouseLeave={() => setIsHovered(null)}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 transition-opacity duration-300 ${isHovered === `step-${index}` ? 'opacity-100' : 'opacity-0'} flex items-center justify-center`}>
                      {index + 1}
                    </div>
                    <span className="relative z-10">{index + 1}</span>
                  </div>
                  <span className="mt-2 text-xs md:text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent transition-all duration-300 group-hover:opacity-90 text-center">{step.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contenido del paso actual */}
          <Card className={`p-4 md:p-1 mx-2 md:mx-0 mb-4 md:mb-6 transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-900/80 dark:to-gray-950/80 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#F48120]/5 flex-1`}>
            <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#F48120]/20 scrollbar-track-transparent pr-2">
              {renderStepContent()}
            </div>
          </Card>


        </div>

        {/* Botones de navegación */}
        <div className="mb-6 md:mb-6 flex justify-between px-2 md:px-0 pb-4 md:pb-6 space-x-4">
          <Button
            onClick={() => {
              setIsAnimating(true);
              setTimeout(() => {
                setCurrentStep(Math.max(0, currentStep - 1));
                setIsAnimating(false);
              }, 300);
            }}
            disabled={currentStep === 0}
            variant="secondary"
            className="flex-1 md:flex-none transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-r from-neutral-100 to-neutral-50 dark:from-neutral-800 dark:to-neutral-900 hover:shadow-md dark:hover:shadow-[#F48120]/5 border border-neutral-200/50 dark:border-neutral-700/50 text-sm md:text-base py-2 md:py-3"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
              <path d="M10.25 6.75L4.75 12L10.25 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 12H19.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Anterior */}
          </Button>
          <div className="flex flex-row gap-4 justify-center w-full">
            {currentStep > 0 && (
              <Button
                onClick={() => {
                  if (window.innerWidth >= 768) {
                    setShowDesktopPreview(true);
                  } else {
                    setShowMobilePreview(true);
                  }
                }}
                className={`h-12 rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 text-[#F48120] hover:from-[#F48120]/20 hover:to-purple-500/20 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10 border border-[#F48120]/20 dark:border-[#F48120]/10 transform hover:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group w-[80px] md:w-[150px]`}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4.75H19.25V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.25 4.75L13.75 10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19.25 15.25V19.25H4.75V4.75H8.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="font-medium hidden md:inline">Resumen</span>
              </Button>
            )}
            {/* {currentStep === 4 && (
            <Button
              onClick={handleCopyContent}
              className="w-[80px] md:w-[150px] h-12 rounded-xl bg-gradient-to-r from-purple-500/10 to-[#F48120]/10 dark:from-purple-500/5 dark:to-[#F48120]/5 text-purple-500 hover:from-purple-500/20 hover:to-[#F48120]/20 dark:hover:from-purple-500/10 dark:hover:to-[#F48120]/10 border border-purple-500/20 dark:border-purple-500/10 transform hover:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group animate-pulse hover:animate-none"
            >
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
                <path d="M8 6.75H15.25V17.25H8V6.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12.75 4.75H20V15.25H12.75V4.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-medium hidden md:inline">Copiar</span>
            </Button>
          )} */}
          </div>
          {(currentStep === 0 || currentStep === 1 || currentStep === 2 || currentStep === 3) && (
            <Button
              className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-opacity duration-200"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!customOIAI?.contexto.length || customOIAI.contexto.length === 0}
            >
              <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
                <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 12H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {/* Siguiente */}
            </Button>

          )}
          {currentStep === 4 && (
            <Button
              onClick={() => {
                handleCopyContent();
                const event = new CustomEvent('openSystemPrompt');
                window.dispatchEvent(event);
              }}
              disabled={!customOIAI?.formato.length || customOIAI.formato.length === 0}
              className="flex-1 md:flex-none transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-r from-[#F48120] to-purple-500 hover:from-purple-500 hover:to-[#F48120] text-white shadow-md hover:shadow-lg dark:shadow-[#F48120]/20 text-sm md:text-base py-2 md:py-3"
            >
              <div className="flex items-center justify-center gap-2">
                <span>Finalizar</span>
                <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
                  <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 12H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Button>
          )}
          {/* <Button
          onClick={() => {
            setIsAnimating(true);
            setTimeout(() => {
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
              setIsAnimating(false);
            }, 300);
          }}
          disabled={
            currentStep === steps.length - 1 ||
            !selectedProfession ||
            (currentStep === 1 && (!customOIAI?.persona || customOIAI.persona.trim() === '')) ||
            (currentStep === 2 && (!customOIAI?.tarea || customOIAI.tarea.length === 0)) ||
            (currentStep === 3 && (!customOIAI?.contexto || customOIAI.contexto.length === 0)) ||
            (currentStep === 4 && (!customOIAI?.formato || customOIAI.formato.length === 0))
          }
          className="flex-1 md:flex-none transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-r from-[#F48120] to-purple-500 hover:from-purple-500 hover:to-[#F48120] text-white shadow-md hover:shadow-lg dark:shadow-[#F48120]/20 text-sm md:text-base py-2 md:py-3"
        >
          <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 24 24" fill="none">
            <path d="M13.75 6.75L19.25 12L13.75 17.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19 12H4.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Siguiente
        </Button> */}
        </div>

      </div>

      <Modal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          if (onCopyContent) {
            onCopyContent(copiedContent);
          }
        }}
        className="w-full h-[85vh]"
      >
        <textarea
          className="w-full h-[80vh] p-4 bg-transparent border-none focus:outline-none resize-none text-base md:text-lg"
          value={copiedContent}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setCopiedContent(e.target.value);
            // if (onCopyContent) {
            //   onCopyContent(e.target.value);
            // }
          }}
        />
      </Modal>

    </>
  );
};
