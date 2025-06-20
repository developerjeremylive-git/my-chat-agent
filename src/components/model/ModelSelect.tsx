import React, { useState, useMemo, useCallback, lazy, Suspense, type JSX } from 'react';
import { Card } from '@/components/card/Card';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CaretDown, Brain, Robot, Code, Cloud, Copy, Check, Chats, Calculator } from '@phosphor-icons/react';
import { useModel } from '@/contexts/ModelContext';
import { FixedSizeList as List, areEqual } from 'react-window';
import { useDebounce } from 'use-debounce';
import { Search } from 'lucide-react';

interface Model {
  provider: string;
  name: string;
  description: string;
  params?: number;
  context?: string;
  features?: string[];
}

interface ModelSelectPropsTemp {
  className?: string;
  onModelChange: (modelName: string) => void;
}

interface ModelSelectProps {
  className?: string;
  mobile?: boolean;
}

// Move models to a separate file and import them for better code organization
const geminiModels: Model[] = [
  {
    provider: 'Google',
    name: 'gemini-2.0-flash',
    description: 'Modelo de última generación de Google con capacidades avanzadas de procesamiento en tiempo real, optimizado para respuestas rápidas y precisas con bajo consumo de recursos.',
    params: 2,
    context: '32K tokens',
    features: ['Baja Latencia', 'Alto Rendimiento', 'Eficiencia Energética', 'Multimodal']
  }
];

const reasoningModels: Model[] = [
  {
    provider: 'Meta',
    name: '@hf/meta-llama/meta-llama-3-8b-instruct',
    description: 'Modelo de última generación con capacidades mejoradas de razonamiento y seguimiento de instrucciones, optimizado para diálogo y tareas complejas.',
    params: 8,
    context: '128K tokens',
    features: ['Razonamiento Avanzado', 'Instrucciones', 'Multilingüe', 'Generación de Código']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-4-scout-17b-16e-instruct',
    description: 'Modelo multimodal nativo con arquitectura MoE de 17B parámetros y 16 expertos, optimizado para razonamiento y análisis multimodal.',
    params: 17,
    context: '10M tokens',
    features: ['Multimodal', 'Razonamiento', 'Visión', 'Multilingual']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    description: 'Modelo LLaMA de gran escala optimizado para velocidad con precisión FP8.',
    params: 70,
    context: '4K tokens',
    features: ['Alto Rendimiento', 'Optimización FP8', 'Instrucciones']
  },
  {
    provider: 'Qwen',
    name: '@cf/qwen/qwen2.5-coder-32b-instruct',
    description: 'Modelo de última generación especializado en programación y razonamiento técnico, con capacidades avanzadas de generación de código.',
    params: 32,
    context: '128K tokens',
    features: ['Programación', 'Razonamiento Técnico', 'Generación de Código']
  },
  {
    provider: 'Mistral AI',
    name: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    description: 'Modelo de última generación con capacidades multimodales y de visión, optimizado para razonamiento avanzado y comprensión de contexto largo.',
    params: 24,
    context: '128K tokens',
    features: ['Multimodal', 'Visión', 'Razonamiento', 'Contexto Largo']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.2-11b-vision-instruct',
    description: 'Modelo especializado en tareas de visión y comprensión multimodal con capacidades de instrucción mejoradas.',
    params: 11,
    context: '32K tokens',
    features: ['Visión', 'Multimodal', 'Instrucciones']
  },
  {
    provider: 'Qwen',
    name: '@cf/qwen/qwq-32b',
    description: 'Modelo versátil de 32B parámetros con capacidades avanzadas de procesamiento de lenguaje y razonamiento.',
    params: 32,
    context: '32K tokens',
    features: ['Razonamiento', 'Versatilidad', 'Alto Rendimiento']
  },
  {
    provider: 'FBL',
    name: '@cf/fblgit/una-cybertron-7b-v2-bf16',
    description: 'Modelo basado en MistralAI con alineación neural uniforme (UNA), destacado en matemáticas, lógica y razonamiento profundo.',
    params: 7,
    context: '32K tokens',
    features: ['Razonamiento', 'Matemáticas', 'Lógica']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-guard-3-8b',
    description: 'Modelo especializado en seguridad y evaluación de contenido, con capacidades de filtrado y moderación.',
    params: 8,
    context: '8K tokens',
    features: ['Seguridad', 'Moderación', 'Evaluación']
  },
  {
    provider: 'Mistral AI',
    name: '@hf/mistral/mistral-7b-instruct-v0.2',
    description: 'Versión mejorada del modelo Mistral con mejor rendimiento en tareas de instrucción y razonamiento.',
    params: 7,
    context: '32K tokens',
    features: ['Instrucciones', 'Razonamiento', 'Eficiencia']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3-8b-instruct',
    description: 'Modelo de última generación optimizado para diálogo y tareas complejas, con capacidades mejoradas de razonamiento y comprensión contextual.',
    params: 8,
    context: '128K tokens',
    features: ['Razonamiento Avanzado', 'Diálogo', 'Instrucciones', 'Multilingüe']
  }
];

