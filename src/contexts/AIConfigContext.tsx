import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";

export interface AIModelConfig {
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
  frequencyPenalty: number;
  presencePenalty: number;
  seed: number;
  stream: boolean;
  // maxSteps: number;
}

export interface AIConfigContextType {
  config: AIModelConfig;
  setConfig: (config: AIModelConfig) => void;
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(
  undefined
);

export function useAIConfig() {
  const context = useContext(AIConfigContext);
  if (!context) {
    throw new Error("useAIConfig debe ser usado dentro de un AIConfigProvider");
  }
  return context;
}

export interface AIConfigProviderProps {
  children: ReactNode;
}

export function AIConfigProvider({ children }: AIConfigProviderProps) {
  const [config, setConfig] = useState<AIModelConfig>(() => {
    const savedConfig = localStorage.getItem("modelConfig");
    return savedConfig
      ? JSON.parse(savedConfig)
      : {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          topK: 1,
          frequencyPenalty: 0.3,
          presencePenalty: 0.3,
          seed: 1,
          stream: true,
          // maxSteps: 1,
        };
  });

  useEffect(() => {
    localStorage.setItem("modelConfig", JSON.stringify(config));
  }, [config]);

  return (
    <AIConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </AIConfigContext.Provider>
  );
}
