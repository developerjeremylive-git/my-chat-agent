import { useState } from 'react';
import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { OIAISectionSelector } from './OIAISectionSelector';

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

export const OIAICreator = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [customOIAI, setCustomOIAI] = useState<OIAISection | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [showDesktopPreview, setShowDesktopPreview] = useState(false);

  const PreviewContent = () => (
    <div className="space-y-6 text-sm">
      <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-primary mb-2">Persona</h4>
        <p className="text-gray-700 dark:text-gray-300">{customOIAI?.persona}</p>
      </div>
      <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-primary mb-2">Tareas</h4>
        <ul className="space-y-2">
          {customOIAI?.tarea.map((t, i) => (
            <li key={i} className="flex items-start">
              <span className="mr-2 text-primary">•</span>
              <span className="text-gray-700 dark:text-gray-300">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-primary mb-2">Contexto</h4>
        <ul className="space-y-2">
          {customOIAI?.contexto.map((c, i) => (
            <li key={i} className="flex items-start">
              <span className="mr-2 text-primary">•</span>
              <span className="text-gray-700 dark:text-gray-300">{c}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <h4 className="font-medium text-primary mb-2">Formato</h4>
        <ul className="space-y-2">
          {customOIAI?.formato.map((f, i) => (
            <li key={i} className="flex items-start">
              <span className="mr-2 text-primary">•</span>
              <span className="text-gray-700 dark:text-gray-300">{f}</span>
            </li>
          ))}
        </ul>
      </div>
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
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-bold text-center md:text-left mb-6">Selecciona tu profesión</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 px-2 sm:px-0 overflow-y-auto scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
                 className="group cursor-pointer transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] h-auto min-h-[14rem] sm:h-52 flex flex-col justify-between p-6 bg-gradient-to-br from-white/90 to-neutral-50/90 dark:from-gray-900/90 dark:to-gray-800/90 hover:shadow-xl hover:shadow-[#F48120]/10 dark:hover:shadow-[#F48120]/5 border border-[#F48120]/10 dark:border-[#F48120]/5 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10 flex flex-col h-full gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-xl sm:text-2xl">{profession.icon}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:opacity-90">
                        {profession.title}
                      </h3>
                    </div>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {profession.description}
                    </p>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </Card>
              ))}
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4 h-[calc(93.7vh-20rem)]">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text">Personaliza la Persona</h2>
            <Card className="p-6 hover:shadow-lg transition-shadow duration-300 border-2 border-primary/20 dark:border-primary/10 overflow-y-auto scrollbar-none">
              <textarea
                className="h-116 w-full bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
                value={customOIAI?.persona || ''}
                onChange={(e) => customOIAI && setCustomOIAI({ ...customOIAI, persona: e.target.value })}
                placeholder="Describe la personalidad y propósito de tu asistente..."
              />
            </Card>
          </div>
        );
      case 2:
        return (
          <OIAISectionSelector
            title="Configura las Tareas"
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
        );
      case 3:
        return (
          <OIAISectionSelector
            title="Establece el Contexto"
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
        );
      case 4:
        return (
          <div className="space-y-6 h-[calc(100vh-20rem)]">
            <OIAISectionSelector
              title="Define el Formato"
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
            {/* <div className="mt-8 rounded-xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-6 shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto scrollbar-none h-[calc(100%-12rem)]">
              <h3 className="mb-4 text-lg font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm z-10 py-2">Vista Previa del OIAI</h3>
              <div className="space-y-6 text-sm">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-primary mb-2">Persona</h4>
                  <p className="text-gray-700 dark:text-gray-300">{customOIAI?.persona}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-primary mb-2">Tareas</h4>
                  <ul className="space-y-2">
                    {customOIAI?.tarea.map((t, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-primary mb-2">Contexto</h4>
                  <ul className="space-y-2">
                    {customOIAI?.contexto.map((c, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-primary mb-2">Formato</h4>
                  <ul className="space-y-2">
                    {customOIAI?.formato.map((f, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        <span className="text-gray-700 dark:text-gray-300">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div> */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-white/95 via-white to-neutral-50/95 dark:from-gray-900/95 dark:via-gray-900 dark:to-gray-950/95 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ease-in-out border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 min-h-[80vh] sm:min-h-0 flex flex-col relative">
      {/* Botón flotante para vista móvil y escritorio */}
      <Button
        onClick={() => {
          if (window.innerWidth >= 768) {
            setShowDesktopPreview(true);
          } else {
            setShowMobilePreview(true);
          }
        }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-[#F48120] to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-[#F48120] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <span className="relative z-10 text-sm font-medium">Vista</span>
      </Button>

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
              <h3 className="font-semibold text-lg bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Vista Previa</h3>
              <Button
                onClick={() => setShowMobilePreview(false)}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
              >
                ×
              </Button>
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
              <h3 className="font-semibold text-lg bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Vista Previa</h3>
              <Button
                onClick={() => setShowDesktopPreview(false)}
                variant="ghost"
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full w-8 h-8 flex items-center justify-center transition-colors duration-200"
              >
                ×
              </Button>
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
      <Card className={`p-4 md:p-6 mx-2 md:mx-0 mb-4 md:mb-6 transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'} bg-gradient-to-br from-white/80 to-neutral-50/80 dark:from-gray-900/80 dark:to-gray-950/80 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-sm hover:shadow-lg dark:hover:shadow-[#F48120]/5 flex-1`}>
        <div className="max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#F48120]/20 scrollbar-track-transparent pr-2">
          {renderStepContent()}
        </div>
      </Card>


      </div>

      {/* Botones de navegación */}
      <div className="mt-4 md:mt-6 flex justify-between px-2 md:px-0 pb-4 md:pb-6 space-x-4">
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
          Anterior
        </Button>
        <Button
          onClick={() => {
            setIsAnimating(true);
            setTimeout(() => {
              setCurrentStep(Math.min(steps.length - 1, currentStep + 1));
              setIsAnimating(false);
            }, 300);
          }}
          disabled={currentStep === steps.length - 1 || !selectedProfession}
          className="flex-1 md:flex-none transform transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 bg-gradient-to-r from-[#F48120] to-purple-500 hover:from-purple-500 hover:to-[#F48120] text-white shadow-md hover:shadow-lg dark:shadow-[#F48120]/20 text-sm md:text-base py-2 md:py-3"
        >
          Siguiente
        </Button>
      </div>
    </div>
  );
};