const distilledModels: Model[] = [
  {
    provider: 'DeepSeek / Meta',
    name: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    description: 'Modelo optimizado basado en la arquitectura Qwen, equilibrando rendimiento y eficiencia.',
    params: 32,
    context: '4K tokens',
    features: ['Destilación', 'Multilingüe', 'Generación de Código']
  },
  {
    provider: 'Google',
    name: '@cf/google/gemma-7b-it-lora',
    description: 'Modelo de Google con ajuste fino mediante LoRA para instrucciones.',
    params: 7,
    context: '8K tokens',
    features: ['LoRA', 'Instrucciones', 'Eficiencia']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3-8b-instruct-awq',
    description: 'Modelo LLaMA 3 optimizado con cuantización AWQ, ofreciendo alto rendimiento con menor consumo de memoria y excelente capacidad de razonamiento.',
    params: 8,
    context: '8K tokens',
    features: ['Optimización AWQ', 'Razonamiento', 'Eficiencia']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.1-8b-instruct',
    description: 'Versión optimizada del modelo LLaMA 3.1 con mejoras en eficiencia y rendimiento multilingüe.',
    params: 8,
    context: '128K tokens',
    features: ['Multilingüe', 'Eficiencia', 'Instrucciones']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.2-3b-instruct',
    description: 'Versión compacta y eficiente del modelo LLaMA, optimizada para tareas de instrucción.',
    params: 3,
    context: '4K tokens',
    features: ['Eficiencia', 'Instrucciones', 'Compacto']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.1-8b-instruct-awq',
    description: 'Versión optimizada con cuantización AWQ del modelo LLaMA 3.1, manteniendo alto rendimiento con menor huella de memoria.',
    params: 8,
    context: '4K tokens',
    features: ['Optimización AWQ', 'Eficiencia', 'Instrucciones']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.1-8b-instruct-fp8',
    description: 'Modelo LLaMA optimizado con cuantización FP8 para mejor eficiencia y rendimiento.',
    params: 8,
    context: '4K tokens',
    features: ['Optimización FP8', 'Eficiencia', 'Instrucciones']
  },
  {
    provider: 'Meta',
    name: '@cf/meta/llama-3.2-1b-instruct',
    description: 'Modelo ultraligero optimizado para dispositivos con recursos limitados, ideal para aplicaciones de baja latencia.',
    params: 1,
    context: '4K tokens',
    features: ['Ultraligero', 'Baja Latencia', 'Eficiencia']
  }
];

const allModels: Model[] = [...geminiModels, ...reasoningModels, ...distilledModels];

// Memoize the model lists
const MODEL_LISTS = {
  gemini: geminiModels,
  reasoning: reasoningModels,
  distilled: distilledModels
} as const;

type ModelCategory = keyof typeof MODEL_LISTS;

