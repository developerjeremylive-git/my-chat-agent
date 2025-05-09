import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, EnvelopeSimple, Star, Clock, CaretRight, DotsThreeVertical, MagnifyingGlass, FunnelSimple, ArrowsDownUp, Trash, PencilSimple, Archive, BookmarkSimple } from '@phosphor-icons/react';

interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  isStarred: boolean;
  isRead: boolean;
  labels: string[];
}

interface ConectarGmailProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialEmails: Email[] = [
  {
    id: '1',
    subject: 'Actualización del Proyecto',
    sender: 'Ana García',
    preview: 'Te envío los últimos cambios realizados en el proyecto...',
    date: '10:30 AM',
    isStarred: true,
    isRead: false,
    labels: ['Trabajo', 'Importante']
  },
  {
    id: '2',
    subject: 'Reunión de Equipo',
    sender: 'Carlos López',
    preview: 'Recordatorio: Tenemos reunión mañana a las 9:00 AM...',
    date: '9:15 AM',
    isStarred: false,
    isRead: true,
    labels: ['Reuniones']
  },
  {
    id: '3',
    subject: 'Propuesta de Diseño',
    sender: 'María Rodríguez',
    preview: 'Adjunto encontrarás la propuesta de diseño actualizada...',
    date: 'Ayer',
    isStarred: true,
    isRead: true,
    labels: ['Diseño', 'Cliente']
  },
  {
    id: '4',
    subject: 'Factura Pendiente',
    sender: 'Departamento Financiero',
    preview: 'Este es un recordatorio de la factura pendiente...',
    date: 'Ayer',
    isStarred: false,
    isRead: false,
    labels: ['Finanzas']
  }
];

export const ConectarGmail: React.FC<ConectarGmailProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const handleStarEmail = (emailId: string) => {
    setEmails(emails.map(email =>
      email.id === emailId ? { ...email, isStarred: !email.isStarred } : email
    ));
  };

  const handleSelectEmail = (emailId: string) => {
    setSelectedEmails(prev =>
      prev.includes(emailId)
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  const handleDeleteSelected = () => {
    setEmails(emails.filter(email => !selectedEmails.includes(email.id)));
    setSelectedEmails([]);
  };

  const handleArchiveSelected = () => {
    // Implementar lógica de archivo
    setSelectedEmails([]);
  };

  const handleMarkAsRead = () => {
    setEmails(emails.map(email =>
      selectedEmails.includes(email.id) ? { ...email, isRead: true } : email
    ));
    setSelectedEmails([]);
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allLabels = Array.from(new Set(emails.flatMap(email => email.labels)));

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
            className="w-full max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
              {/* Header */}
              <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 rounded-xl text-[#F48120]">
                      <EnvelopeSimple size={24} weight="duotone" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                        Bandeja de Entrada
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Gestiona tus correos electrónicos
                      </p>
                    </div>
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

                {/* Search and Actions */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlass
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar correos..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    className="gap-2 border border-neutral-200 dark:border-neutral-700"
                  >
                    <FunnelSimple size={20} />
                    Filtrar
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 border border-neutral-200 dark:border-neutral-700"
                  >
                    <ArrowsDownUp size={20} />
                    Ordenar
                  </Button>
                </div>

                {/* Selected Actions */}
                {selectedEmails.length > 0 && (
                  <div className="mt-4 flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={handleArchiveSelected}
                    >
                      <Archive size={20} />
                      Archivar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={handleMarkAsRead}
                    >
                      <EnvelopeSimple size={20} />
                      Marcar como leído
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-red-500"
                      onClick={handleDeleteSelected}
                    >
                      <Trash size={20} />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex h-[600px]">
                {/* Sidebar */}
                <div className="w-48 p-4 border-r border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold mb-2">Etiquetas</h3>
                  <div className="space-y-1">
                    {allLabels.map((label) => (
                      <Button
                        key={label}
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start ${activeLabel === label ? 'bg-[#F48120]/10 text-[#F48120]' : ''}`}
                        onClick={() => setActiveLabel(label === activeLabel ? null : label)}
                      >
                        <BookmarkSimple size={16} className="mr-2" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Email List */}
                <div className="flex-1 overflow-y-auto">
                  <Reorder.Group axis="y" values={filteredEmails} onReorder={setEmails} className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {filteredEmails.map((email) => (
                      <Reorder.Item
                        key={email.id}
                        value={email}
                        className="cursor-move"
                      >
                        <div
                          className={`group relative flex items-center gap-4 p-4 ${!email.isRead ? 'bg-[#F48120]/5' : ''} hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(email.id)}
                            onChange={() => handleSelectEmail(email.id)}
                            className="h-5 w-5 rounded border-neutral-300 text-[#F48120] focus:ring-[#F48120]/50"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 hover:text-[#F48120]"
                            onClick={() => handleStarEmail(email.id)}
                          >
                            <Star
                              size={20}
                              weight={email.isStarred ? "fill" : "regular"}
                              className={email.isStarred ? "text-[#F48120]" : ""}
                            />
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{email.sender}</span>
                              <span className="text-sm text-neutral-500">{email.date}</span>
                            </div>
                            <h4 className="font-medium truncate">{email.subject}</h4>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">{email.preview}</p>
                            <div className="flex gap-2 mt-1">
                              {email.labels.map((label) => (
                                <span
                                  key={label}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F48120]/10 text-[#F48120]"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <DotsThreeVertical size={20} />
                          </Button>
                        </div>
                      </Reorder.Item>
                    ))}
                  </Reorder.Group>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};