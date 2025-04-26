import type { AIModelConfig } from './AIConfigContext';

export const config: AIModelConfig = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  frequencyPenalty: 0.3,
  presencePenalty: 0.3,
};