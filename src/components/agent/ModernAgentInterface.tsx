import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple, Plus, ArrowRight, Brain, Lightbulb, Code, ChartLine, CaretRight } from '@phosphor-icons/react';
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

export function ModernAgentInterface({ isOpen, onClose }: ModernAgentInterfaceProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

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
        { label: 'Ver archivos recientes', action: () => console.log('Ver archivos') }
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
        { label: 'Crear evento', action: () => console.log('Crear evento') }
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
        { label: 'Ver bandeja de entrada', action: () => console.log('Ver emails') }
      ]
    }
  ];

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}