import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { X, PaintBrush, Target, MagnifyingGlass, Scales, Gear, Info } from '@phosphor-icons/react';
import { useAIConfig } from '@/contexts/AIConfigContext';
import { cn } from '@/lib/utils';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useState, useCallback, useMemo, memo } from 'react';

interface AIModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed: number;
  stream: boolean;
}

interface PresetConfig {
  name: string;
  description: string;
  config: AIModelConfig;
}

const presets: PresetConfig[] = [
  {
    name: 'Creativo',
    description: 'Respuestas más variadas e imaginativas',
    config: {
      temperature: 0.9,
      maxTokens: 2048,
      topP: 0.95,
      topK: 40,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      seed: 1,
      stream: false
    }
  },
  {
    name: 'Preciso',
    description: 'Respuestas deterministas y consistentes',
    config: {
      temperature: 0.3,
      maxTokens: 1024,
      topP: 0.8,
      topK: 5,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1,
      seed: 1,
      stream: false
    }
  },
  {
    name: 'Investigador',
    description: 'Respuestas detalladas y analíticas',
    config: {
      temperature: 0.5,
      maxTokens: 4096,
      topP: 0.9,
      topK: 25,
      frequencyPenalty: 0.2,
      presencePenalty: 0.2,
      seed: 1,
      stream: false
    }
  },
  {
    name: 'Balanceado',
    description: 'Configuración equilibrada, uso general',
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      topK: 15,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3,
      seed: 1,
      stream: false
    }
  }
];

