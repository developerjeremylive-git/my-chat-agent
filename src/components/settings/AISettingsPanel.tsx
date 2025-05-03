import { Button } from '@/components/button/Button';
import { Card } from '@/components/card/Card';
import { X } from '@phosphor-icons/react';
import { useAIConfig } from '@/contexts/AIConfigContext';
import { cn } from '@/lib/utils';

interface AIModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
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
      presencePenalty: 0.5
    }
  },
  {
    name: 'Preciso',
    description: 'Respuestas más deterministas y consistentes',
    config: {
      temperature: 0.3,
      maxTokens: 1024,
      topP: 0.8,
      topK: 5,
      frequencyPenalty: 0.1,
      presencePenalty: 0.1
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
      presencePenalty: 0.2
    }
  },
  {
    name: 'Balanceado',
    description: 'Configuración equilibrada para uso general',
    config: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      topK: 15,
      frequencyPenalty: 0.3,
      presencePenalty: 0.3
    }
  }
];

interface AISettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISettingsPanel({ isOpen, onClose }: AISettingsPanelProps) {
  const { config, setConfig } = useAIConfig();

  const handlePresetSelect = (preset: PresetConfig) => {
    setConfig(preset.config);
  };

  const handleSliderChange = (key: keyof AIModelConfig, value: number) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-y-0 right-0 z-50 w-80 transform transition-transform duration-300 ease-in-out shadow-2xl',
          'bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 overflow-y-auto',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center sticky top-0 bg-white dark:bg-neutral-900 z-10">
        <h2 className="text-lg font-semibold">Configuración del Modelo AI</h2>
        <Button
          variant="ghost"
          size="sm"
          shape="square"
          className="rounded-full"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
      </div>

      <div className="p-4 space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Configuraciones Predefinidas</h3>
          <div className="grid gap-3">
            {presets.map((preset) => (
              <Card
                key={preset.name}
                className={`p-3 cursor-pointer transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 ${JSON.stringify(config) === JSON.stringify(preset.config) ? 'border-[#F48120]' : ''}`}
                onClick={() => handlePresetSelect(preset)}
              >
                <h4 className="font-medium">{preset.name}</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {preset.description}
                </p>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-medium">Configuración Avanzada</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm flex justify-between">
                Temperatura: {config.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature}
                onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex justify-between">
                Tokens Máximos: {config.maxTokens}
              </label>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={config.maxTokens}
                onChange={(e) => handleSliderChange('maxTokens', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex justify-between">
                Top P: {config.topP}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config.topP}
                onChange={(e) => handleSliderChange('topP', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex justify-between">
                Top K: {config.topK}
              </label>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={config.topK}
                onChange={(e) => handleSliderChange('topK', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex justify-between">
                Penalización de Frecuencia: {config.frequencyPenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.frequencyPenalty}
                onChange={(e) => handleSliderChange('frequencyPenalty', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex justify-between">
                Penalización de Presencia: {config.presencePenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.presencePenalty}
                onChange={(e) => handleSliderChange('presencePenalty', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
    </>
  );
}