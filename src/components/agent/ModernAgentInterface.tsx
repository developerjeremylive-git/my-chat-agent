import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple, Plus, ArrowRight, Brain, Lightbulb, Code, ChartLine, CaretRight, Palette, ChartBar, Rocket, Globe, Camera, Robot, MusicNotes, ShieldCheck, MagnifyingGlass } from '@phosphor-icons/react';
import { RecentFilesDashboard } from '@/components/dashboard/RecentFilesDashboard';
import { CalendarEventDashboard } from '@/components/calendar/CalendarEventDashboard';
import { GmailDashboard } from '@/components/email/GmailDashboard';
import { motion, AnimatePresence } from 'framer-motion';

interface ModernAgentInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

interface ServicePopupProps {
  service: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    features?: string[];
    actions?: { label: string; action: () => void }[];
  };
  onClose: () => void;
}

interface KnowledgePopupProps {
  source: {
    icon: React.ReactNode;
    label: string;
  };
  onClose: () => void;
}

interface NewServicePopupProps {
  onClose: () => void;
  onSave: (service: {
    id: string;
    icon: React.ReactNode;
    title: string;
    description: string;
    features: string[];
    actions: { label: string; action: () => void }[];
  }) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ icon, title, description, onClick }) => (
  <Card
    className="p-4 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300 border border-neutral-200 dark:border-neutral-700 hover:border-[#F48120] dark:hover:border-[#F48120] group"
    onClick={onClick}
  >
    <div className="flex items-start gap-4">
      <div className="p-3 bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 rounded-xl text-[#F48120] group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-1 bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">{title}</h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
      <ArrowRight
        size={20}
        className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
      />
    </div>
  </Card>
);