interface AISettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Memoized slider component to prevent unnecessary re-renders
const SliderControl = memo(({ 
  label, 
  value, 
  min, 
  max, 
  step, 
  onChange, 
  tooltip,
  formatValue = (v) => v,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tooltip: string;
  formatValue?: (value: number) => string | number;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <div className="flex items-center space-x-2">
        <span className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md text-sm font-mono">
          {formatValue(value)}
        </span>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors">
                <Info size={16} weight="fill" />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-[100] shadow-lg"
                sideOffset={5}
              >
                {tooltip}
                <Tooltip.Arrow className="fill-neutral-800" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#F48120] [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform hover:[&::-webkit-slider-thumb]:scale-110 [&::-webkit-slider-thumb]:active:scale-105 focus-visible:[&::-webkit-slider-thumb]:ring-2 focus-visible:[&::-webkit-slider-thumb]:ring-[#F48120] focus-visible:[&::-webkit-slider-thumb]:ring-offset-2"
      aria-label={label}
    />
  </div>
));

SliderControl.displayName = 'SliderControl';

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const { config, setConfig } = useAIConfig();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const [showBasic, setShowBasic] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handlePresetSelect = useCallback((preset: PresetConfig) => {
    setSelectedPreset(preset.name);
    setConfig({
      ...config,
      ...preset.config,
      stream: config.stream
    });
  }, [config, setConfig]);

  const handleSliderChange = useCallback(<T extends number | boolean>(
    key: keyof AIModelConfig, 
    value: T
  ) => {
    setSelectedPreset(null);
    setConfig({
      ...config,
      [key]: value
    });
  }, [config, setConfig]);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const togglePresets = useCallback(() => {
    setShowPresets(prev => !prev);
  }, []);

  const toggleBasic = useCallback(() => {
    setShowBasic(prev => !prev);
  }, []);

  // Memoize preset cards to prevent re-renders
  const presetCards = useMemo(() => (
    presets.map((preset: PresetConfig) => (
      <Card
        key={preset.name}
        className={cn(
          'p-4 cursor-pointer transition-all duration-200 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          'border border-neutral-200/70 dark:border-neutral-700/50',
          'hover:shadow-md dark:hover:shadow-neutral-800/30',
          selectedPreset === preset.name 
            ? 'ring-2 ring-[#F48120] ring-offset-2 dark:ring-offset-neutral-900' 
            : 'hover:border-neutral-300 dark:hover:border-neutral-600'
        )}
        onClick={() => handlePresetSelect(preset)}
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'p-2 rounded-lg',
            selectedPreset === preset.name 
              ? 'bg-[#F48120]/10 text-[#F48120]' 
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
          )}>
            {preset.name === 'Creativo' && <PaintBrush size={20} weight="fill" />}
            {preset.name === 'Preciso' && <Target size={20} weight="fill" />}
            {preset.name === 'Investigador' && <MagnifyingGlass size={20} weight="fill" />}
            {preset.name === 'Balanceado' && <Scales size={20} weight="fill" />}
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 dark:text-white">{preset.name}</h4>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {preset.description}
            </p>
          </div>
        </div>
      </Card>
    ))
  ), [handlePresetSelect, selectedPreset]);

  return (
    <>
      {/* Overlay with higher z-index */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60]"
          onClick={onClose}
          aria-hidden="true"
          style={{
            opacity: isOpen ? 1 : 0,
            transition: 'opacity 0.2s ease-in-out',
          }}
        />
      )}
      
      {/* Settings Panel with higher z-index than header */}
      <div
        className={cn(
          'fixed inset-y-0 right-0 w-full sm:w-96 transform transition-all duration-300 ease-in-out shadow-2xl',
          'bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm border-l border-neutral-200/50 dark:border-neutral-700/50',
          'flex flex-col h-full',
          isOpen ? 'translate-x-0' : 'translate-x-full',
          'z-[70] overflow-y-auto no-scrollbar', // Increased z-index
          'overscroll-contain' // Prevents pull-to-refresh on mobile
        )}
        style={{
          opacity: isOpen ? 1 : 0,
          transition: 'transform 0.3s ease-in-out, opacity 0.2s ease-in-out',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Configuración del Asistente de IA"
      >
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-sm flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Gear weight="duotone" className="text-[#F48120] h-7 w-6 flex-shrink-0" />
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#F48120] to-purple-500 bg-clip-text text-transparent">
            Configuración Asistente IA
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          className="rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          onClick={onClose}
          aria-label="Cerrar configuración"
        >
          <X size={20} />
        </Button>
      </div>

        {/* Main Content */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Presets Section */}
          <section className="space-y-4">
            <button 
              onClick={togglePresets}
              className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F48120] focus-visible:ring-offset-2 rounded-lg p-2 -ml-2"
              aria-expanded={showPresets}
              aria-controls="presets-section"
            >
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Configuraciones Predefinidas
              </h3>
              <svg
                className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${showPresets ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              id="presets-section"
              className={`space-y-3 transition-all duration-300 ${showPresets ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}
              aria-hidden={!showPresets}
            >
              {presetCards}
            </div>
          </section>
          
          {/* Divider */}
          <div className="border-t border-neutral-200 dark:border-neutral-800 my-4" />
          
          {/* Basic Settings Section */}
          <section className="space-y-4">
            <button 
              onClick={toggleBasic}
              className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F48120] focus-visible:ring-offset-2 rounded-lg p-2 -ml-2"
              aria-expanded={showBasic}
              aria-controls="basic-settings"
            >
              <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                Configuración Básica
              </h3>
              <svg
                className={`w-5 h-5 text-neutral-500 transition-transform duration-200 ${showBasic ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            <div 
              id="basic-settings"
              className={`space-y-5 transition-all duration-300 ${showBasic ? 'opacity-100 max-h-[1000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}
              aria-hidden={!showBasic}
            >
              <SliderControl
                label="Temperatura"
                value={config.temperature}
                min={0}
                max={1}
                step={0.1}
                onChange={(value) => handleSliderChange('temperature', value)}
                tooltip="Controla la aleatoriedad de las respuestas. Valores más altos (0.8-1.0) generan respuestas más creativas y diversas, mientras que valores más bajos (0.2-0.4) producen respuestas más consistentes y deterministas."
              />
              
              <SliderControl
                label="Tokens Máximos"
                value={config.maxTokens}
                min={256}
                max={4096}
                step={256}
                formatValue={(v) => v.toLocaleString()}
                onChange={(value) => handleSliderChange('maxTokens', value)}
                tooltip="El número máximo de tokens que el modelo generará en una respuesta. Un valor más alto permite respuestas más largas pero consume más recursos."
              />
            </div>
          </section>

          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowBasic(!showBasic)}>
              <h3 className="text-sm font-medium">Configuración Básica</h3>
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                className="rounded-full"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showBasic ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </div>
            <div className={`space-y-4 transition-all duration-300 ${showBasic ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Temperatura</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.temperature}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Controla la aleatoriedad de las respuestas. Valores más altos (0.8-1.0) generan respuestas más creativas y diversas, mientras que valores más bajos (0.2-0.4) producen respuestas más consistentes y deterministas.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Tokens Máximos</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.maxTokens}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={config.maxTokens}
                        onChange={(e) => handleSliderChange('maxTokens', parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        El número máximo de tokens que el modelo generará en una respuesta. Un valor más alto permite respuestas más largas pero consume más recursos.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={toggleAdvanced}>
              <h3 className="text-sm font-medium">Configuración Avanzada</h3>
              <Button
                variant="ghost"
                size="sm"
                shape="square"
                className="rounded-full"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </Button>
            </div>
            <div className={`space-y-4 transition-all duration-300 ${showAdvanced ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
              {/* <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Temperatura</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.temperature}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={config.temperature}
                        onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
                        sideOffset={5}
                      >
                        Controla la aleatoriedad de las respuestas. Valores más altos (0.8-1.0) generan respuestas más creativas y diversas, mientras que valores más bajos (0.2-0.4) producen respuestas más consistentes y deterministas.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Tokens Máximos</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.maxTokens}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="256"
                        max="4096"
                        step="256"
                        value={config.maxTokens}
                        onChange={(e) => handleSliderChange('maxTokens', parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
                        sideOffset={5}
                      >
                        El número máximo de tokens que el modelo generará en una respuesta. Un valor más alto permite respuestas más largas pero consume más recursos.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div> */}

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Top P</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.topP}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={config.topP}
                        onChange={(e) => handleSliderChange('topP', parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Controla la diversidad de las respuestas mediante el muestreo de núcleo. Valores más altos (0.9-1.0) permiten más variedad, mientras que valores más bajos (0.1-0.3) hacen las respuestas más enfocadas.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Top K</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.topK}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        step="1"
                        value={config.topK}
                        onChange={(e) => handleSliderChange('topK', parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Limita el número de palabras más probables que el modelo puede elegir. Valores más bajos (1-10) producen respuestas más precisas, valores más altos (30-50) permiten más creatividad.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Penalización de Frecuencia</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.frequencyPenalty}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.frequencyPenalty}
                        onChange={(e) => handleSliderChange('frequencyPenalty', parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Reduce la probabilidad de que el modelo repita las mismas líneas. Valores más altos (1.0-2.0) penalizan más la repetición de palabras frecuentes.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span>Penalización de Presencia</span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.presencePenalty}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={config.presencePenalty}
                        onChange={(e) => handleSliderChange('presencePenalty', parseFloat(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Aumenta la probabilidad de que el modelo introduzca nuevos temas. Valores más altos (1.0-2.0) fomentan respuestas más diversas y exploratorias.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>

              <div>
                <label className="text-sm flex justify-between items-center">
                  <span className="flex flex-col">
                    <span>Semilla</span>
                    {/* <span className="text-xs text-neutral-600 dark:text-neutral-400">
                    Semilla aleatoria para reproducibilidad de la generación
                  </span> */}
                  </span>
                  <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-sm min-w-[40px] text-center">
                    {config.seed}
                  </span>
                </label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <input
                        type="range"
                        min="1"
                        max="9999999999"
                        step="1"
                        value={config.seed}
                        onChange={(e) => handleSliderChange('seed', parseInt(e.target.value))}
                        className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-70"
                        sideOffset={5}
                      >
                        Un valor numérico que determina la reproducibilidad de las respuestas. Usar el mismo valor de semilla con los mismos parámetros producirá respuestas similares.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>
            {/* <div className="space-y-4 mt-8 border-t cn('border-opacity-10', theme === 'dark' ? 'border-neutral-800' : 'border-gray-200')">
              <div className="flex items-center justify-between mt-4 mb-2">
                <label className="text-sm">Transmisión en tiempo real</label>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 bg-neutral-200 dark:bg-neutral-700 opacity-50 cursor-not-allowed`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1`}
                        />
                      </div>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
                        sideOffset={5}
                      >
                        Activa la transmisión en tiempo real de las respuestas, permitiendo ver el texto generado a medida que se produce.
                        Esta función estará disponible próximamente. Estamos trabajando para mejorar tu experiencia.
                        <Tooltip.Arrow className="fill-neutral-800" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
                <span className="text-xs text-[#F48120] ml-2">Próximamente</span>
              </div>
              <div className="mt-4 text-xs text-neutral-500 text-center">
                Potenciado por Tecnología IA Avanzada
              </div>
            </div> */}
          </div>
        </div>
      </div>

    </>
  );
}