import React, { useState } from 'react';
import { TemplatesBrowser } from './TemplatesBrowser';
import { LayoutTemplate, Plus } from 'lucide-react';

export const NavigationSection: React.FC = () => {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <>
      <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
        <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3 px-2">
          Navegación
        </h3>
        <button
          onClick={() => setShowTemplates(true)}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <LayoutTemplate className="h-5 w-5 text-neutral-500" />
          <span>Plantillas</span>
          <Plus className="ml-auto h-4 w-4 text-neutral-400" />
        </button>
      </div>

      {showTemplates && (
        <TemplatesBrowser onClose={() => setShowTemplates(false)} />
      )}
    </>
  );
};
