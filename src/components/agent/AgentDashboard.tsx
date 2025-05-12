import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, CaretLeft, CaretRight } from '@phosphor-icons/react';
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

  const cardsPerPage = 2;
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

              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                    Mis Agentes
                  </h2>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                    Gestiona y visualiza tus agentes inteligentes
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-all duration-300"
                  onClick={handleCreateAgent}
                >
                  Crear Agente
                </Button>
              </div>

              <div className="relative">
                <div className="flex gap-4 mb-4 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {agents
                      .slice(
                        currentPage * cardsPerPage,
                        (currentPage + 1) * cardsPerPage
                      )
                      .map((agent) => (
                        <motion.div
                          key={agent.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="flex-1"
                        >
                          <Card className="p-6 h-full border-2 border-neutral-200 dark:border-neutral-700 hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-300 group cursor-pointer">
                            <div className="flex flex-col h-full">
                              <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
                                {agent.title}
                              </h3>
                              <p className="text-neutral-600 dark:text-neutral-400 mb-4 flex-grow">
                                {agent.description}
                              </p>
                              <div className="flex justify-end">
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-[#F48120] hover:bg-[#F48120]/10 transition-colors duration-300"
                                    onClick={() => handleEditAgent(agent)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:bg-red-500/10 transition-colors duration-300"
                                    onClick={() => handleDeleteAgent(agent.id)}
                                  >
                                    Eliminar
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                  </AnimatePresence>
                </div>

                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevPage}
                      className="hover:bg-[#F48120]/10 text-[#F48120]"
                      disabled={currentPage === 0}
                    >
                      <CaretLeft size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextPage}
                      className="hover:bg-[#F48120]/10 text-[#F48120]"
                      disabled={currentPage === totalPages - 1}
                    >
                      <CaretRight size={20} />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}