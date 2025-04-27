import type { AIModelConfig } from '@/contexts/AIConfigContext';

declare module 'agents/react' {
  export interface UseAgentOptions<T = unknown> {
    agent: string;
    config?: AIModelConfig;
    stream?: boolean;
    onToken?: (token: string) => void;
    onStreamEnd?: () => void;
  }

  export function useAgent<T>(options: UseAgentOptions<T>): T;
}