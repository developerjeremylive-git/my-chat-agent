import { useState } from 'react';
import { Modal } from '@/components/modal/Modal';
import { Input } from '@/components/input/Input';
import { Button } from '@/components/button/Button';

type ModelConfigProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ModelConfig) => void;
};

type ModelConfig = {
  max_tokens: number;
  temperature: number;
  top_p: number;
  top_k: number;
  repetition_penalty: number;
  frequency_penalty: number;
  presence_penalty: number;
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

export function ModelConfig({ isOpen, onClose, onSave }: ModelConfigProps) {
  const [config, setConfig] = useState<ModelConfig>(defaultConfig);

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-semibold mb-4">Configuración del Modelo AI</h2>
      <div className="space-y-4 p-4">
        <div>
          <label className="text-sm font-medium">Tokens Máximos</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, max_tokens: Number(value) })}
            type="number"
            value={config.max_tokens}
            onChange={(e) => setConfig({ ...config, max_tokens: Number(e.target.value) })}
            min={1}
            max={2048}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Temperatura</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, temperature: Number(value) })}
            type="number"
            value={config.temperature}
            onChange={(e) => setConfig({ ...config, temperature: Number(e.target.value) })}
            min={0}
            max={5}
            step={0.1}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Top P</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, top_p: Number(value) })}
            type="number"
            value={config.top_p}
            onChange={(e) => setConfig({ ...config, top_p: Number(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Top K</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, top_k: Number(value) })}
            type="number"
            value={config.top_k}
            onChange={(e) => setConfig({ ...config, top_k: Number(e.target.value) })}
            min={1}
            max={50}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Penalización por Repetición</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, repetition_penalty: Number(value) })}
            type="number"
            value={config.repetition_penalty}
            onChange={(e) => setConfig({ ...config, repetition_penalty: Number(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Penalización por Frecuencia</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, frequency_penalty: Number(value) })}
            type="number"
            value={config.frequency_penalty}
            onChange={(e) => setConfig({ ...config, frequency_penalty: Number(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Penalización por Presencia</label>
          <Input
            onValueChange={(value) => setConfig({ ...config, presence_penalty: Number(value) })}
            type="number"
            value={config.presence_penalty}
            onChange={(e) => setConfig({ ...config, presence_penalty: Number(e.target.value) })}
            min={0}
            max={2}
            step={0.1}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={onClose} variant="secondary">Cancelar</Button>
          <Button onClick={handleSave}>Guardar</Button>
        </div>
      </div>
    </Modal>
  );
}