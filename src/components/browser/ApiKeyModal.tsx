import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Key, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Renders a modal dialog to enter a Fireplexity API key.
 * 
 * @param isOpen Whether the dialog is open
 * @param onClose Callback when the dialog is closed
 * @param onSave Callback when the API key is saved
 * @param initialApiKey The initial API key to display in the input
 * 
 * @returns A JSX element representing the modal dialog
 */
export function ApiKeyModal({ 
  isOpen, 
  onClose, 
  onSave,
  initialApiKey = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave: (apiKey: string) => void;
  initialApiKey?: string;
}) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [saveKey, setSaveKey] = useState(true);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setApiKey(initialApiKey);
    setError('');
    setIsValid(null);
  }, [initialApiKey, isOpen]);

  const validateApiKey = async (key: string): Promise<boolean> => {
    // Simple validation - you might want to add more robust validation
    return key.trim().length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Por favor ingresa una clave API');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Validar el formato de la clave API
      setIsValidating(true);
      const isValidKey = await validateApiKey(apiKey);
      
      if (!isValidKey) {
        setError('Por favor ingresa una clave API válida');
        setIsValid(false);
        setIsLoading(false);
        setIsValidating(false);
        return;
      }
      
      setIsValid(true);
      // Esperar a que se complete onSave antes de cerrar el modal
      await onSave(apiKey);
      // No cerramos el modal aquí, lo manejamos en el callback de éxito de onSave
    } catch (err) {
      console.error('Error al guardar la clave API:', err);
      const errorMessage = err instanceof Error ? err.message : 'No se pudo guardar la clave API';
      setError(errorMessage);
      setIsValid(false);
      
      // Mostrar notificación de error
      if (typeof window !== 'undefined') {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 p-4 rounded-md bg-red-500 text-white max-w-sm z-50';
        toast.innerHTML = `
          <div class="font-bold">Error</div>
          <div class="text-sm">${errorMessage}</div>
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
          toast.remove();
        }, 5000);
      }
    } finally {
      setIsLoading(false);
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white dark:bg-gray-800">
        <div className="relative">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">Enter Firecrawl API Key</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 dark:text-gray-300">
                  An API key is required for the Rendering API browser to use the Rendering API
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 bg-white dark:bg-gray-800">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="apiKey" className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    API Key
                  </Label>
                  {error && (
                    <div className="flex items-center text-red-600 dark:text-red-400 text-xs mt-1">
                      <AlertCircle className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className={cn(
                      'w-full pr-10 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
                      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-500/50',
                      error ? 'border-red-500 focus-visible:ring-red-500/30' : '',
                      isValidating ? 'border-blue-300 dark:border-blue-700' : ''
                    )}
                    placeholder="fc-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    disabled={isLoading || isValidating}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    onClick={() => setShowApiKey(!showApiKey)}
                    tabIndex={-1}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start space-x-2 text-sm text-red-500 mt-1"
                  >
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">
                  Your API key is stored securely and only used for browser rendering.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading || isValidating}
                  className="mr-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={!apiKey.trim() || isLoading || isValidating}
                  className="min-w-[100px] bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : 'Guardar'}
                </Button>
                </div>
            </div>
          </form>
          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-700/50 px-6 py-3 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600">
            <p>¿No tienes una clave API? <a href="https://firecrawl.dev" target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">Comienza con Firecrawl</a></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