// Model item component with memoization
const ModelItem = React.memo(({
  model,
  isSelected,
  onSelect,
  onCopy,
  isCopied
}: {
  model: Model;
  isSelected: boolean;
  onSelect: (model: Model) => void;
  onCopy: (e: React.MouseEvent, modelName: string) => void;
  isCopied: boolean;
}) => {
  const getProviderIcon = useCallback((provider: string) => {
    switch (provider) {
      case 'DeepSeek / Meta':
        return <Brain className="w-5 h-5 text-blue-500" weight="duotone" />;
      case 'Meta':
        return <Robot className="w-5 h-5 text-purple-500" weight="duotone" />;
      case 'Google':
        return <Robot className="w-5 h-5 text-green-500" weight="duotone" />;
      case 'Alibaba Cloud':
      case 'Mistral AI':
        return <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />;
      case 'Qwen':
        return <Chats className="w-5 h-5 text-red-500" weight="duotone" />;
      case 'FBL':
        return <Calculator className="w-5 h-5 text-blue-500" weight="duotone" />;
      default:
        return <Code className="w-5 h-5 text-neutral-500" weight="duotone" />;
    }
  }, []);

  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <div className="flex items-center gap-2 w-full">
          <div className="flex-shrink-0">
            {getProviderIcon(model.provider)}
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300 truncate">{model.name}</p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">{model.provider}</p>
          </div>
        </div>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          className="bg-neutral-900/95 text-white px-4 py-3 rounded-xl text-sm max-w-xs z-50 border border-neutral-700/50 shadow-2xl backdrop-blur-xl dark:shadow-[#F48120]/5"
          sideOffset={5}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">{model.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => onCopy(e, model.name)}
                  className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                >
                  {isCopied ?
                    <Check className="w-3.5 h-3.5 text-green-500" weight="bold" /> :
                    <Copy className="w-3.5 h-3.5 text-neutral-400" weight="regular" />
                  }
                  <span className="text-neutral-400 text-[10px]">Copiar ID</span>
                </button>
              </div>
            </div>
            <div className="pt-2 border-t border-neutral-800">
              <p className="text-sm text-neutral-300">{model.description}</p>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Parámetros</span>
              <span className="text-neutral-200">{model.params}B</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Contexto</span>
              <span className="text-neutral-200">{model.context}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">LIMITS</span>
              <div className="flex items-center gap-2">
                <span className="text-neutral-200">30 / minute</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-200">1k / day</span>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">RELEASED</span>
              <span className="text-neutral-200">March 5, 2025</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {model.features?.map((feature) => (
                <span
                  key={feature}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}, areEqual);

// Virtualized list for better performance with many items
const ModelList = React.memo(({
  models,
  selectedModel,
  onSelect,
  onCopy,
  copiedModel
}: {
  models: Model[];
  selectedModel: Model | null;
  onSelect: (model: Model) => void;
  onCopy: (e: React.MouseEvent, modelName: string) => void;
  copiedModel: string | null;
}) => {
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const model = models[index];
    if (!model) return null;

    return (
      <div style={style}>
        <DropdownMenu.Item
          className={cn(
            'flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer outline-none',
            'hover:bg-neutral-50 dark:hover:bg-neutral-800',
            'focus:bg-neutral-50 dark:focus:bg-neutral-800',
            'transition-all duration-200 hover:scale-[0.99]',
            selectedModel?.name === model.name && 'bg-neutral-100/80 dark:bg-neutral-800 shadow-sm dark:shadow-neutral-950'
          )}
          onClick={() => onSelect(model)}
        >
          <ModelItem
            model={model}
            isSelected={selectedModel?.name === model.name}
            onSelect={onSelect}
            onCopy={(e) => onCopy(e, model.name)}
            isCopied={copiedModel === model.name}
          />
        </DropdownMenu.Item>
      </div>
    );
  }, [models, selectedModel, onSelect, onCopy, copiedModel]);

  return (
    <div className="h-auto max-h-[280px] overflow-y-auto py-1">
      <div className="space-y-0.5 px-1">
        {models.map((model, index) => (
          <div key={model.name}>
            <DropdownMenu.Item
              className={cn(
                'flex flex-col gap-1 px-2 py-1.5 rounded-lg cursor-pointer outline-none',
                'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                'focus:bg-neutral-50 dark:focus:bg-neutral-800',
                'transition-all duration-200',
                selectedModel?.name === model.name && 'bg-neutral-100/80 dark:bg-neutral-800 shadow-sm dark:shadow-neutral-950'
              )}
              onClick={() => onSelect(model)}
            >
              <ModelItem
                model={model}
                isSelected={selectedModel?.name === model.name}
                onSelect={onSelect}
                onCopy={(e) => onCopy(e, model.name)}
                isCopied={copiedModel === model.name}
              />
            </DropdownMenu.Item>
          </div>
        ))}
      </div>
    </div>
  );
}, areEqual);

// Main component
export function ModelSelect({ className, mobile = false }: ModelSelectProps) {
  const { selectedModel: contextModel, setSelectedModel: setContextModel } = useModel();
  const [selectedModel, setSelectedModel] = React.useState<Model>(
    geminiModels.find(model => model.name === contextModel) || geminiModels[0]
  );
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 300);
  const [copiedModel, setCopiedModel] = React.useState<string | null>(null);

  // Group models by category
  const modelCategories = React.useMemo(() => ({
    gemini: geminiModels,
    reasoning: reasoningModels,
    distilled: distilledModels
  }), []);

  // Filter models based on search query (using debounced search for better performance)
  const filteredModels = React.useMemo(() => {
    if (!debouncedSearchQuery.trim()) return modelCategories;

    const query = debouncedSearchQuery.toLowerCase();
    return Object.entries(modelCategories).reduce((acc, [category, models]) => {
      const filtered = models.filter(model =>
        model.name.toLowerCase().includes(query) ||
        model.provider.toLowerCase().includes(query) ||
        model.description.toLowerCase().includes(query) ||
        (model.features?.some((f: string) => f.toLowerCase().includes(query)) || false)
      );
      if (filtered.length > 0) {
        acc[category as keyof typeof modelCategories] = filtered;
      }
      return acc;
    }, {} as typeof modelCategories);
  }, [debouncedSearchQuery, modelCategories]);

  // Filter models based on real-time search query (for instant feedback)
  const filteredModelsRealTime = React.useMemo(() => {
    if (!searchQuery.trim()) return modelCategories;

    const searchLower = searchQuery.toLowerCase();
    return Object.entries(modelCategories).reduce((acc, [category, models]) => {
      const filtered = models.filter(model =>
        model.name.toLowerCase().includes(searchLower) ||
        model.provider.toLowerCase().includes(searchLower) ||
        model.description.toLowerCase().includes(searchLower) ||
        (model.features?.some(f => f.toLowerCase().includes(searchLower)) || false)
      );
      if (filtered.length > 0) {
        acc[category as keyof typeof modelCategories] = filtered;
      }
      return acc;
    }, {} as typeof modelCategories);
  }, [searchQuery, modelCategories]);

  // Check if any models match the search queries
  const hasSearchResults = Object.values(filteredModels).some(models => models.length > 0);
  const hasRealTimeSearchResults = Object.values(filteredModelsRealTime).some(models => models.length > 0);

  // Handle model selection
  const handleSelectModel = useCallback((model: Model) => {
    setSelectedModel(model);
    setContextModel(model.name);
  }, [setContextModel]);

  // const handleSelectModel = useCallback(async (model: Model) => {
  //   try {
  //     // Update local state immediately for better UX
  //     setSelectedModel(model);
  //     setContextModel(model.name);

  //     // Update the model on the server
  //     const response = await fetch('/api/model', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ modelTemp: model.name })
  //     });

  //     if (!response.ok) {
  //       const error = await response.json();
  //       console.error('Failed to update model:', error);
  //       // Optionally show an error message to the user here
  //     }
  //   } catch (error) {
  //     console.error('Error updating model:', error);
  //     // Optionally show an error message to the user here
  //   }
  // }, [setContextModel]);

  // Handle copy model name
  const handleCopy = useCallback(async (e: React.MouseEvent, modelName: string) => {
    e?.stopPropagation?.(); // Safely call stopPropagation if event exists
    try {
      await navigator.clipboard.writeText(modelName);
      setCopiedModel(modelName);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedModel(null), 2000);
    } catch (error) {
      console.error('Error copying model name:', error);
    }
  }, []);

  // Get provider icon
  const getProviderIcon = useCallback((provider: string) => {
    switch (provider) {
      case 'DeepSeek / Meta':
        return <Brain className="w-5 h-5 text-blue-500" weight="duotone" />;
      case 'Meta':
        return <Robot className="w-5 h-5 text-purple-500" weight="duotone" />;
      case 'Google':
        return <Robot className="w-5 h-5 text-green-500" weight="duotone" />;
      case 'Alibaba Cloud':
      case 'Mistral AI':
        return <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />;
      case 'Qwen':
        return <Chats className="w-5 h-5 text-red-500" weight="duotone" />;
      case 'FBL':
        return <Calculator className="w-5 h-5 text-blue-500" weight="duotone" />;
      default:
        return <Code className="w-5 h-5 text-neutral-500" weight="duotone" />;
    }
  }, []);

  return (
    <Tooltip.Provider>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div
            className={cn(
              'group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer w-full',
              'bg-white dark:bg-neutral-900/50',
              'border border-neutral-200 dark:border-neutral-800',
              'hover:bg-gradient-to-r hover:from-[#F48120]/5 hover:to-purple-500/5 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10',
              'hover:border-[#F48120] dark:hover:border-[#F48120]/50',
              'transition-all duration-300 ease-in-out',
              'shadow-sm hover:shadow-lg hover:shadow-[#F48120]/5 dark:hover:shadow-[#F48120]/10',
              'hover:scale-[1.02] active:scale-[0.98]',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F48120]/50',
              className
            )}
            aria-label="Seleccionar modelo"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {getProviderIcon(selectedModel.provider)}
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate">
                {selectedModel.name.split('/').pop()}
              </span>
            </div>
            <div className="flex-shrink-0 ml-2 transition-transform group-hover:translate-y-0.5">
              <CaretDown className="w-4 h-4 text-neutral-500" />
            </div>
          </div>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className={cn(
              'overflow-hidden bg-white/95 dark:bg-neutral-900/95 rounded-xl shadow-2xl border border-neutral-200/70 dark:border-neutral-700/50 backdrop-blur-xl',
              'transform transition-all duration-200 ease-out',
              'z-50',
              mobile ? 'w-[calc(100vw-2rem)]' : 'w-[90vw] max-w-4xl',
              'flex flex-col',
              'animate-in fade-in-80 data-[side=bottom]:slide-in-from-top-2',
              mobile ? 'mx-auto max-h-[80vh]' : 'max-h-[80vh]',
              'focus:outline-none'
            )}
            side={mobile ? 'bottom' : 'bottom'}
            sideOffset={mobile ? 8 : 8}
            align={mobile ? 'center' : 'center'}
            collisionPadding={16}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              maxHeight: mobile ? 'calc(54vh - 100px)' : '70vh',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Search Bar */}
            <div className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-neutral-200/70 dark:border-neutral-700/50 p-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-neutral-400" />
                </div>
                <input
                  type="text"
                  className={cn(
                    'block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg',
                    'bg-white/50 dark:bg-neutral-800/50',
                    'text-sm text-neutral-900 dark:text-white',
                    'placeholder-neutral-400 dark:placeholder-neutral-500',
                    'focus:outline-none focus:ring-2 focus:ring-[#F48120]/50 focus:border-transparent',
                    'transition-all duration-200'
                  )}
                  placeholder="Buscar modelos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Buscar modelos"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-label="Limpiar búsqueda"
                  >
                    <svg
                      className="h-4 w-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Model Lists */}
            <div className="flex-1 overflow-y-auto p-2">
              {!hasSearchResults ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Search className="h-10 w-10 text-neutral-400 mb-3" />
                  <h3 className="text-sm font-medium text-neutral-900 dark:text-white">No se encontraron modelos</h3>
                  <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    No hay coincidencias para "{searchQuery}"
                  </p>
                </div>
              ) : (
                <>
                  {Object.entries(filteredModels).map(([category, models]) => {
                    if (models.length === 0) return null;

                    const categoryInfo = {
                      gemini: {
                        title: 'Modelos Gemini',
                        description: 'Modelos eficientes y optimizados para rendimiento',
                        color: 'text-purple-500 dark:text-purple-400'
                      },
                      reasoning: {
                        title: 'Modelos de Razonamiento Avanzado',
                        description: 'Modelos optimizados para tareas complejas y razonamiento avanzado',
                        color: 'text-[#F48120] dark:text-[#F48120]'
                      },
                      distilled: {
                        title: 'Modelos Destilados y Optimizados',
                        description: 'Modelos eficientes y optimizados para rendimiento',
                        color: 'text-purple-500 dark:text-purple-400'
                      }
                    }[category as ModelCategory];

                    return (
                      <div key={category} className="mb-6 last:mb-0">
                        <div className="sticky top-0 z-10 px-3 py-2 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
                          <h3 className={`text-sm font-semibold ${categoryInfo.color} mb-1`}>
                            {categoryInfo.title}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {categoryInfo.description}
                          </p>
                        </div>
                        <div className="mt-1">
                          <ModelList
                            models={models}
                            selectedModel={selectedModel}
                            onSelect={handleSelectModel}
                            onCopy={(e, modelName) => handleCopy(e, modelName)}
                            copiedModel={copiedModel}
                          />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
            {/* {Object.entries(filteredModels).map(([category, models]) => (
              <div key={category}>
                <div className="mt-4 mb-2 px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold text-[#F48120] dark:text-[#F48120] mb-1">{category}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Modelos optimizados para tareas complejas y razonamiento avanzado</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
                  {models.map((model) => (
                    <DropdownMenu.Item
                      key={model.name}
                      className={cn(
                        'flex flex-col gap-1 px-3 py-2.5 rounded-lg cursor-pointer outline-none',
                        'hover:bg-neutral-50 dark:hover:bg-neutral-800',
                        'focus:bg-neutral-50 dark:focus:bg-neutral-800',
                        'transition-all duration-200 hover:scale-[0.99]',
                        selectedModel.name === model.name && 'bg-neutral-100/80 dark:bg-neutral-800 shadow-sm dark:shadow-neutral-950'
                      )}
                      onClick={async () => {
                        try {
                          setSelectedModel(model);
                          setContextModel(model.name);
                          // onModelChange(model.name);
                        } catch (error) {
                          console.error('Error al actualizar el modelo:', error);
                        }
                      }}
                    >
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <div className="flex items-center gap-2">
                            {model.provider === 'DeepSeek / Meta' && <Brain className="w-5 h-5 text-blue-500" weight="duotone" />}
                            {model.provider === 'Meta' && <Robot className="w-5 h-5 text-purple-500" weight="duotone" />}
                            {model.provider === 'Google' && <Robot className="w-5 h-5 text-green-500" weight="duotone" />}
                            {model.provider === 'Alibaba Cloud' && <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />}
                            {model.provider === 'Mistral AI' && <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />}
                            {model.provider === 'Qwen' && <Chats className="w-5 h-5 text-red-500" weight="duotone" />}
                            {model.provider === 'FBL' && <Calculator className="w-5 h-5 text-blue-500" weight="duotone" />}
                            <div className="flex flex-col">
                              <span className="text-xs text-neutral-600 dark:text-neutral-400">{model.provider}</span>
                              <span className="text-sm font-medium dark:text-white">{model.name}</span>
                            </div>
                          </div>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-neutral-900/95 text-white px-4 py-3 rounded-xl text-sm max-w-xs z-50 border border-neutral-700/50 shadow-2xl backdrop-blur-xl dark:shadow-[#F48120]/5"
                            sideOffset={5}
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">{model.name}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopy(e, model.name);
                                    }}
                                    className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                                  >
                                    {copiedModel === model.name ?
                                      <Check className="w-3.5 h-3.5 text-green-500" weight="bold" /> :
                                      <Copy className="w-3.5 h-3.5 text-neutral-400" weight="regular" />
                                    }
                                    <span className="text-neutral-400 text-[10px]">Copiar ID</span>
                                  </button>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-neutral-800">
                                <p className="text-sm text-neutral-300">{model.description}</p>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">Parámetros</span>
                                <span className="text-neutral-200">{model.params}B</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">Contexto</span>
                                <span className="text-neutral-200">{model.context}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">LIMITS</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-neutral-200">30 / minute</span>
                                  <span className="text-neutral-500">•</span>
                                  <span className="text-neutral-200">1k / day</span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-neutral-400">RELEASED</span>
                                <span className="text-neutral-200">March 5, 2025</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {model.features?.map((feature) => (
                                  <span
                                    key={feature}
                                    className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </DropdownMenu.Item>
                  ))}
                </div>
              </div>
            ))} */}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </Tooltip.Provider>
  );
}