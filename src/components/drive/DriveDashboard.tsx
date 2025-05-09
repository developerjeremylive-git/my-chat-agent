import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { X, Files, Star, Clock, DotsThreeVertical, CaretRight, ArrowsDownUp, MagnifyingGlass, FunnelSimple, Export, Trash, PencilSimple, FolderSimple, Image, FilePdf, FileDoc, FileXls, Plus, CloudArrowUp } from '@phosphor-icons/react';

interface DriveFile {
  id: string;
  name: string;
  type: 'folder' | 'image' | 'pdf' | 'doc' | 'xls';
  size: string;
  lastModified: string;
  starred: boolean;
}

interface DriveDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const initialFiles: DriveFile[] = [
  {
    id: '1',
    name: 'Documentos_Importantes',
    type: 'folder',
    size: '--',
    lastModified: '2024-03-10',
    starred: true
  },
  {
    id: '2',
    name: 'Presentación_2024.pdf',
    type: 'pdf',
    size: '5.8 MB',
    lastModified: '2024-03-09',
    starred: false
  },
  {
    id: '3',
    name: 'Reporte_Financiero.xls',
    type: 'xls',
    size: '1.2 MB',
    lastModified: '2024-03-08',
    starred: true
  },
  {
    id: '4',
    name: 'Propuesta_Cliente.doc',
    type: 'doc',
    size: '890 KB',
    lastModified: '2024-03-07',
    starred: false
  }
];

const getFileIcon = (type: DriveFile['type']) => {
  switch (type) {
    case 'folder':
      return <FolderSimple size={24} weight="duotone" />;
    case 'image':
      return <Image size={24} weight="duotone" />;
    case 'pdf':
      return <FilePdf size={24} weight="duotone" />;
    case 'doc':
      return <FileDoc size={24} weight="duotone" />;
    case 'xls':
      return <FileXls size={24} weight="duotone" />;
    default:
      return <Files size={24} weight="duotone" />;
  }
};

export const DriveDashboard: React.FC<DriveDashboardProps> = ({ isOpen, onClose }) => {
  const [files, setFiles] = useState<DriveFile[]>(initialFiles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [draggedFile, setDraggedFile] = useState<DriveFile | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

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

  const handleDragStart = (file: DriveFile) => {
    setDraggedFile(file);
  };

  const handleDragEnd = () => {
    if (draggedFile && dropTarget) {
      // Si el archivo se suelta en una carpeta, lo movemos
      if (dropTarget !== draggedFile.id) {
        // Aquí implementaríamos la lógica para mover el archivo a la carpeta
        console.log(`Moviendo ${draggedFile.name} a la carpeta ${dropTarget}`);
      }
    }
    setDraggedFile(null);
    setDropTarget(null);
  };

  const handleDragOver = (fileId: string) => {
    if (draggedFile && files.find(f => f.id === fileId)?.type === 'folder') {
      setDropTarget(fileId);
    }
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
                        Google Drive
                      </h2>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        Gestiona y organiza tus archivos
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

                {/* Actions Bar */}
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    className="gap-2 bg-gradient-to-r from-[#F48120] to-purple-500 text-white hover:opacity-90 transition-opacity"
                  >
                    <CloudArrowUp size={20} />
                    Subir Archivo
                  </Button>
                  <Button
                    className="gap-2 border border-neutral-200 dark:border-neutral-700 hover:border-[#F48120] dark:hover:border-[#F48120] transition-colors"
                  >
                    <Plus size={20} />
                    Nueva Carpeta
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
                      dragListener={false}
                    >
                      <motion.div
                        draggable
                        onDragStart={() => handleDragStart(file)}
                        onDragEnd={handleDragEnd}
                        onDragOver={() => handleDragOver(file.id)}
                        className={`group relative flex items-center gap-4 p-4 rounded-lg border ${
                          selectedFiles.includes(file.id) ? 'border-[#F48120] bg-[#F48120]/5' :
                          dropTarget === file.id ? 'border-[#F48120] bg-[#F48120]/10' :
                          'border-neutral-200 dark:border-neutral-700'
                        } hover:border-[#F48120] dark:hover:border-[#F48120] transition-all duration-300`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.id)}
                          onChange={() => handleSelectFile(file.id)}
                          className="h-5 w-5 rounded border-neutral-300 text-[#F48120] focus:ring-[#F48120]/50"
                        />
                        <div className="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{file.name}</h3>
                          <p className="text-sm text-neutral-500">{file.type.toUpperCase()} • {file.size}</p>
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
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-neutral-400 hover:text-[#F48120]"
                          >
                            <DotsThreeVertical size={20} />
                          </Button>
                        </div>
                      </motion.div>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              </div>

              {/* Footer Actions */}
              {selectedFiles.length > 0 && (
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">
                      {selectedFiles.length} {selectedFiles.length === 1 ? 'archivo seleccionado' : 'archivos seleccionados'}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-neutral-600 dark:text-neutral-400 hover:text-[#F48120]"
                      >
                        <Export size={20} />
                        Compartir
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-red-500 hover:text-red-600"
                        onClick={handleDeleteSelected}
                      >
                        <Trash size={20} />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};