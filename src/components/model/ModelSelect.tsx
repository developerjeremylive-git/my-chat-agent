import React, { useState } from 'react';
import { Card } from '@/components/card/Card';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import { CaretDown, Brain, Robot, Code, Cloud, Copy, Check, Chats, Calculator } from '@phosphor-icons/react';
import { useModel } from '@/contexts/ModelContext';

interface Model {
  provider: string;
  name: string;
  description: string;
  params?: number;
  context?: string;
  features?: string[];
}

interface ModelSelectProps {
  className?: string;
  onModelChange: (modelName: string) => void;
}

// Modelos de Google Gemini
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

// Modelos de Razonamiento Avanzado
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

// Modelos Destilados y Optimizados
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

const models: Model[] = [...geminiModels, ...reasoningModels, ...distilledModels];

export function ModelSelect({ className, onModelChange }: ModelSelectProps) {
  const { selectedModel: contextModel, setSelectedModel: setContextModel } = useModel();
  const [selectedModel, setSelectedModel] = useState<Model>(
    models.find(model => model.name === contextModel) || models[0]
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = (modelName: string) => {
    navigator.clipboard.writeText(modelName);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Tooltip.Provider>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <div className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer',
            'bg-white dark:bg-neutral-900/50',
            'border border-neutral-200 dark:border-neutral-800',
            'hover:bg-gradient-to-r hover:from-[#F48120]/5 hover:to-purple-500/5 dark:hover:from-[#F48120]/10 dark:hover:to-purple-500/10',
            'hover:border-[#F48120] dark:hover:border-[#F48120]/50',
            'transition-all duration-300 ease-in-out',
            'shadow-sm hover:shadow-lg hover:shadow-[#F48120]/5 dark:hover:shadow-[#F48120]/10',
            'hover:scale-[1.02]',
            className
          )}>
            <div className="flex items-center justify-center">
              {selectedModel.provider === 'DeepSeek / Meta' && <Brain className="w-5 h-5 text-blue-500" weight="duotone" />}
              {selectedModel.provider === 'Meta' && <Robot className="w-5 h-5 text-purple-500" weight="duotone" />}
              {selectedModel.provider === 'Google' && <Robot className="w-5 h-5 text-green-500" weight="duotone" />}
              {selectedModel.provider === 'Alibaba Cloud' && <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />}
              {selectedModel.provider === 'Mistral AI' && <Cloud className="w-5 h-5 text-orange-500" weight="duotone" />}
              {selectedModel.provider === 'Qwen' && <Chats className="w-5 h-5 text-red-500" weight="duotone" />}

            </div>
            <div className="flex items-center gap-2">
              <CaretDown className="w-4 h-4 text-neutral-500" />
            </div>
            {/* <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(selectedModel.name);
              }}
              className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              {copied ? 
                <Check className="w-4 h-4 text-green-500" weight="bold" /> :
                <Copy className="w-4 h-4 text-neutral-500" weight="regular" />
              }
            </button> */}
          </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[600px] max-h-[85vh] overflow-y-auto bg-white/95 dark:bg-neutral-900/95 rounded-xl p-2 shadow-xl border border-neutral-200 dark:border-neutral-700/50 z-50 backdrop-blur-xl ml-4 scrollbar-thin scrollbar-thumb-[#F48120] scrollbar-track-transparent hover:scrollbar-thumb-[#F48120]/80 md:min-w-[800px]"
            sideOffset={5}
          > 
            {/* geminiModels   */}
            <div className="mt-4 mb-2 px-3 py-2">
              <h3 className="text-sm font-semibold text-purple-500 dark:text-purple-400 mb-1">Modelos Gemini</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Modelos eficientes y optimizados para rendimiento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
              {geminiModels.map((model) => (
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
                      onModelChange?.(model.name);
                      setSelectedModel(model);
                      setContextModel(model.name);
                    } catch (error) {
                      console.error('Error al actualizar el modelo:', error);
                    }
                  }}
                >
                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <div className="flex items-center gap-2">
                        {model.provider === 'Google' && <Robot className="w-5 h-5 text-green-500" weight="duotone" />}
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
                                  handleCopy(model.name);
                                }}
                                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                              >
                                {copied ?
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
            <div className="mt-4 mb-2 px-3 py-2  border-t border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-[#F48120] dark:text-[#F48120] mb-1">Modelos de Razonamiento Avanzado</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Modelos optimizados para tareas complejas y razonamiento avanzado</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
              {reasoningModels.map((model) => (
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
                      onModelChange?.(model.name);
                      setSelectedModel(model);
                      setContextModel(model.name);
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
                                  handleCopy(model.name);
                                }}
                                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                              >
                                {copied ?
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
            <div className="mt-4 mb-2 px-3 py-2 border-t border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-semibold text-purple-500 dark:text-purple-400 mb-1">Modelos Destilados y Optimizados</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Modelos eficientes y optimizados para rendimiento</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 px-2">
              {distilledModels.map((model) => (
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
                      onModelChange?.(model.name);
                      setSelectedModel(model);
                      setContextModel(model.name);
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
                                  handleCopy(model.name);
                                }}
                                className="p-1 rounded-lg hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
                              >
                                {copied ?
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
          </DropdownMenu.Content>
        </DropdownMenu.Portal>

      </DropdownMenu.Root>
    </Tooltip.Provider>
  );
}