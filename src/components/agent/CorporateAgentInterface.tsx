import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple, CaretRight } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

interface CorporateAgentInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ServiceCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
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
      <CaretRight
        size={20}
        className="text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
      />
    </div>
  </Card>
);

export const CorporateAgentInterface: React.FC<CorporateAgentInterfaceProps> = ({ isOpen, onClose }) => {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-4xl"
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

              <div className="mb-8">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-2">
                  Mi Resumen Corporativo
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                  Accede a tus archivos, calendario y correos en un solo lugar
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ServiceCard
                  icon={<Files size={24} />}
                  title="Google Drive"
                  description="Muestra archivos recientes"
                  onClick={() => setSelectedService('drive')}
                />
                <ServiceCard
                  icon={<Calendar size={24} />}
                  title="Google Calendar"
                  description="Vista previa de reuniones"
                  onClick={() => setSelectedService('calendar')}
                />
                <ServiceCard
                  icon={<EnvelopeSimple size={24} />}
                  title="Gmail"
                  description="Resalta entrevistas"
                  onClick={() => setSelectedService('gmail')}
                />
              </div>

              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg text-neutral-900 dark:text-white">
                    Conocimiento Incluido
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['Google Drive', 'Google Calendar', 'Gmail'].map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#F48120]" />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};