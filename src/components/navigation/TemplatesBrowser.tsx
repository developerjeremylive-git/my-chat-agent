import React, { useState } from 'react';
import type { Template } from '@/types/templates';
import { TEMPLATE_CATEGORIES, TEMPLATES } from '@/types/templates';
import { TemplateCard } from './TemplateCard';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface TemplatesBrowserProps {
  onClose: () => void;
}

const categoryLabels: Record<string, string> = {
  'all': 'Todas',
  'life': 'Vida',
  'technology': 'Tecnología',
  'finance': 'Finanzas',
  'sales-marketing': 'Ventas y Marketing',
  'research': 'Investigación',
  'people-ops': 'Personas y Operaciones',
  'education': 'Educación'
};

export const TemplatesBrowser: React.FC<TemplatesBrowserProps> = ({ onClose }) => {
  const [activeCategory, setActiveCategory] = useState<typeof TEMPLATE_CATEGORIES[number]>('all');

  const filteredTemplates = activeCategory === 'all'
    ? TEMPLATES
    : TEMPLATES.filter(template => template.categories.includes(activeCategory));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-neutral-900 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Plantillas de navegación</h2>
            <p className="text-neutral-400 mt-1">Comienza rápidamente con estas plantillas populares</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-neutral-800 transition-colors"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="overflow-hidden flex flex-1">
          {/* Categories Sidebar */}
          <div className="w-48 border-r border-neutral-800 bg-neutral-900 p-4 overflow-y-auto">
            <div className="space-y-1">
              {TEMPLATE_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={[
                    'w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors',
                    activeCategory === category
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                  ].join(' ')}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>
          </div>
          
          {/* Templates Grid */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onClick={() => {
                    // Handle template selection
                    console.log('Selected template:', template.id);
                    onClose();
                  }}
                />
              ))}
              
              {filteredTemplates.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-neutral-400">No hay plantillas disponibles en esta categoría.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
