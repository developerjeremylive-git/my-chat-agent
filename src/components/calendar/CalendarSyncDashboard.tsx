import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Calendar, Clock, Users, MapPin, Note, CaretRight, Plus, Trash, ArrowsDownUp, MagnifyingGlass, FunnelSimple, CheckCircle, Warning, ArrowsLeftRight } from '@phosphor-icons/react';

interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  calendar: string;
  attendees: number;
  status: 'pending' | 'synced' | 'conflict';
}

interface CalendarSource {
  id: string;
  name: string;
  color: string;
  events: number;
  selected: boolean;
}

interface CalendarSyncDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Reunión de Proyecto',
    startDate: '2024-03-15 10:00',
    endDate: '2024-03-15 11:30',
    calendar: 'Trabajo',
    attendees: 5,
    status: 'pending'
  },
  {
    id: '2',
    title: 'Entrevista con Cliente',
    startDate: '2024-03-16 14:00',
    endDate: '2024-03-16 15:00',
    calendar: 'Personal',
    attendees: 3,
    status: 'synced'
  },
  {
    id: '3',
    title: 'Presentación Trimestral',
    startDate: '2024-03-17 09:00',
    endDate: '2024-03-17 10:30',
    calendar: 'Trabajo',
    attendees: 8,
    status: 'conflict'
  }
];

const initialCalendars: CalendarSource[] = [
  { id: '1', name: 'Google Calendar', color: '#4285F4', events: 45, selected: true },
  { id: '2', name: 'Outlook Calendar', color: '#0078D4', events: 32, selected: false },
  { id: '3', name: 'iCloud Calendar', color: '#5856D6', events: 28, selected: false },
  { id: '4', name: 'Calendario Local', color: '#34C759', events: 15, selected: true }
];

export const CalendarSyncDashboard: React.FC<CalendarSyncDashboardProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [calendars, setCalendars] = useState<CalendarSource[]>(initialCalendars);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [draggedCalendar, setDraggedCalendar] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'synced' | 'conflicts'>('pending');

  const handleCalendarSelect = (calendarId: string) => {
    setCalendars(calendars.map(cal =>
      cal.id === calendarId ? { ...cal, selected: !cal.selected } : cal
    ));
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEvents(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleDragStart = (calendarId: string) => {
    setDraggedCalendar(calendarId);
  };

  const handleDrop = (eventId: string) => {
    if (draggedCalendar) {
      setEvents(events.map(event =>
        event.id === eventId
          ? { ...event, calendar: calendars.find(cal => cal.id === draggedCalendar)?.name || event.calendar, status: 'synced' }
          : event
      ));
    }
    setDraggedCalendar(null);
  };

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (activeTab === 'pending' ? event.status === 'pending' :
     activeTab === 'synced' ? event.status === 'synced' :
     event.status === 'conflict')
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
            className="w-full max-w-7xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="bg-white dark:bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
              <div className="p-6 relative h-[700px] flex flex-col">
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
                      Sincronización de Calendarios
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                      Gestiona y sincroniza tus eventos entre calendarios
                    </p>
                  </div>
                </div>

                <div className="flex gap-6 flex-1 overflow-hidden">
                  {/* Sidebar con Calendarios */}
                  <div className="w-80 border-r border-neutral-200 dark:border-neutral-700 pr-6">
                    <h4 className="text-lg font-semibold mb-4">Calendarios Disponibles</h4>
                    <div className="space-y-3">
                      {calendars.map((calendar) => (
                        <div
                          key={calendar.id}
                          className={`p-4 rounded-lg border ${calendar.selected ? 'border-[#F48120] bg-[#F48120]/5' : 'border-neutral-200 dark:border-neutral-700'} cursor-pointer transition-all duration-300`}
                          onClick={() => handleCalendarSelect(calendar.id)}
                          draggable
                          onDragStart={() => handleDragStart(calendar.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: calendar.color }}
                            />
                            <div className="flex-1">
                              <h5 className="font-medium">{calendar.name}</h5>
                              <p className="text-sm text-neutral-500">{calendar.events} eventos</p>
                            </div>
                            <CheckCircle
                              size={20}
                              className={`${calendar.selected ? 'text-[#F48120]' : 'text-neutral-400'}`}
                              weight={calendar.selected ? 'fill' : 'regular'}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Button
                        className="w-full gap-2 bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-opacity"
                      >
                        <Plus size={20} />
                        Añadir Calendario
                      </Button>
                    </div>
                  </div>

                  {/* Área Principal */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Barra de Búsqueda y Filtros */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex-1 relative">
                        <MagnifyingGlass
                          size={20}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                        />
                        <input
                          type="text"
                          placeholder="Buscar eventos..."
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-[#F48120]/50"
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

                    {/* Pestañas de Estado */}
                    <div className="flex gap-2 mb-4">
                      {[
                        { id: 'pending', label: 'Pendientes', icon: Clock },
                        { id: 'synced', label: 'Sincronizados', icon: CheckCircle },
                        { id: 'conflicts', label: 'Conflictos', icon: Warning }
                      ].map((tab) => (
                        <Button
                          key={tab.id}
                          variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                          className={`gap-2 ${activeTab === tab.id ? 'bg-gradient-to-r from-[#F48120] to-purple-500 text-white' : ''}`}
                          onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        >
                          <tab.icon size={20} />
                          {tab.label}
                        </Button>
                      ))}
                    </div>

                    {/* Lista de Eventos */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                      <Reorder.Group axis="y" values={filteredEvents} onReorder={setEvents} className="space-y-2">
                        {filteredEvents.map((event) => (
                          <Reorder.Item
                            key={event.id}
                            value={event}
                            className="cursor-move"
                          >
                            <div
                              className={`group relative flex items-center gap-4 p-4 rounded-lg border ${event.status === 'conflict' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : event.status === 'synced' ? 'border-green-500 bg-green-50 dark:bg-green-500/10' : 'border-neutral-200 dark:border-neutral-700'} hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-300`}
                              onDragOver={(e) => {
                                if (draggedCalendar) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleDrop(event.id);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={selectedEvents.includes(event.id)}
                                onChange={() => handleEventSelect(event.id)}
                                className="h-5 w-5 rounded border-neutral-300 text-[#F48120] focus:ring-[#F48120]/50"
                              />
                              <div className="flex-1">
                                <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{event.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-neutral-500">
                                  <span className="flex items-center gap-1">
                                    <Clock size={16} />
                                    {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar size={16} />
                                    {event.calendar}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users size={16} />
                                    {event.attendees} asistentes
                                  </span>
                                </div>
                              </div>
                              {event.status === 'pending' && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#F48120] hover:bg-[#F48120]/10"
                                  >
                                    <ArrowsLeftRight size={20} />
                                  </Button>
                                </div>
                              )}
                              {event.status === 'conflict' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-red-500 text-sm">Conflicto horario</span>
                                  <Warning size={20} className="text-red-500" />
                                </div>
                              )}
                            </div>
                          </Reorder.Item>
                        ))}
                      </Reorder.Group>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};