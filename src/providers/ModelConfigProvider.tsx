import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type ModelConfig = {
  max_tokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
  repetition_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
};

type ModelConfigContextType = {
  config: ModelConfig;
  updateConfig: (newConfig: ModelConfig) => void;
};

const defaultConfig: ModelConfig = {
  max_tokens: 256,
  temperature: 0.6,
  top_p: 1,
  top_k: 40,
  repetition_penalty: 1,
  frequency_penalty: 1,
  presence_penalty: 1
};

const ModelConfigContext = createContext<ModelConfigContextType | undefined>(undefined);

export function ModelConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ModelConfig>(() => {
    const savedConfig = localStorage.getItem('modelConfig');
    return savedConfig ? JSON.parse(savedConfig) : defaultConfig;
  });

  useEffect(() => {
    localStorage.setItem('modelConfig', JSON.stringify(config));
  }, [config]);

  const updateConfig = (newConfig: ModelConfig) => {
    setConfig(newConfig);
  };

  return (
    <ModelConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ModelConfigContext.Provider>
  );
}

export function useModelConfig() {
  const context = useContext(ModelConfigContext);
  if (!context) {
    throw new Error('useModelConfig debe ser usado dentro de un ModelConfigProvider');
  }
  return context;
}