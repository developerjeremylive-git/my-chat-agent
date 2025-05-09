import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Files, Star, Clock, Calendar, DotsThreeVertical, CaretRight, ArrowsDownUp, MagnifyingGlass, FunnelSimple, Export, Trash, PencilSimple } from '@phosphor-icons/react';

interface File {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  starred: boolean;
}

interface RecentFilesDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFiles: File[] = [
  {
    id: '1',
    name: 'Proyecto_Final.pdf',
    type: 'PDF',
    size: '2.5 MB',
    lastModified: '2024-03-10',
    starred: true
  },
  {
    id: '2',
    name: 'Presentación_Cliente.pptx',
    type: 'PowerPoint',
    size: '5.8 MB',
    lastModified: '2024-03-09',
    starred: false
  },
  {
    id: '3',
    name: 'Datos_Análisis.xlsx',
    type: 'Excel',
    size: '1.2 MB',
    lastModified: '2024-03-08',
    starred: true
  },
  {
    id: '4',
    name: 'Informe_Mensual.docx',
    type: 'Word',
    size: '890 KB',
    lastModified: '2024-03-07',
    starred: false
  }
];

export const RecentFilesDashboard: React.FC<RecentFilesDashboardProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<File[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const handleStarFile = (fileId: string) => {
    setFiles(files.map(file => 
      file.id === fileId ? { ...file, starred: !file.starred } : file
    ));
  };

  const handleSelectFile = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleDeleteSelected = () => {
    setFiles(files.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                      <Files size={24} weight="duotone" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
                        Archivos Recientes
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Gestiona y organiza tus archivos recientes
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

                {/* Search and Filters */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <MagnifyingGlass
                      size={20}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400"
                    />
                    <input
                      type="text"
                      placeholder="Buscar archivos..."
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
                    onClick={() => setSortBy(sortBy === 'date' ? 'name' : 'date')}
                  >
                    <ArrowsDownUp size={20} />
                    Ordenar
                  </Button>
                </div>
              </div>

              {/* File List */}
              <div className="p-6 h-[500px] overflow-y-auto">
                <Reorder.Group axis="y" values={filteredFiles} onReorder={setFiles} className="space-y-2">
                  {filteredFiles.map((file) => (
                    <Reorder.Item
                      key={file.id}
                      value={file}
                      className="cursor-move"
                    >
                      <div
                        className={`group relative flex items-center gap-4 p-4 rounded-lg border ${selectedFiles.includes(file.id) ? 'border-[#F48120] bg-[#F48120]/5' : 'border-neutral-200 dark:border-neutral-700'} hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-300`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="h-5 w-5 rounded border-neutral-300 text-[#F48120] focus:ring-[#F48120]/50"
                        />
                        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                          <Files size={20} className="text-[#F48120]" weight="duotone" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{file.name}</h3>
                          <p className="text-sm text-neutral-500">{file.type} • {file.size}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-neutral-500">{file.lastModified}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 hover:text-[#F48120]"
                            onClick={() => handleStarFile(file.id)}
                          >
                            <Star
                              size={20}
                              weight={file.starred ? "fill" : "regular"}
                              className={file.starred ? "text-[#F48120]" : ""}
                            />
                          </Button>
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-neutral-400 hover:text-[#F48120]"
                            >
                              <DotsThreeVertical size={20} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                </div>
                <div className="flex gap-3">
                  {selectedFiles.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        className="gap-2 text-red-500 hover:text-red-600"
                        onClick={handleDeleteSelected}
                      >
                        <Trash size={20} />
                        Eliminar
                      </Button>
                      <Button
                        variant="ghost"
                        className="gap-2"
                      >
                        <Export size={20} />
                        Exportar
                      </Button>
                    </>
                  )}
                  <Button
                    className="gap-2 bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-opacity"
                  >
                    <PencilSimple size={20} />
                    Nuevo Archivo
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