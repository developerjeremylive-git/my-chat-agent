import { useState } from 'react';
import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { cn } from '@/lib/utils';
import { List, X, Brain, Code, Lightbulb, Robot, ChartLine, Moon, Sun, GraduationCap, Pencil, Palette, Leaf, Camera, MusicNotes, ChartBar, Globe, ShieldCheck, Rocket, Wrench, Users, Question, PlusCircle, ChatText } from '@phosphor-icons/react';
import AuthPopup from '../AuthPopup';
import AuthButton from '../AuthButton';
import { OIAICreator } from '../modal/OIAICreator';
import { AgentDashboard } from '../agent/AgentDashboard';
import { SystemPromptDashboard } from '../dashboard/SystemPromptDashboard';

interface PromptTemplate {
  title: string;
  description: string;
  prompt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  theme: "dark" | "light";
  onThemeChange: () => void;
  onPromptSelect?: (prompt: string) => void;
}

export function Sidebar({ isOpen, onClose, theme, onThemeChange, onPromptSelect }: SidebarProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);
  const [isAgentsExpanded, setIsAgentsExpanded] = useState(false);
  const [showAgentDashboard, setShowAgentDashboard] = useState(false);
  const [showOiaiGuide, setShowOiaiGuide] = useState(false);
  const [showOIAICreator, setShowOIAICreator] = useState(false);
  const [showSystemPromptDashboard, setShowSystemPromptDashboard] = useState(false);

  const promptTemplates = {
    "exploracion-ideas": [
      {
        title: "Ideas de regalos creativos",
        description: "Ideas de regalos no muy caras y creativas para el cumple de mi amiga.",
        prompt: "Necesito ideas de regalos creativos y económicos para el cumpleaños de mi amiga que le encanta el arte y la naturaleza. Presupuesto máximo de 50€."
      },
      {
        title: "Decoración de oficina",
        description: "¿Cómo puedo decorar mi oficina para que sea más acogedora sin que deje de ser profesional?",
        prompt: "Sugiere ideas para decorar una oficina pequeña de 3x4 metros para que sea más acogedora manteniendo un ambiente profesional. Incluye sugerencias de colores, plantas y disposición del mobiliario."
      },
      {
        title: "Planificación de reunión",
        description: "Ayúdame a planificar una reunión familiar en mi casa.",
        prompt: "Necesito ayuda para planificar una reunión familiar de 10 personas en mi casa. Incluye sugerencias de menú, actividades y disposición del espacio."
      },
      {
        title: "Ideas para picnic",
        description: "¿Me das ideas de platos divertidos para llevar a un picnic con niños?",
        prompt: "Necesito ideas de platos divertidos y saludables para un picnic con 4 niños de entre 5-8 años. Los platos deben ser fáciles de transportar y comer al aire libre."
      }
    ],
    "orientacion-profesional": [
      {
        title: "Hablar en público",
        description: "Me gustaría aprender a hablar en público.",
        prompt: "Necesito consejos prácticos y ejercicios para mejorar mis habilidades de hablar en público, especialmente para presentaciones profesionales."
      },
      {
        title: "Pedir ascenso",
        description: "Ayúdame a plantearle a mi jefe un ascenso.",
        prompt: "¿Cómo puedo preparar una conversación efectiva con mi jefe para solicitar un ascenso? Llevo 2 años en la empresa con buenos resultados."
      },
      {
        title: "Entrevista conductual",
        description: "¿Cómo me preparo para una entrevista con preguntas conductuales?",
        prompt: "Ayúdame a preparar respuestas para preguntas conductuales comunes en entrevistas de trabajo, usando el método STAR."
      },
      {
        title: "Encontrar mentor",
        description: "Aconséjame cómo puedo encontrar un mentor.",
        prompt: "¿Cuáles son las mejores estrategias para encontrar y aproximarse a un potencial mentor en mi campo profesional?"
      }
    ],
    "asistente-programacion": [
      {
        title: "Revisar código",
        description: "Comprueba que mis deberes de programación están bien.",
        prompt: "¿Podrías revisar mi código para asegurar que cumple con las mejores prácticas y no tiene errores? Necesito una revisión detallada."
      },
      {
        title: "Actualizar sitio web",
        description: "Ayúdame a actualizar el código de seguimiento de mi sitio web.",
        prompt: "Necesito ayuda para implementar y actualizar el código de seguimiento en mi sitio web. ¿Podrías guiarme en el proceso?"
      },
      {
        title: "Crear aplicación",
        description: "Crea una aplicación sencilla para mi empresa.",
        prompt: "Necesito crear una aplicación básica para mi empresa. ¿Podrías ayudarme con la estructura y el code inicial?"
      },
      {
        title: "Bucle en Python",
        description: "¿Cómo puedo crear un bucle en una lista de elementos en Python?",
        prompt: "Necesito ayuda para entender y crear un bucle que procese elementos en una lista usando Python. ¿Podrías explicarme las diferentes opciones?"
      }
    ],
    "tutor-personal": [
      {
        title: "Números binarios",
        description: "¿Qué son los números binarios?",
        prompt: "¿Podrías explicarme qué son los números binarios, cómo funcionan y para qué se utilizan en la computación?"
      },
      {
        title: "Caída Imperio Romano",
        description: "Explica qué factores llevaron a la caída del Imperio romano.",
        prompt: "¿Cuáles fueron los principales factores políticos, económicos y sociales que contribuyeron a la caída del Imperio Romano?"
      },
      {
        title: "Fotosíntesis",
        description: "¿Cómo funciona la fotosíntesis?",
        prompt: "¿Podrías explicar el proceso de la fotosíntesis, sus etapas y su importancia para la vida en la Tierra?"
      },
      {
        title: "Orgullo y prejuicio",
        description: "He terminado de leer Orgullo y prejuicio. ¿Me ayudas a repasar los temas y personajes clave?",
        prompt: "Necesito analizar los temas principales, personajes y simbolismo en Orgullo y prejuicio de Jane Austen. ¿Podrías ayudarme con un análisis detallado?"
      }
    ],
    "revision-escritura": [
      {
        title: "Corrección gramatical",
        description: "Corrige los errores gramaticales.",
        prompt: "¿Podrías revisar este texto y corregir cualquier error gramatical, ortográfico o de puntuación?"
      },
      {
        title: "Adaptar estilo",
        description: "Adapta este texto a una guía de estilo específica.",
        prompt: "Necesito adaptar este texto para que cumpla con una guía de estilo específica. ¿Podrías ayudarme a reformularlo?"
      },
      {
        title: "Clarificar frase",
        description: "Reescribe esta frase para hacerla más clara.",
        prompt: "¿Podrías ayudarme a reescribir esta frase para mejorar su claridad y comprensión?"
      },
      {
        title: "Mejorar fluidez",
        description: "Mejora la fluidez de las frases, la elección de palabras y la coherencia de estilo general de este artículo.",
        prompt: "¿Podrías revisar este artículo para mejorar su fluidez, elección de palabras y mantener una coherencia estilística?"
      }
    ],
    "arte-diseno": [
      {
        title: "Paleta de colores",
        description: "Ayúdame a crear una paleta de colores armoniosa.",
        prompt: "Necesito crear una paleta de colores para un proyecto de diseño con temática minimalista y moderna. ¿Podrías sugerir una combinación de colores y explicar por qué funcionarían bien juntos?"
      },
      {
        title: "Composición fotográfica",
        description: "Consejos para mejorar mis fotografías.",
        prompt: "¿Podrías darme consejos avanzados sobre composición fotográfica para mejorar mis fotos de paisajes urbanos? Me interesa especialmente aprender sobre la regla de los tercios y las líneas principales."
      },
      {
        title: "Diseño de logo",
        description: "Ideas para crear un logo memorable.",
        prompt: "Necesito ideas para diseñar un logo para mi startup de tecnología sostenible. Busco algo moderno pero que transmita compromiso con el medio ambiente."
      },
      {
        title: "Ilustración digital",
        description: "Técnicas de ilustración digital para principiantes.",
        prompt: "Soy principiante en ilustración digital. ¿Podrías guiarme sobre las técnicas básicas, herramientas recomendadas y primeros pasos para crear ilustraciones atractivas?"
      }
    ],
    "sostenibilidad-ambiental": [
      {
        title: "Huerto urbano",
        description: "Cómo crear un huerto en casa.",
        prompt: "Quiero empezar un huerto urbano en mi balcón de 2x3 metros. ¿Qué plantas son ideales para principiantes y qué necesito para comenzar?"
      },
      {
        title: "Reciclaje creativo",
        description: "Ideas para reutilizar objetos cotidianos.",
        prompt: "Busco ideas creativas para reutilizar envases de plástico y vidrio. ¿Qué proyectos de upcycling recomiendas para principiantes?"
      },
      {
        title: "Consumo responsable",
        description: "Guía para un estilo de vida más sostenible.",
        prompt: "¿Podrías sugerir cambios prácticos en mi rutina diaria para reducir mi huella de carbono y vivir de manera más sostenible?"
      },
      {
        title: "Energía renovable",
        description: "Opciones de energía limpia para el hogar.",
        prompt: "Me interesa implementar energía solar en mi casa. ¿Podrías explicar las opciones disponibles, costos aproximados y beneficios a largo plazo?"
      }
    ],
    "musica-audio": [
      {
        title: "Producción musical",
        description: "Consejos para mejorar mis mezclas.",
        prompt: "Soy productor musical principiante. ¿Podrías darme consejos sobre ecualización y mezcla para lograr un sonido más profesional?"
      },
      {
        title: "Composición musical",
        description: "Ayuda para crear melodías originales.",
        prompt: "Quiero componer mi primera canción. ¿Podrías guiarme sobre estructura musical básica, progresiones de acordes comunes y consejos para crear melodías memorables?"
      },
      {
        title: "Selección de equipo",
        description: "Recomendaciones de equipamiento de audio.",
        prompt: "Busco montar un pequeño estudio de grabación casero. ¿Qué equipo básico necesito para empezar (interfaz de audio, micrófono, monitores) con un presupuesto limitado?"
      },
      {
        title: "Técnicas vocales",
        description: "Ejercicios para mejorar el canto.",
        prompt: "¿Podrías sugerir ejercicios diarios de calentamiento vocal y técnicas para mejorar mi rango vocal y control de la respiración?"
      }
    ],
    "marketing-digital": [
      {
        title: "Estrategia de contenidos",
        description: "Desarrolla un plan de contenidos efectivo.",
        prompt: "Necesito crear una estrategia de contenidos para redes sociales que aumente el engagement. ¿Podrías ayudarme con un plan mensual?"
      },
      {
        title: "SEO básico",
        description: "Mejora el posicionamiento de tu web.",
        prompt: "¿Cuáles son las mejores prácticas actuales de SEO para mejorar el ranking de mi sitio web en los motores de búsqueda?"
      },
      {
        title: "Email marketing",
        description: "Optimiza tus campañas de email.",
        prompt: "¿Cómo puedo mejorar la tasa de apertura y conversión de mis newsletters? Necesito consejos para crear asuntos atractivos y contenido relevante."
      },
      {
        title: "Análisis de métricas",
        description: "Interpreta datos de marketing digital.",
        prompt: "¿Cuáles son los KPIs más importantes que debo monitorear en mi estrategia de marketing digital y cómo interpretarlos correctamente?"
      }
    ],
    "trafico-web": [
      {
        title: "Google Ads",
        description: "Optimiza tus campañas publicitarias.",
        prompt: "Necesito ayuda para optimizar mis campañas de Google Ads. ¿Cómo puedo mejorar el ROI y reducir el CPC?"
      },
      {
        title: "Facebook Ads",
        description: "Mejora tu publicidad en redes sociales.",
        prompt: "¿Cuáles son las mejores prácticas para crear campañas efectivas en Facebook Ads? Necesito mejorar la segmentación y el rendimiento."
      },
      {
        title: "Análisis de conversión",
        description: "Optimiza el embudo de conversión.",
        prompt: "¿Cómo puedo identificar y resolver los cuellos de botella en mi embudo de conversión para aumentar las ventas?"
      },
      {
        title: "Retargeting",
        description: "Estrategias de remarketing efectivas.",
        prompt: "Necesito desarrollar una estrategia de retargeting efectiva. ¿Cuáles son las mejores prácticas y plataformas para implementarla?"
      }
    ],
    "blockchain": [
      {
        title: "Smart Contracts",
        description: "Desarrollo de contratos inteligentes.",
        prompt: "¿Podrías explicarme los conceptos básicos para crear y auditar smart contracts en Ethereum? Necesito entender las mejores prácticas de seguridad."
      },
      {
        title: "DeFi",
        description: "Finanzas descentralizadas.",
        prompt: "¿Cómo funcionan los protocolos DeFi y cuáles son los riesgos y oportunidades en el ecosistema actual?"
      },
      {
        title: "NFTs",
        description: "Tokens no fungibles.",
        prompt: "Quiero crear y vender NFTs. ¿Cuál es el proceso completo, desde la creación hasta la comercialización en los marketplaces?"
      },
      {
        title: "Consenso blockchain",
        description: "Mecanismos de consenso.",
        prompt: "¿Podrías explicar las diferencias entre PoW, PoS y otros mecanismos de consenso en blockchain?"
      }
    ],
    "ciberseguridad": [
      {
        title: "Pentesting",
        description: "Tests de penetración básicos.",
        prompt: "¿Cuáles son los pasos básicos para realizar un test de penetración ético? Necesito aprender metodologías y herramientas fundamentales."
      },
      {
        title: "Análisis de malware",
        description: "Identificación de software malicioso.",
        prompt: "¿Cómo puedo analizar y detectar malware de manera segura? Necesito conocer las herramientas y técnicas básicas."
      },
      {
        title: "Seguridad web",
        description: "Protección de aplicaciones web.",
        prompt: "¿Cuáles son las mejores prácticas actuales para proteger una aplicación web contra vulnerabilidades comunes como XSS y SQL Injection?"
      },
      {
        title: "Respuesta a incidentes",
        description: "Gestión de brechas de seguridad.",
        prompt: "¿Cuál es el protocolo recomendado para responder a un incidente de seguridad? Necesito un plan paso a paso."
      }
    ],
    "fotografia-visual": [
      {
        title: "Fotografía nocturna",
        description: "Tips para fotos nocturnas impresionantes.",
        prompt: "Quiero mejorar mis fotografías nocturnas. ¿Podrías explicar las configuraciones de cámara ideales y técnicas para capturar la luz de la ciudad y las estrellas?"
      },
      {
        title: "Edición de fotos",
        description: "Guía de post-procesamiento fotográfico.",
        prompt: "Necesito consejos para editar mis fotos de manera profesional. ¿Qué ajustes básicos debería hacer para mejorar el color, contraste y nitidez sin sobre-procesar las images?"
      },
      {
        title: "Retratos naturales",
        description: "Cómo capturar retratos auténticos.",
        prompt: "Busco consejos para hacer retratos más naturales y expresivos. ¿Qué técnicas de iluminación y poses recomiendas para capturar la personalidad del sujeto?"
      },
      {
        title: "Fotografía de productos",
        description: "Técnicas para fotografía comercial.",
        prompt: "Necesito fotografiar productos para mi tienda online. ¿Podrías explicar cómo crear un setup básico de iluminación y consejos para destacar los detalles del producto?"
      }
    ]
  };

  const handleSectionClick = (section: string) => {
    setSelectedSection(selectedSection === section ? null : section);
  };

  const handlePromptSelect = (prompt: string) => {
    if (onPromptSelect) {
      onPromptSelect(prompt);
      onClose();
    }
  };
  return (
    <>
      {showOiaiGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowOiaiGuide(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-neutral-800 scrollbar-none [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm z-50 -mx-6 px-6 border-b border-neutral-200 dark:border-neutral-800 h-[60px]">
                <div className="flex items-center gap-3 h-full">
                  <Brain weight="duotone" className="w-8 h-8 text-[#F48120]" />
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Guía de etherOI</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  shape="square"
                  className="bg-white/95 dark:bg-gray-800/95 border-2 border-[#F48120]/20 dark:border-[#F48120]/10 text-[#F48120] hover:text-white hover:bg-gradient-to-br hover:from-[#F48120] hover:to-purple-500 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-[#F48120]/10 hover:shadow-[#F48120]/20"
                  onClick={() => setShowOiaiGuide(false)}
                >
                  <X weight="bold" size={20} />
                </Button>
              </div>

              <div className="space-y-8">
                {/* Sección 1: Introducción */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">¿Qué es oiai en etherOI?</h3>
                  <p className="text-neutral-600 dark:text-neutral-300">
                    oiai es un asistente de IA personalizable dentro de etherOI que te ayuda a realizar tareas específicas. Puedes Crear Asistente IA personalizados para diferentes propósitos y necesidades.
                  </p>
                </div>

                {/* Sección 2: Componentes Clave */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Componentes clave de un oiai efectivo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 space-y-2 bg-gradient-to-br from-[#F48120]/5 to-transparent border-[#F48120]/20">
                      <h4 className="font-medium text-[#F48120]">Persona</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">Define el rol y comportamiento del oiai</p>
                    </Card>
                    <Card className="p-4 space-y-2 bg-gradient-to-br from-purple-500/5 to-transparent border-purple-500/20">
                      <h4 className="font-medium text-purple-500">Tarea</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">Especifica qué debe hacer o crear el oiai</p>
                    </Card>
                    <Card className="p-4 space-y-2 bg-gradient-to-br from-blue-500/5 to-transparent border-blue-500/20">
                      <h4 className="font-medium text-blue-500">Contexto</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">Proporciona información de fondo relevante</p>
                    </Card>
                    <Card className="p-4 space-y-2 bg-gradient-to-br from-green-500/5 to-transparent border-green-500/20">
                      <h4 className="font-medium text-green-500">Formato</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300">Define la estructura deseada de las respuestas</p>
                    </Card>
                  </div>
                </div>

                {/* Sección 3: Pasos para Crear */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Pasos para crear un oiai</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">1</div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-neutral-900 dark:text-white">Define el propósito</h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Establece claramente qué quieres que haga tu oiai y qué problemas debe resolver.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">2</div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-neutral-900 dark:text-white">Escribe las instrucciones</h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Proporciona instrucciones detalladas incluyendo persona, tarea, contexto y formato deseado.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F48120]/10 text-[#F48120]">3</div>
                      <div className="space-y-1">
                        <h5 className="font-medium text-neutral-900 dark:text-white">Prueba y refina</h5>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">Realiza pruebas con diferentes prompts y ajusta las instrucciones según sea necesario.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 4: Mejores Prácticas */}
                <div className="flex gap-4">
                  <div className="flex-1 space-y-4">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Mejores prácticas</h3>
                    <ul className="space-y-2 text-neutral-600 dark:text-neutral-300">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                        <span className="text-sm">Sé específico en tus instrucciones</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                        <span className="text-sm">Incluye ejemplos cuando sea posible</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                        <span className="text-sm">Define límites claros de lo que debe y no debe hacer</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#F48120]"></div>
                        <span className="text-sm">Mantén las instrucciones concisas pero completas</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => {
                        setShowOiaiGuide(false);
                        setShowOIAICreator(true);
                      }}
                      className="w-full h-full flex items-center justify-center bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5
                                  hover:from-[#F48120]/20 hover:to-purple-500/20 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10
                                  border border-[#F48120]/20 dark:border-[#F48120]/10 rounded-xl
                                  transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                                  group relative overflow-hidden animate-pulse hover:animate-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#F48120]/20 to-purple-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex flex-col items-center gap-3 p-4">
                        <Brain weight="duotone" className="w-8 h-8 text-[#F48120] group-hover:scale-110 transition-transform duration-300" />
                        <span className="text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:opacity-90">Crear Asistente IA</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showOIAICreator && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-4xl mx-auto my-8 max-h-[85vh] overflow-hidden relative transform transition-all duration-300 scale-100 opacity-100">
            <OIAICreator
              onCopyContent={(content) => {

              }}
              onClose={() => setShowOIAICreator(false)}
            />
          </div>
        </div>
      )}

      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out shadow-2xl overflow-hidden',
          theme === 'dark' ? 'bg-gradient-to-b from-neutral-900 to-neutral-950' : 'bg-gradient-to-b from-white to-gray-100',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <Robot weight="duotone" className="text-[#F48120] h-7 w-7" />
                <span className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Asistente IA</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                className="rounded-xl hover:bg-white/10 text-neutral-400 hover:text-white transition-all duration-300 transform hover:rotate-90"
                onClick={onClose}
              >
                <X weight="bold" size={20} />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex flex-col h-full space-y-6">

              {/* Sección de Prompts del Sistema */}
              <div className="px-2 py-2">
                <button
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-neutral-700 dark:text-neutral-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-gradient-to-r hover:from-orange-50 hover:to-purple-50 dark:hover:from-orange-500/10 dark:hover:to-purple-500/10 rounded-lg transition-all duration-300"
                  onClick={() => setShowSystemPromptDashboard(true)}
                >
                  <ChatText size={20} />
                  <span>Prompts del Sistema</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* Sección de Asistente IA */}
                <div className="flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Asistente IA</span>
                </div>
                <div className="space-y-2 px-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20"
                    onClick={() => { setShowOiaiGuide(true); onClose(); }}
                  >
                    <Question weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                    Guía etherOI
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] hover:bg-[#F48120]/10 hover:text-[#F48120] dark:hover:bg-[#F48120]/20"
                    onClick={() => { setShowOIAICreator(true); onClose(); }}
                    disabled={true}
                  >
                    <PlusCircle weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                    Crear Asistente IA
                  </Button>
                </div>

                {/* Sección de Agentes */}
                <div
                  onClick={() => setIsAgentsExpanded(!isAgentsExpanded)}
                  className="flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl
                    hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70
                    transform hover:scale-[0.99] active:scale-[0.97]
                    cursor-pointer transition-all duration-200 group"
                >
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Agentes Inteligentes</span>
                  <div className="p-1 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 group-hover:bg-neutral-300/50 dark:group-hover:bg-neutral-600/50 transition-colors">
                    <List weight="bold" className={cn("w-4 h-4 transition-transform duration-200 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white", isAgentsExpanded ? "rotate-180" : "")} />
                  </div>
                </div>
                <div className={cn("space-y-3 transition-all duration-200", isAgentsExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openToolsInterface'));
                      onClose();
                    }}
                  >
                    <Robot weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                    Crear Agente Inteligente
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAgentDashboard(true);
                    }}
                  >
                    <Users weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                    Ver Agentes
                  </Button>
                </div>

                {/* Sección de Plantillas */}
                <div
                  onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}
                  className="flex items-center justify-between p-3 bg-neutral-100/50 dark:bg-neutral-800/50 rounded-xl
                    hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70
                    transform hover:scale-[0.99] active:scale-[0.97]
                    cursor-pointer transition-all duration-200 group"
                >
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">Plantillas de Mensajes IA</span>
                  <div className="p-1 rounded-lg bg-neutral-200/50 dark:bg-neutral-700/50 group-hover:bg-neutral-300/50 dark:group-hover:bg-neutral-600/50 transition-colors">
                    <List weight="bold" className={cn("w-4 h-4 transition-transform duration-200 text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-800 dark:group-hover:text-white", isTemplatesExpanded ? "rotate-180" : "")} />
                  </div>
                </div>
                <div className={cn("space-y-3 transition-all duration-200", isTemplatesExpanded ? "opacity-100" : "opacity-0 h-0 overflow-hidden")}>
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('exploracion-ideas')}
                    >
                      <Lightbulb weight="duotone" className="mr-3 h-5 w-5 text-[#F48120]" />
                      Exploración de ideas
                    </Button>
                    {selectedSection === 'exploracion-ideas' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['exploracion-ideas'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('orientacion-profesional')}
                    >
                      <GraduationCap weight="duotone" className="mr-3 h-5 w-5 text-purple-500" />
                      Orientación profesional
                    </Button>
                    {selectedSection === 'orientacion-profesional' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['orientacion-profesional'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('asistente-programacion')}
                    >
                      <Code weight="duotone" className="mr-3 h-5 w-5 text-green-500" />
                      Asistente de programación
                    </Button>
                    {selectedSection === 'asistente-programacion' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['asistente-programacion'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('tutor-personal')}
                    >
                      <Brain weight="duotone" className="mr-3 h-5 w-5 text-blue-500" />
                      Tutor personal
                    </Button>
                    {selectedSection === 'tutor-personal' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['tutor-personal'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('revision-escritura')}
                    >
                      <Pencil weight="duotone" className="mr-3 h-5 w-5 text-pink-500" />
                      Revisión de escritura
                    </Button>
                    {selectedSection === 'revision-escritura' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['revision-escritura'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('arte-diseno')}
                    >
                      <Palette weight="duotone" className="mr-3 h-5 w-5 text-yellow-500" />
                      Arte y Diseño
                    </Button>
                    {selectedSection === 'arte-diseno' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['arte-diseno'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('sostenibilidad-ambiental')}
                    >
                      <Leaf weight="duotone" className="mr-3 h-5 w-5 text-green-400" />
                      Sostenibilidad Ambiental
                    </Button>
                    {selectedSection === 'sostenibilidad-ambiental' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['sostenibilidad-ambiental'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('musica-audio')}
                    >
                      <MusicNotes weight="duotone" className="mr-3 h-5 w-5 text-purple-400" />
                      Música y Audio
                    </Button>
                    {selectedSection === 'musica-audio' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['musica-audio'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('marketing-digital')}
                    >
                      <ChartBar weight="duotone" className="mr-3 h-5 w-5 text-blue-500" />
                      Marketing Digital
                    </Button>
                    {selectedSection === 'marketing-digital' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['marketing-digital'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('trafico-web')}
                    >
                      <ChartLine weight="duotone" className="mr-3 h-5 w-5 text-green-500" />
                      Tráfico Web
                    </Button>
                    {selectedSection === 'trafico-web' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['trafico-web'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('blockchain')}
                    >
                      <Rocket weight="duotone" className="mr-3 h-5 w-5 text-orange-500" />
                      Blockchain
                    </Button>
                    {selectedSection === 'blockchain' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['blockchain'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('ciberseguridad')}
                    >
                      <ShieldCheck weight="duotone" className="mr-3 h-5 w-5 text-red-500" />
                      Ciberseguridad
                    </Button>
                    {selectedSection === 'ciberseguridad' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['ciberseguridad'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <Button
                      variant="ghost"
                      className="w-full justify-start rounded-xl py-3 transition-all duration-300 transform hover:translate-x-1 hover:scale-[1.02] cn('hover:bg-opacity-10', theme === 'dark' ? 'text-neutral-300 hover:text-white hover:bg-white' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-900')"
                      onClick={() => handleSectionClick('fotografia-visual')}
                    >
                      <Camera weight="duotone" className="mr-3 h-5 w-5 text-indigo-500" />
                      Fotografía Visual
                    </Button>
                    {selectedSection === 'fotografia-visual' && (
                      <div className="mt-2 space-y-2 pl-8">
                        {promptTemplates['fotografia-visual'].map((template, index) => (
                          <Card
                            key={index}
                            className="p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                            onClick={() => handlePromptSelect(template.prompt)}
                          >
                            <h4 className="font-medium text-sm">{template.title}</h4>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{template.description}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <AuthButton
                variant="sidebar"
                className="mt-auto"
              />
            </div>
          </nav>

          {/* Theme Toggle */}
          {/* <div className="p-4 mt-auto border-t cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-xl bg-gradient-to-r from-[#F48120]/10 to-purple-500/10 hover:from-[#F48120]/20 hover:to-purple-500/20 
                         dark:from-[#F48120]/5 dark:to-purple-500/5 dark:hover:from-[#F48120]/15 dark:hover:to-purple-500/15
                         border border-[#F48120]/20 hover:border-[#F48120]/40 dark:border-[#F48120]/10 dark:hover:border-[#F48120]/30
                         transform hover:scale-[0.98] active:scale-[0.97] transition-all duration-300
                         flex items-center justify-between gap-2 group/button"
                onClick={() => {
                  const menu = document.getElementById('settingsMenu');
                  if (menu) {
                    menu.classList.toggle('opacity-0');
                    menu.classList.toggle('invisible');
                    menu.classList.toggle('translate-y-2');
                  }
                }}
              >
                <div className="flex items-center gap-2">
                  <Wrench size={16} className="text-[#F48120]" weight="duotone" />
                  <span className="text-sm font-medium bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover/button:from-[#F48120] group-hover/button:to-purple-600">Configuración</span>
                </div>
                <List size={16} className="text-[#F48120] group-hover/button:rotate-180 transition-transform duration-300" weight="bold" />
              </Button>
              <div
                id="settingsMenu"
                className="absolute right-0 bottom-full mb-2 w-56 bg-white dark:bg-neutral-900 rounded-xl shadow-xl
                         border border-neutral-200/50 dark:border-neutral-700/50
                         backdrop-blur-lg backdrop-saturate-150
                         opacity-0 invisible -translate-y-2 transition-all duration-300 z-50"
              >
                <div className="p-2 space-y-1">
                  <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Ancho del chat</div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'narrow' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Reducido</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'default' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Normal</span>
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={() => {
                      const event = new CustomEvent('toggleChatWidth', {
                        detail: { width: 'full' }
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-[#F48120] group-hover/item:scale-125 transition-transform duration-300"></div>
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">Completo</span>
                  </button>
                  <div className="my-2 border-t border-neutral-200 dark:border-neutral-700"></div>
                  <div className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 font-medium">Tema</div>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg
                             text-neutral-700 dark:text-neutral-300
                             hover:bg-gradient-to-r hover:from-[#F48120]/10 hover:to-purple-500/10
                             dark:hover:from-[#F48120]/5 dark:hover:to-purple-500/5
                             transition-all duration-300 transform hover:translate-x-1 group/item"
                    onClick={onThemeChange}
                  >
                    {theme === "dark" ?
                      <Sun weight="duotone" className="w-5 h-5 text-amber-400" /> :
                      <Moon weight="duotone" className="w-5 h-5 text-blue-400" />
                    }
                    <span className="font-medium group-hover/item:text-[#F48120] transition-colors duration-300">
                      {theme === "dark" ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div> */}
          <div className="mt-4 text-xs text-center cn('text-neutral-500 hover:text-neutral-400 transition-colors duration-300', theme === 'dark' ? 'text-neutral-500' : 'text-gray-500')">
            Potenciado por Tecnología IA Avanzada
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      <AuthPopup />
      <AgentDashboard isOpen={showAgentDashboard} onClose={() => setShowAgentDashboard(false)} />
      <SystemPromptDashboard
        isOpen={showSystemPromptDashboard}
        onClose={() => setShowSystemPromptDashboard(false)}
      />
    </>
  );
}
