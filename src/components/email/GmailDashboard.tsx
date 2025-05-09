import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, EnvelopeSimple, Star, Clock, DotsThreeVertical, CaretRight, ArrowsDownUp, MagnifyingGlass, FunnelSimple, Export, Trash, PencilSimple, Archive, BookmarkSimple, Tag, Plus } from '@phosphor-icons/react';

interface Email {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  date: string;
  isStarred: boolean;
  isRead: boolean;
  labels: string[];
  category: 'primary' | 'social' | 'promotions' | 'updates';
}

interface GmailDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialEmails: Email[] = [
  {
    id: '1',
    subject: 'Actualización del Proyecto',
    sender: 'Ana García',
    preview: 'Te envío los últimos cambios del proyecto...',
    date: '10:30 AM',
    isStarred: true,
    isRead: false,
    labels: ['Proyecto', 'Importante'],
    category: 'primary'
  },
  {
    id: '2',
    subject: 'Reunión de Equipo',
    sender: 'Carlos López',
    preview: 'Agenda para la reunión de mañana...',
    date: '9:15 AM',
    isStarred: false,
    isRead: true,
    labels: ['Reunión'],
    category: 'primary'
  },
  {
    id: '3',
    subject: 'Oferta Especial',
    sender: 'Marketing Team',
    preview: '¡No te pierdas nuestras últimas ofertas!',
    date: 'Ayer',
    isStarred: false,
    isRead: true,
    labels: [],
    category: 'promotions'
  },
  {
    id: '4',
    subject: 'Actualización de Seguridad',
    sender: 'Sistema',
    preview: 'Tu cuenta ha sido actualizada...',
    date: 'Ayer',
    isStarred: false,
    isRead: false,
    labels: ['Sistema'],
    category: 'updates'
  }
];

const categories = [
  { id: 'primary', name: 'Principal', icon: <EnvelopeSimple size={20} /> },
  { id: 'social', name: 'Social', icon: <BookmarkSimple size={20} /> },
  { id: 'promotions', name: 'Promociones', icon: <Tag size={20} /> },
  { id: 'updates', name: 'Actualizaciones', icon: <Archive size={20} /> }
];

export const GmailDashboard: React.FC<GmailDashboardProps> = ({ isOpen, onClose }) => {
  const [emails, setEmails] = useState<Email[]>(initialEmails);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('primary');
  const [draggedEmail, setDraggedEmail] = useState<Email | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const [newLabel, setNewLabel] = useState('');

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

  const handleDragStart = (email: Email) => {
    setDraggedEmail(email);
  };

  const handleDragEnd = (category: string) => {
    if (draggedEmail) {
      setEmails(emails.map(email =>
        email.id === draggedEmail.id ? { ...email, category: category as 'primary' | 'social' | 'promotions' | 'updates' } : email
      ));
    }
    setDraggedEmail(null);
  };

  const handleAddLabel = () => {
    if (newLabel && selectedEmails.length > 0) {
      setEmails(emails.map(email =>
        selectedEmails.includes(email.id)
          ? { ...email, labels: [...new Set([...email.labels, newLabel])] }
          : email
      ));
      setNewLabel('');
      setShowLabels(false);
    }
  };

  const filteredEmails = emails.filter(email =>
    email.category === activeCategory &&
    (email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.sender.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
                        Gmail
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Gestiona tu bandeja de entrada
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
                <div className="flex items-center gap-4 mb-6">
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
                  {selectedEmails.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        className="gap-2 border border-neutral-200 dark:border-neutral-700"
                        onClick={() => setShowLabels(true)}
                      >
                        <Tag size={20} />
                        Etiquetar
                      </Button>
                      <Button
                        variant="ghost"
                        className="gap-2 border border-neutral-200 dark:border-neutral-700 text-red-500"
                        onClick={handleDeleteSelected}
                      >
                        <Trash size={20} />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>

                {/* Categories */}
                <div className="flex gap-4">
                  {categories.map((category) => (
                    <div
                      key={category.id}
                      className={`flex-1 p-4 rounded-lg border ${activeCategory === category.id ? 'border-[#F48120] bg-[#F48120]/5' : 'border-neutral-200 dark:border-neutral-700'} cursor-pointer transition-all duration-300 group`}
                      onClick={() => setActiveCategory(category.id)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-[#F48120]', 'bg-[#F48120]/5');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-[#F48120]', 'bg-[#F48120]/5');
                      }}
                      onDrop={() => handleDragEnd(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${activeCategory === category.id ? 'text-[#F48120]' : 'text-neutral-500 group-hover:text-[#F48120]'}`}>
                          {category.icon}
                        </div>
                        <div>
                          <h3 className={`font-medium ${activeCategory === category.id ? 'text-[#F48120]' : 'text-neutral-700 dark:text-neutral-300'}`}>
                            {category.name}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {emails.filter(email => email.category === category.id).length} correos
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Email List */}
              <div className="p-6 h-[400px] overflow-y-auto">
                <Reorder.Group axis="y" values={filteredEmails} onReorder={setEmails} className="space-y-2">
                  {filteredEmails.map((email) => (
                    <Reorder.Item
                      key={email.id}
                      value={email}
                      className="cursor-move"
                      dragListener={false}
                    >
                      <div
                        className={`group relative flex items-center gap-4 p-4 rounded-lg border ${selectedEmails.includes(email.id) ? 'border-[#F48120] bg-[#F48120]/5' : 'border-neutral-200 dark:border-neutral-700'} hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-300`}
                        draggable
                        onDragStart={() => handleDragStart(email)}
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-medium ${!email.isRead ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400'}`}>
                              {email.sender}
                            </h3>
                            {email.labels.length > 0 && (
                              <div className="flex gap-1">
                                {email.labels.map((label, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 text-xs rounded-full bg-[#F48120]/10 text-[#F48120] dark:bg-[#F48120]/20"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <h4 className={`${!email.isRead ? 'font-medium' : ''}`}>{email.subject}</h4>
                          <p className="text-sm text-neutral-500 line-clamp-1">{email.preview}</p>
                        </div>
                        <span className="text-sm text-neutral-500">{email.date}</span>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>
            </Card>
          </motion.div>

          {/* Labels Popup */}
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowLabels(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="w-full max-w-md"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Card className="bg-white dark:bg-neutral-900 p-6 relative overflow-hidden border border-neutral-200 dark:border-neutral-800">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-4 top-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      onClick={() => setShowLabels(false)}
                    >
                      <X size={20} />
                    </Button>

                    <div className="mb-6">
                      <h3 className="text-xl font-bold mb-2">Añadir Etiqueta</h3>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Añade una etiqueta a los correos seleccionados
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nueva etiqueta"
                        className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                      />
                      <Button
                        onClick={handleAddLabel}
                        className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white"
                      >
                        <Plus size={20} />
                        Añadir
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};