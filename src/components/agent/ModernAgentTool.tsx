import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { Button } from '@/components/button/Button';
import { X, Files, Calendar, EnvelopeSimple } from '@phosphor-icons/react';

interface ModernAgentToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModernAgentTool({ isOpen, onClose }: ModernAgentToolProps) {
  const [selectedService, setSelectedService] = useState<string | null>(null);

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-300`}>
      <Card className="w-full max-w-2xl bg-white dark:bg-neutral-900 p-6 m-4 relative overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-4 top-4 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
          onClick={onClose}
        >
          <X size={20} />
        </Button>

        <div className="space-y-6">
          {/* Encabezado */}
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">My New Agent</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">Add description</p>
          </div>

          {/* Instrucciones */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Instructions</h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[#F48120] hover:text-[#F48120]/80"
              >
                ✨ Improve
              </Button>
            </div>

            <div className="space-y-3">
              {/* Google Drive Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">1.</span>
                <span>Show me recently added files to my</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <Files weight="fill" className="text-[#F48120]" size={16} />
                  <span>Google Drive</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {/* Google Calendar Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">2.</span>
                <span>Preview my meetings from</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <Calendar weight="fill" className="text-[#F48120]" size={16} />
                  <span>Google Calendar</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>

              {/* Gmail Integration */}
              <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer group">
                <span className="text-[#F48120]">3.</span>
                <span>Highlight any interviews from</span>
                <div className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
                  <EnvelopeSimple weight="fill" className="text-[#F48120]" size={16} />
                  <span>Gmail</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Include Knowledge */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Include Knowledge</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <Files weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Drive</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <EnvelopeSimple weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Gmail</span>
              </div>
              <div className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
                <Calendar weight="fill" className="text-[#F48120]" size={20} />
                <span className="text-sm">Calendar</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="rounded-lg border-dashed border-2"
              >
                Libraries 1
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}