import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, CaretLeft, CaretRight, PlusCircle, Robot, Wrench, Trash } from '@phosphor-icons/react';
import { ModernAgentTool } from './ModernAgentTool';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Agent {
  id: string;
  title: string;
  description: string;
  tools: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
  }>;
}

interface Agent {
  id: string;
  title: string;
  description: string;
  tools: Array<{
    id: string;
    name: string;
    icon: React.ReactNode;
  }>;
}

export function AgentDashboard({ isOpen, onClose }: AgentDashboardProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [agents, setAgents] = useState<Agent[]>([
    {
      id: '1',
      title: 'Asistente de Drive',
      description: 'Gestiona archivos y documentos importantes',
      tools: []
    },
    {
      id: '2',
      title: 'Organizador de Calendario',
      description: 'Programa y gestiona reuniones eficientemente',
      tools: []
    },
    {
      id: '3',
      title: 'Gestor de Correo',
      description: 'Prioriza y organiza correos importantes',
      tools: []
    }
  ]);

  const cardsPerPage = 3;
  const totalPages = Math.ceil(agents.length / cardsPerPage);

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const [showModernAgentTool, setShowModernAgentTool] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | undefined>();

  const handleCreateAgent = () => {
    onClose();
    setTimeout(() => {
      setSelectedAgent(undefined);
      setShowModernAgentTool(true);
    }, 300);
  };

  const handleEditAgent = (agent: Agent) => {
    onClose();
    setTimeout(() => {
      setSelectedAgent(agent);
      setShowModernAgentTool(true);
    }, 300);
  };

  const handleDeleteAgent = (agentId: string) => {
    setAgents(agents.filter(agent => agent.id !== agentId));
  };

  const handleSaveAgent = (agent: Agent) => {
    if (selectedAgent) {
      setAgents(agents.map(a => a.id === agent.id ? agent : a));
    } else {
      setAgents([...agents, agent]);
    }
    setShowModernAgentTool(false);
  };

  return (
    <>
      <ModernAgentTool
        isOpen={showModernAgentTool}
        onClose={() => setShowModernAgentTool(false)}
        agentToEdit={selectedAgent}
        onSaveAgent={handleSaveAgent}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-70 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-6xl h-[calc(100vh-2rem)] flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl p-8 relative overflow-hidden border-0 shadow-2xl rounded-3xl w-full max-h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/10 to-purple-500/10 dark:from-[#F48120]/5 dark:to-purple-500/5 z-0"></div>

                <button
                  className="z-20 absolute right-6 top-6 rounded-full w-10 h-10 flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 hover:bg-[#F48120]/20 hover:text-[#F48120] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                  onClick={onClose}
                >
                  <X weight="bold" size={20} />
                </button>

                <div className="relative z-10 mb-8 flex justify-between items-center">
                  <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent mb-2">
                      Mis Agentes
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                      Centro de control de agentes inteligentes
                    </p>
                  </div>
                  <button
                    className="mr-13 bg-gradient-to-r from-[#F48120] to-purple-500 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 rounded-xl px-6 py-3 flex items-center gap-2"
                    onClick={handleCreateAgent}
                  >
                    <PlusCircle size={20} weight="bold" />
                    Crear Agente
                  </button>
                </div>

                <div className="relative z-10 flex-1 overflow-hidden flex flex-col">
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-200 hover:scrollbar-thumb-orange-300 dark:scrollbar-thumb-purple-700 dark:hover:scrollbar-thumb-purple-600 scrollbar-track-transparent pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-min pb-4 px-4">
                      <AnimatePresence mode="wait">
                        {agents
                          .slice(
                            currentPage * cardsPerPage,
                            (currentPage + 1) * cardsPerPage
                          )
                          .map((agent) => (
                            <motion.div
                              key={agent.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -20 }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className="group"
                              style={{ perspective: '1000px' }}
                            >
                              <Card className="mt-2 group relative overflow-visible p-6 h-full border border-neutral-200/50 dark:border-neutral-700/50 hover:border-[#F48120]/50 dark:hover:border-[#F48120]/50 transition-all duration-500 rounded-2xl backdrop-blur-lg bg-white/40 dark:bg-neutral-900/40 hover:bg-white/60 dark:hover:bg-neutral-800/60 shadow-lg hover:shadow-xl transform-gpu hover:scale-[1.05] hover:rotate-y-[-5deg] will-change-transform">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#F48120]/5 via-purple-500/5 to-[#F48120]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-gradient-xy rounded-2xl"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-[#F48120]/20 via-purple-500/20 to-[#F48120]/20 dark:from-[#F48120]/10 dark:via-purple-500/10 dark:to-[#F48120]/10 group-hover:scale-110 group-hover:rotate-[5deg] transition-all duration-500 shadow-lg group-hover:shadow-[0_5px_20px_-5px_rgba(244,129,32,0.5)] dark:group-hover:shadow-[0_5px_20px_-5px_rgba(244,129,32,0.4)]">
                                      <Robot size={24} weight="duotone" className="text-[#F48120]" />
                                    </div>
                                    <h3 className="text-xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                                      {agent.title}
                                    </h3>
                                  </div>

                                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 flex-grow text-lg">
                                    {agent.description}
                                  </p>

                                  <div className="flex justify-end gap-3">
                                    <button
                                      className="flex items-center gap-2 text-[#F48120] hover:bg-[#F48120]/10 transition-all duration-300 rounded-xl px-4 py-2 transform hover:scale-105"
                                      onClick={() => handleEditAgent(agent)}
                                    >
                                      <Wrench size={18} weight="duotone" />
                                      Editar
                                    </button>
                                    <button
                                      className="flex items-center gap-2 text-red-500 hover:bg-red-500/10 transition-all duration-300 rounded-xl px-4 py-2 transform hover:scale-105"
                                      onClick={() => handleDeleteAgent(agent.id)}
                                    >
                                      <Trash size={18} weight="duotone" />
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          ))}
                      </AnimatePresence>
                    </div>

                    {totalPages > 1 && (
                      <div className="flex justify-center gap-6 mt-8">
                        <Button
                          variant="ghost"
                          size="lg"
                          className="rounded-full w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 hover:bg-[#F48120]/20 hover:text-[#F48120] transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(244,129,32,0.5)] dark:hover:shadow-[0_10px_30px_-10px_rgba(244,129,32,0.4)] transform hover:scale-110 hover:translate-x-[-2px]"
                          onClick={prevPage}
                          disabled={currentPage === 0}
                        >
                          <CaretLeft weight="bold" size={24} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="lg"
                          className="rounded-full w-12 h-12 flex items-center justify-center bg-white/90 dark:bg-neutral-800/90 hover:bg-[#F48120]/20 hover:text-[#F48120] transition-all duration-300 shadow-lg hover:shadow-[0_10px_30px_-10px_rgba(244,129,32,0.5)] dark:hover:shadow-[0_10px_30px_-10px_rgba(244,129,32,0.4)] transform hover:scale-110 hover:translate-x-[2px]"
                          onClick={nextPage}
                          disabled={currentPage === totalPages - 1}
                        >
                          <CaretRight weight="bold" size={24} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}