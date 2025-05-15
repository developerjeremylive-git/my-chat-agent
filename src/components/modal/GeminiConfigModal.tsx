import { useState } from 'react';
import { Modal } from './Modal';
import { Input } from '../input/Input';
import { Button } from '../button/Button';
import { Key, Robot } from '@phosphor-icons/react';

interface GeminiConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function GeminiConfigModal({ isOpen, onClose }: GeminiConfigModalProps) {
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('@cf/google/gemma-7b-it-lora');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch('/api/gemini-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ apiKey, model }),
            });

            if (response.ok) {
                onClose();
            } else {
                console.error('Error al configurar Gemini API');
            }
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración de Gemini API" hideSubmitButton={true}>
            <div className="p-6 bg-ob-btn-secondary-bg/5 rounded-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-ob-base-300 font-medium">
                            <Key weight="bold" className="w-5 h-5 text-orange-500" />
                            API Key de Gemini
                        </label>
                        <Input
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Ingresa tu clave API segura"
                            required
                            className="w-full"
                            size="md"
                        />
                        <p className="text-sm text-ob-base-100">Tu clave API será encriptada y almacenada de forma segura</p>
                    </div>

                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-ob-base-300 font-medium">
                            <Robot weight="bold" className="w-5 h-5 text-purple-500" />
                            Modelo de IA
                        </label>
                        <Input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="Selecciona el modelo de Gemini"
                            required
                            className="w-full"
                            size="md"
                        />
                        <p className="text-sm text-ob-base-100">Modelo actual: {model}</p>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-ob-border">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            disabled={isLoading}
                            size="md"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            size="md"
                        >
                            Guardar Configuración
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}