const ServicePopup: React.FC<ServicePopupProps> = ({ service, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.95, opacity: 0 }}
      className="w-full max-w-lg"
      onClick={(e) => e.stopPropagation()}
    >
      <Card className="bg-white dark:bg-neutral-900 p-6 relative overflow-hidden border border-neutral-200 dark:border-neutral-800">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        <div className="flex items-center gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 rounded-xl text-[#F48120]">
            {service.icon}
          </div>
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-1">
              {service.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400">{service.description}</p>
          </div>
        </div>

        {service.features && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold mb-3">Características principales</h4>
            <div className="space-y-2">
              {service.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                  <CaretRight size={16} className="text-[#F48120]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {service.actions && (
          <div className="flex flex-wrap gap-3">
            {service.actions.map((action, index) => (
              <Button
                key={index}
                onClick={action.action}
                className="flex items-center gap-2 bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-opacity"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  </motion.div>
);

const KnowledgePopup: React.FC<KnowledgePopupProps> = ({ source, onClose }) => {
  const getThemeStyles = () => {
    switch (source.label) {
      case 'IA General':
        return {
          gradient: 'from-blue-500 to-purple-600',
          bgGradient: 'from-blue-500/20 to-purple-600/20 dark:from-blue-500/10 dark:to-purple-600/10',
          iconColor: 'text-blue-500',
          buttonGradient: 'from-blue-500 to-purple-600',
          description: 'Explora el futuro de la inteligencia artificial',
          recursos: [
            {
              title: 'Fundamentos de IA',
              description: 'Conceptos básicos y teoría fundamental',
              link: '#',
              icon: <Brain size={20} />
            },
            {
              title: 'Modelos Avanzados',
              description: 'Arquitecturas y frameworks modernos',
              link: '#',
              icon: <Robot size={20} />
            },
            {
              title: 'Ética en IA',
              description: 'Principios y mejores prácticas',
              link: '#',
              icon: <ShieldCheck size={20} />
            }
          ],
          herramientas: [
            {
              title: 'Asistente de IA',
              description: 'Tu compañero inteligente',
              status: 'disponible',
              icon: <Brain size={20} />
            },
            {
              title: 'Procesamiento NLP',
              description: 'Análisis de lenguaje natural',
              status: 'beta',
              icon: <Robot size={20} />
            },
            {
              title: 'Visión por Computadora',
              description: 'Análisis de imágenes',
              status: 'próximamente',
              icon: <ShieldCheck size={20} />
            }
          ]
        };
      case 'Desarrollo':
        return {
          gradient: 'from-emerald-500 to-teal-600',
          bgGradient: 'from-emerald-500/20 to-teal-600/20 dark:from-emerald-500/10 dark:to-teal-600/10',
          iconColor: 'text-emerald-500',
          buttonGradient: 'from-emerald-500 to-teal-600',
          description: 'Potencia tu desarrollo con herramientas avanzadas',
          recursos: [
            {
              title: 'Arquitectura Software',
              description: 'Patrones y mejores prácticas',
              link: '#',
              icon: <Code size={20} />
            },
            {
              title: 'DevOps & Cloud',
              description: 'Infraestructura y despliegue',
              link: '#',
              icon: <Globe size={20} />
            },
            {
              title: 'Seguridad',
              description: 'Protección y vulnerabilidades',
              link: '#',
              icon: <ShieldCheck size={20} />
            }
          ],
          herramientas: [
            {
              title: 'IDE Inteligente',
              description: 'Desarrollo asistido por IA',
              status: 'disponible',
              icon: <Code size={20} />
            },
            {
              title: 'Testing Automático',
              description: 'Pruebas y calidad de código',
              status: 'beta',
              icon: <Robot size={20} />
            },
            {
              title: 'Optimizador',
              description: 'Mejora de rendimiento',
              status: 'próximamente',
              icon: <Rocket size={20} />
            }
          ]
        };
      case 'Creatividad':
        return {
          gradient: 'from-pink-500 to-rose-600',
          bgGradient: 'from-pink-500/20 to-rose-600/20 dark:from-pink-500/10 dark:to-rose-600/10',
          iconColor: 'text-pink-500',
          buttonGradient: 'from-pink-500 to-rose-600',
          description: 'Libera tu potencial creativo',
          recursos: [
            {
              title: 'Diseño UI/UX',
              description: 'Interfaces y experiencias',
              link: '#',
              icon: <Palette size={20} />
            },
            {
              title: 'Multimedia',
              description: 'Audio y video digital',
              link: '#',
              icon: <Camera size={20} />
            },
            {
              title: 'Arte Digital',
              description: 'Ilustración y animación',
              link: '#',
              icon: <MusicNotes size={20} />
            }
          ],
          herramientas: [
            {
              title: 'Editor Creativo',
              description: 'Suite de diseño integral',
              status: 'disponible',
              icon: <Palette size={20} />
            },
            {
              title: 'Generador de Arte',
              description: 'Creación asistida por IA',
              status: 'beta',
              icon: <Camera size={20} />
            },
            {
              title: 'Estudio Musical',
              description: 'Producción de audio',
              status: 'próximamente',
              icon: <MusicNotes size={20} />
            }
          ]
        };
      case 'Análisis':
        return {
          gradient: 'from-amber-500 to-orange-600',
          bgGradient: 'from-amber-500/20 to-orange-600/20 dark:from-amber-500/10 dark:to-orange-600/10',
          iconColor: 'text-amber-500',
          buttonGradient: 'from-amber-500 to-orange-600',
          description: 'Descubre insights poderosos en tus datos',
          recursos: [
            {
              title: 'Análisis Predictivo',
              description: 'Modelos y pronósticos',
              link: '#',
              icon: <ChartLine size={20} />
            },
            {
              title: 'Visualización',
              description: 'Gráficos y dashboards',
              link: '#',
              icon: <ChartBar size={20} />
            },
            {
              title: 'Big Data',
              description: 'Procesamiento a escala',
              link: '#',
              icon: <Globe size={20} />
            }
          ],
          herramientas: [
            {
              title: 'Analytics Suite',
              description: 'Análisis empresarial',
              status: 'disponible',
              icon: <ChartLine size={20} />
            },
            {
              title: 'Data Mining',
              description: 'Exploración de datos',
              status: 'beta',
              icon: <ChartBar size={20} />
            },
            {
              title: 'Predictor IA',
              description: 'Modelos predictivos',
              status: 'próximamente',
              icon: <Brain size={20} />
            }
          ]
        };
      default:
        return {
          gradient: 'from-[#F48120] to-purple-500',
          bgGradient: 'from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10',
          iconColor: 'text-[#F48120]',
          buttonGradient: 'from-[#F48120] to-purple-500',
          description: 'Explora recursos y herramientas especializadas',
          recursos: [],
          herramientas: []
        };
    }
  };

  const themeStyles = getThemeStyles();
  const recursos = themeStyles.recursos;
  const herramientas = themeStyles.herramientas;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 relative h-[600px] flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-4 top-4 rounded-full hover:bg-${themeStyles.gradient} hover:text-white`}
              onClick={onClose}
            >
              <X size={20} />
            </Button>

            <div className="flex items-center gap-4 mb-6">
              <div className={`p-4 bg-gradient-to-br ${themeStyles.bgGradient} rounded-xl ${themeStyles.iconColor}`}>
                {source.icon}
              </div>
              <div>
                <h3 className={`text-2xl font-bold bg-gradient-to-r ${themeStyles.gradient} bg-clip-text text-transparent mb-1`}>
                  {source.label}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {themeStyles.description}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6 p-4">
                {/* Sección de Recursos */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Recursos Especializados</h4>
                  <div className="space-y-3">
                    {recursos.map((recurso, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-${themeStyles.iconColor} transition-colors group cursor-pointer bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${themeStyles.bgGradient} ${themeStyles.iconColor}`}>
                            {recurso.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold group-hover:${themeStyles.iconColor} transition-colors`}>{recurso.title}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{recurso.description}</p>
                          </div>
                          <ArrowRight size={20} className={`${themeStyles.iconColor} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sección de Herramientas */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Herramientas Disponibles</h4>
                  <div className="space-y-3">
                    {herramientas.map((herramienta, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-${themeStyles.iconColor} transition-colors group cursor-pointer bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${themeStyles.bgGradient} ${themeStyles.iconColor}`}>
                            {herramienta.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className={`font-semibold group-hover:${themeStyles.iconColor} transition-colors`}>{herramienta.title}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">{herramienta.description}</p>
                          </div>
                          <span className={`text-xs px-3 py-1 rounded-full ${herramienta.status === 'disponible' ? `bg-gradient-to-r ${themeStyles.gradient} text-white` :
                            herramienta.status === 'beta' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                            }`}>
                            {herramienta.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

const NewServicePopup: React.FC<NewServicePopupProps> = ({ onClose, onSave }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    features: [''],
    actions: [{ label: '', action: () => { } }]
  });

  const handleSave = () => {
    onSave({
      ...formData,
      id: formData.title.toLowerCase().replace(/\s+/g, '-'),
      icon: <Files size={24} weight="duotone" />
    });
    onClose();
  };

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const addAction = () => {
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, { label: '', action: () => { } }]
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
          <div className="p-6 relative h-[600px] flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={onClose}
            >
              <X size={20} />
            </Button>

            <div className="mb-6">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-1">
                Nuevo Servicio
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400">
                Configura un nuevo servicio personalizado
              </p>
            </div>

            <div className="flex justify-between mb-4">
              {[1, 2, 3].map((stepNumber) => (
                <div
                  key={stepNumber}
                  className={`flex-1 h-2 rounded-full mx-1 ${step >= stepNumber ? 'bg-gradient-to-r from-[#F48120] to-purple-500' : 'bg-neutral-200 dark:bg-neutral-700'}`}
                />
              ))}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-2">
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nombre del Servicio</label>
                    <input
                      type="text"
                      className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Descripción</label>
                    <textarea
                      className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent min-h-[120px]"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Características</label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                            value={feature}
                            onChange={(e) => {
                              const newFeatures = [...formData.features];
                              newFeatures[index] = e.target.value;
                              setFormData(prev => ({ ...prev, features: newFeatures }));
                            }}
                            placeholder="Ingresa una característica del servicio"
                          />
                          {index === formData.features.length - 1 && (
                            <Button
                              variant="ghost"
                              onClick={addFeature}
                              className="text-[#F48120] hover:bg-[#F48120]/10 flex-shrink-0"
                            >
                              <Plus size={20} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Acciones</label>
                    <div className="space-y-2">
                      {formData.actions.map((action, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Nombre de la acción"
                            className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent"
                            value={action.label}
                            onChange={(e) => {
                              const newActions = [...formData.actions];
                              newActions[index] = { ...action, label: e.target.value };
                              setFormData(prev => ({ ...prev, actions: newActions }));
                            }}
                          />
                          {index === formData.actions.length - 1 && (
                            <Button
                              variant="ghost"
                              onClick={addAction}
                              className="text-[#F48120] hover:bg-[#F48120]/10 flex-shrink-0"
                            >
                              <Plus size={20} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200 dark:border-neutral-700 mt-4">
              {step > 1 && (
                <Button
                  onClick={() => setStep(prev => prev - 1)}
                  variant="ghost"
                  className="text-[#F48120] hover:bg-[#F48120]/10"
                >
                  Anterior
                </Button>
              )}
              <div className="flex-1" />
              <Button
                onClick={() => {
                  if (step < 3) {
                    setStep(prev => prev + 1);
                  } else {
                    handleSave();
                  }
                }}
                className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white"
              >
                {step < 3 ? 'Siguiente' : 'Guardar'}
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );

};

export function ModernAgentInterface({ isOpen, onClose }: ModernAgentInterfaceProps) {
  const [showCalendarDashboard, setShowCalendarDashboard] = useState(false);
  const [showGmailDashboard, setShowGmailDashboard] = useState(false);
  const [showRecentFiles, setShowRecentFiles] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedKnowledge, setSelectedKnowledge] = useState<number | null>(null);
  const [showNewServicePopup, setShowNewServicePopup] = useState(false);

  const services = [
    {
      id: 'drive',
      icon: <Files size={24} weight="duotone" />,
      title: 'Google Drive',
      description: 'Gestiona y accede a tus archivos de forma inteligente',
      features: [
        'Búsqueda avanzada de documentos',
        'Organización automática',
        'Compartir archivos con seguridad',
        'Integración con otras apps'
      ],
      actions: [
        { label: 'Conectar Drive', action: () => console.log('Conectar Drive') },
        { label: 'Ver archivos recientes', action: () => setShowRecentFiles(true) }
      ]
    },
    {
      id: 'calendar',
      icon: <Calendar size={24} weight="duotone" />,
      title: 'Google Calendar',
      description: 'Optimiza tu agenda y gestiona eventos eficientemente',
      features: [
        'Programación inteligente de reuniones',
        'Recordatorios personalizados',
        'Sincronización multi-dispositivo',
        'Análisis de disponibilidad'
      ],
      actions: [
        { label: 'Sincronizar calendario', action: () => console.log('Sincronizar') },
        { label: 'Crear evento', action: () => setShowCalendarDashboard(true) }
      ]
    },
    {
      id: 'gmail',
      icon: <EnvelopeSimple size={24} weight="duotone" />,
      title: 'Gmail',
      description: 'Gestiona tu correo con asistencia inteligente',
      features: [
        'Clasificación automática de emails',
        'Respuestas sugeridas',
        'Filtros inteligentes',
        'Priorización de mensajes'
      ],
      actions: [
        { label: 'Conectar Gmail', action: () => console.log('Conectar Gmail') },
        { label: 'Ver bandeja de entrada', action: () => setShowGmailDashboard(true) }
      ]
    }
  ];

  const handleAddService = (newService: any) => {
    services.push(newService);
    setShowNewServicePopup(false);
  };

  const knowledgeSources = [
    { icon: <Brain size={24} weight="duotone" />, label: 'IA General' },
    { icon: <Code size={24} weight="duotone" />, label: 'Desarrollo' },
    { icon: <Lightbulb size={24} weight="duotone" />, label: 'Creatividad' },
    { icon: <ChartLine size={24} weight="duotone" />, label: 'Análisis' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-2xl"
          >
            <Card className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                      Asistente Inteligente
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                      Potencia tu productividad con integración de servicios
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    onClick={onClose}
                  >
                    <X size={20} />
                  </Button>
                </div>

                {/* Services Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Servicios Integrados</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[#F48120] hover:bg-[#F48120]/10 rounded-lg gap-2"
                      onClick={() => setShowNewServicePopup(true)}
                    >
                      <Plus size={16} />
                      <span>Añadir servicio</span>
                    </Button>
                  </div>
                  <div className="grid gap-3">
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        icon={service.icon}
                        title={service.title}
                        description={service.description}
                        onClick={() => setSelectedService(service.id)}
                      />
                    ))}
                  </div>
                </div>

                {/* Knowledge Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Conocimiento Incluido</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {knowledgeSources.map((source, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="flex flex-col items-center gap-2 p-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl group"
                        onClick={() => setSelectedKnowledge(index)}
                      >
                        <div className="p-3 bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 rounded-xl text-[#F48120] group-hover:scale-110 transition-transform duration-300">
                          {source.icon}
                        </div>
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">{source.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {selectedService && (
            <ServicePopup
              service={services.find(s => s.id === selectedService)!}
              onClose={() => setSelectedService(null)}
            />
          )}

          {selectedKnowledge !== null && (
            <KnowledgePopup
              source={knowledgeSources[selectedKnowledge]}
              onClose={() => setSelectedKnowledge(null)}
            />
          )}

          {showNewServicePopup && (
            <NewServicePopup
              onClose={() => setShowNewServicePopup(false)}
              onSave={handleAddService}
            />
          )}
        </motion.div>
      )}
      <RecentFilesDashboard
        isOpen={showRecentFiles}
        onClose={() => setShowRecentFiles(false)}
      />
      {showCalendarDashboard && (
        <CalendarEventDashboard
          isOpen={showCalendarDashboard}
          onClose={() => setShowCalendarDashboard(false)}
        />
      )}

      {showGmailDashboard && (
        <GmailDashboard
          isOpen={showGmailDashboard}
          onClose={() => setShowGmailDashboard(false)}
        />
      )}



    </AnimatePresence>
  );

}