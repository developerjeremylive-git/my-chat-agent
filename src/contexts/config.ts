import type { AIModelConfig } from './AIConfigContext';

export const config: AIModelConfig = {
  temperature: 0.7,
  maxTokens: 1024,  // Reduced to be safer with token limits
  topP: 0.95,
  topK: 40,
  frequencyPenalty: 0,
  presencePenalty: 0,
  seed: 42,
  stream: true,
  maxSteps: 1  // Maximum number of steps for the model to take
};