import React from 'react';
import { ModelSelect } from '@/components/model/ModelSelect';
import { Button } from '@/components/button/Button';
import { List, Bug, Gear } from '@phosphor-icons/react';
import { Toggle } from '@/components/toggle/Toggle';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  showDebug: boolean;
  onToggleDebug: () => void;
}

export function ChatHeader({ onOpenSidebar, onOpenSettings, showDebug, onToggleDebug }: ChatHeaderProps) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-neutral-300 dark:border-neutral-800 sticky top-0 z-10 bg-background">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={onOpenSidebar}
        >
          <List size={20} />
        </Button>
        
        <div className="flex items-center justify-center h-8 w-8">
          <svg
            width="28px"
            height="28px"
            className="text-[#F48120]"
            data-icon="agents"
          >
            <title>Cloudflare Agents</title>
            <symbol id="ai:local:agents" viewBox="0 0 80 79">
              <path
                fill="currentColor"
                d="M69.3 39.7c-3.1 0-5.8 2.1-6.7 5H48.3V34h4.6l4.5-2.5c1.1.8 2.5 1.2 3.9 1.2 3.8 0 7-3.1 7-7s-3.1-7-7-7-7 3.1-7 7c0 .9.2 1.8.5 2.6L51.9 30h-3.5V18.8h-.1c-1.3-1-2.9-1.6-4.5-1.9h-.2c-1.9-.3-3.9-.1-5.8.6-.4.1-.8.3-1.2.5h-.1c-.1.1-.2.1-.3.2-1.7 1-3 2.4-4 4 0 .1-.1.2-.1.2l-.3.6c0 .1-.1.1-.1.2v.1h-.6c-2.9 0-5.7 1.2-7.7 3.2-2.1 2-3.2 4.8-3.2 7.7 0 .7.1 1.4.2 2.1-1.3.9-2.4 2.1-3.2 3.5s-1.2 2.9-1.4 4.5c-.1 1.6.1 3.2.7 4.7s1.5 2.9 2.6 4c-.8 1.8-1.2 3.7-1.1 5.6 0 1.9.5 3.8 1.4 5.6s2.1 3.2 3.6 4.4c1.3 1 2.7 1.7 4.3 2.2v-.1q2.25.75 4.8.6h.1c0 .1.1.1.1.1.9 1.7 2.3 3 4 4 .1.1.2.1.3.2h.1c.4.2.8.4 1.2.5 1.4.6 3 .8 4.5.7.4 0 .8-.1 1.3-.1h.1c1.6-.3 3.1-.9 4.5-1.9V62.9h3.5l3.1 1.7c-.3.8-.5 1.7-.5 2.6 0 3.8 3.1 7 7 7s7-3.1 7-7-3.1-7-7-7c-1.5 0-2.8.5-3.9 1.2l-4.6-2.5h-4.6V48.7h14.3c.9 2.9 3.5 5 6.7 5 3.8 0 7-3.1 7-7s-3.1-7-7-7"
              />
            </symbol>
            <use href="#ai:local:agents" />
          </svg>
        </div>

        <div className="flex-1">
          <h2 className="font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">Asistente Inteligente</h2>
        </div>

        <div className="flex items-center gap-2 mr-2">
          <Bug size={16} />
          <Toggle
            toggled={showDebug}
            aria-label="Toggle debug mode"
            onClick={onToggleDebug}
          />
        </div>

        <Button
          variant="ghost"
          size="md"
          shape="square"
          className="rounded-full h-9 w-9"
          onClick={onOpenSettings}
        >
          <Gear size={20} />
        </Button>
      </div>
{/* 
      <div className="flex items-center justify-between gap-2">
        <ModelSelect className="flex-1" />
      </div> */}
    </div>
  );
}