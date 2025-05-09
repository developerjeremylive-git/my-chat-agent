import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Calendar, Clock, Users, MapPin, Note, CaretRight, Plus, Trash, DropHalf } from '@phosphor-icons/react';

interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'accepted' | 'declined';
}

interface EventDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialAttendees: Attendee[] = [
  { id: '1', name: 'Ana García', email: 'ana@example.com', status: 'accepted' },
  { id: '2', name: 'Carlos López', email: 'carlos@example.com', status: 'pending' },
  { id: '3', name: 'María Rodríguez', email: 'maria@example.com', status: 'declined' },
];

export const CalendarEventDashboard: React.FC<EventDashboardProps> = ({ isOpen, onClose }) => {
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendees);
  const [newAttendee, setNewAttendee] = useState({ name: '', email: '' });
  const [activeSection, setActiveSection] = useState<string>('details');

  const handleAddAttendee = () => {
    if (newAttendee.name && newAttendee.email) {
      setAttendees([...attendees, {
        id: Date.now().toString(),
        ...newAttendee,
        status: 'pending'
      }]);
      setNewAttendee({ name: '', email: '' });
    }
  };

  const handleRemoveAttendee = (id: string) => {
    setAttendees(attendees.filter(attendee => attendee.id !== id));
  };

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

                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-[#F48120]/20 to-purple-500/20 dark:from-[#F48120]/10 dark:to-purple-500/10 rounded-xl text-[#F48120]">
                    <Calendar size={24} weight="duotone" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-1">
                      Crear Nuevo Evento
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Configura los detalles de tu evento
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-hidden">
                  {/* Sidebar Navigation */}
                  <div className="w-48 space-y-2">
                    {['details', 'datetime', 'location', 'attendees', 'description'].map((section) => (
                      <Button
                        key={section}
                        variant={activeSection === section ? 'secondary' : 'ghost'}
                        className={`w-full justify-start gap-3 ${activeSection === section ? 'bg-gradient-to-r from-[#F48120] to-purple-500 text-white' : ''}`}
                        onClick={() => setActiveSection(section)}
                      >
                        {section === 'details' && <Note size={20} />}
                        {section === 'datetime' && <Clock size={20} />}
                        {section === 'location' && <MapPin size={20} />}
                        {section === 'attendees' && <Users size={20} />}
                        {section === 'description' && <Note size={20} />}
                        <span className="capitalize">{section}</span>
                      </Button>
                    ))}
                  </div>

                  {/* Main Content Area */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {activeSection === 'details' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Título del Evento</label>
                              <input
                                type="text"
                                className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                                value={eventTitle}
                                onChange={(e) => setEventTitle(e.target.value)}
                                placeholder="Ingresa el título del evento"
                              />
                            </div>
                          </div>
                        )}

                        {activeSection === 'datetime' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-2">Fecha</label>
                              <input
                                type="date"
                                className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                                value={eventDate}
                                onChange={(e) => setEventDate(e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2">Hora</label>
                              <input
                                type="time"
                                className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                                value={eventTime}
                                onChange={(e) => setEventTime(e.target.value)}
                              />
                            </div>
                          </div>
                        )}

                        {activeSection === 'location' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Ubicación</label>
                            <input
                              type="text"
                              className="w-full p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                              value={eventLocation}
                              onChange={(e) => setEventLocation(e.target.value)}
                              placeholder="Ingresa la ubicación del evento"
                            />
                          </div>
                        )}

                        {activeSection === 'attendees' && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nombre"
                                className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                                value={newAttendee.name}
                                onChange={(e) => setNewAttendee({ ...newAttendee, name: e.target.value })}
                              />
                              <input
                                type="email"
                                placeholder="Email"
                                className="flex-1 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
                                value={newAttendee.email}
                                onChange={(e) => setNewAttendee({ ...newAttendee, email: e.target.value })}
                              />
                              <Button
                                onClick={handleAddAttendee}
                                className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white"
                              >
                                <Plus size={20} />
                              </Button>
                            </div>

                            <Reorder.Group axis="y" values={attendees} onReorder={setAttendees} className="space-y-2">
                              {attendees.map((attendee) => (
                                <Reorder.Item
                                  key={attendee.id}
                                  value={attendee}
                                  className="cursor-move"
                                >
                                  <div className="flex items-center gap-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 group hover:border-[#F48120] transition-colors">
                                    <DropHalf size={20} className="text-neutral-400" />
                                    <div className="flex-1">
                                      <div className="font-medium">{attendee.name}</div>
                                      <div className="text-sm text-neutral-500">{attendee.email}</div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                      attendee.status === 'accepted' ? 'bg-green-100 text-green-600' :
                                      attendee.status === 'declined' ? 'bg-red-100 text-red-600' :
                                      'bg-yellow-100 text-yellow-600'
                                    }`}>
                                      {attendee.status}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveAttendee(attendee.id)}
                                      className="opacity-0 group-hover:opacity-100 hover:text-red-500"
                                    >
                                      <Trash size={16} />
                                    </Button>
                                  </div>
                                </Reorder.Item>
                              ))}
                            </Reorder.Group>
                          </div>
                        )}

                        {activeSection === 'description' && (
                          <div>
                            <label className="block text-sm font-medium mb-2">Descripción</label>
                            <textarea
                              className="w-full h-32 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50 resize-none"
                              value={eventDescription}
                              onChange={(e) => setEventDescription(e.target.value)}
                              placeholder="Ingresa la descripción del evento"
                            />
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <Button variant="ghost" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white">
                    Crear Evento
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};