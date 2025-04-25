import { Select } from "../select/Select";
import { useState, useEffect } from "react";

const AI_MODELS = [
  { value: "@cf/deepseek-ai/deepseek-r1-distill-qwen-32b" },
  { value: "@cf/google/gemma-7b-it-lora" },
  { value: "@cf/hf/mistral/mistral-7b-instruct-v0.2" },
  { value: "@cf/fblgit/una-cybertron-7b-v2-bf16" },
  { value: "@cf/meta/llama-3-8b-instruct" },
  { value: "@cf/meta/llama-3-8b-instruct-awq" },
  { value: "@hf/meta-llama/meta-llama-3-8b-instruct" },
  { value: "@cf/meta/llama-3.1-8b-instruct" },
  { value: "@cf/meta/llama-3.1-8b-instruct-fp8" },
  { value: "@cf/meta/llama-3.1-8b-instruct-awq" },
  { value: "@cf/meta/llama-3.2-3b-instruct" },
  { value: "@cf/meta/llama-3.2-1b-instruct" },
  { value: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" },
];

export const ModelSelector = () => {
  const [selectedModel, setSelectedModel] = useState("@cf/meta/llama-3.2-1b-instruct");

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    // Aquí podemos agregar la lógica para actualizar el modelo en el servidor
    fetch("/api/set-model", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: value }),
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Modelo de IA</label>
      <Select
        options={AI_MODELS}
        value={selectedModel}
        setValue={handleModelChange}
        placeholder="Selecciona un modelo"
        className="w-full"
      />
    </div>
  );
};