import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServicePopupProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClose: () => void;
}

const ServicePopup: React.FC<ServicePopupProps> = ({ title, description, icon, onClose }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
    onClick={onClose}
  >
    <Card className="w-full max-w-md p-6 bg-white dark:bg-neutral-900 relative shadow-xl border border-neutral-200 dark:border-neutral-800 rounded-2xl">
      <Button
        variant="ghost"
        size="sm"
        className="absolute right-4 top-4 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full"
        onClick={onClose}
      >
        <X size={20} />
      </Button>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl text-purple-600 dark:text-purple-400">
          {icon}
        </div>
        <h3 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{title}</h3>
      </div>
      <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
    </Card>
  </motion.div>
);

export function AgentInterface({ isOpen, onClose }: AgentInterfaceProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const services = [
    {
      id: 'drive',
      title: 'Google Drive',
      description: 'Mostrar archivos recientemente añadidos',
      icon: <Files size={24} />
    },
    {
      id: 'calendar',
      title: 'Google Calendar',
      description: 'Vista previa de mis reuniones',
      icon: <Calendar size={24} />
    },
    {
      id: 'gmail',
      title: 'Gmail',
      description: 'Resaltar entrevistas',
      icon: <EnvelopeSimple size={24} />
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        >
          <Card className="w-full max-w-lg bg-white dark:bg-neutral-900 relative overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Mi Nuevo Agente</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4">Instrucciones</h3>
                <div className="space-y-4">
                  {services.map((service) => (
                    <Button
                      key={service.id}
                      variant="secondary"
                      className="w-full justify-start gap-3 p-4"
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                        {service.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{service.title}</div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {service.description}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Incluir Conocimiento</h3>
                <div className="flex gap-2">
                  {services.map((service) => (
                    <Button
                      key={service.id}
                      variant="ghost"
                      className="p-2"
                      onClick={() => setSelectedService(service.id)}
                    >
                      <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 dark:from-purple-500/10 dark:to-pink-500/10 rounded-xl text-purple-600 dark:text-purple-400">
                        {service.icon}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {selectedService && (
            <ServicePopup
              title={services.find(s => s.id === selectedService)?.title || ''}
              description={services.find(s => s.id === selectedService)?.description || ''}
              icon={services.find(s => s.id === selectedService)?.icon}
              onClose={() => setSelectedService(null)}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}