import { useState, useEffect } from 'react';
import { Button } from '../button/Button';
import { Input } from '../input/Input';
import { Label } from '../label/Label';
// Since we don't see an Icons component, we'll use a simple spinner for now
const Spinner = () => (
  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Simple toast implementation since we don't have the use-toast hook
const toast = ({
  title,
  description,
  variant = 'default',
}: {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive';
}) => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 p-4 rounded-md ${variant === 'destructive' ? 'bg-red-500' : 'bg-green-500'} text-white max-w-sm`;
  
  const titleEl = document.createElement('div');
  titleEl.className = 'font-bold';
  titleEl.textContent = title;
  toast.appendChild(titleEl);
  
  if (description) {
    const descEl = document.createElement('div');
    descEl.className = 'text-sm';
    descEl.textContent = description;
    toast.appendChild(descEl);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 5000);
};

// Define the response type for the browser config API
interface BrowserConfigResponse {
  success: boolean;
  browser?: string;
  hasFireplexityKey?: boolean;
  error?: string;
}

interface ApiKeyInputProps {
  chatId: string;
  currentBrowser: 'browserbase' | 'rendering';
  onApiKeySaved: (hasKey: boolean) => void;
}

export function ApiKeyInput({ chatId, currentBrowser, onApiKeySaved }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    // Check if API key exists for this chat
    const checkApiKey = async () => {
      try {
        const response = await fetch(`/api/browser-config?chatId=${chatId}`);
        if (response.ok) {
          const data: BrowserConfigResponse = await response.json() as BrowserConfigResponse;
          setHasApiKey(!!data.hasFireplexityKey);
          onApiKeySaved(!!data.hasFireplexityKey);
        }
      } catch (error) {
        console.error('Error checking API key:', error);
        toast({
          title: 'Error',
          description: 'Failed to check API key status',
          variant: 'destructive',
        });
      }
    };

    if (currentBrowser === 'rendering') {
      checkApiKey();
    }
  }, [chatId, currentBrowser, onApiKeySaved]);

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor ingresa una clave API',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/browser-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          browser: 'rendering',
          fireplexityApiKey: apiKey.trim(),
        }),
      });

      interface ApiResponse {
        success: boolean;
        browser?: string;
        hasFireplexityKey?: boolean;
        error?: string | { message: string };
        kvAvailable?: boolean;
      }
      
      let data: ApiResponse;
      try {
        data = await response.json() as ApiResponse;
      } catch (e) {
        console.error('Error al leer la respuesta del servidor:', e);
        throw new Error('No se pudo leer la respuesta del servidor');
      }

      if (response.ok) {
        setHasApiKey(true);
        onApiKeySaved(true);
        setIsEditing(false);
        
        // Mostrar notificación de éxito
        toast({
          title: '¡Éxito!',
          description: 'La clave API se ha guardado correctamente',
          variant: 'default',
        });
      } else {
        // Manejar errores de la API
        console.error('Error en la respuesta de la API:', {
          status: response.status,
          statusText: response.statusText,
          data,
        });

        let errorMessage = 'Error al guardar la clave API. Por favor, verifica la clave e inténtalo de nuevo.';
        
        if (response.status === 401) {
          errorMessage = 'Clave API inválida. Por favor, verifica tu clave e inténtalo de nuevo.';
        } else if (response.status === 400) {
          errorMessage = 'Solicitud inválida. Por favor, verifica el formato de la clave API.';
        } else if (response.status >= 500) {
          errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo más tarde.';
        } else if (data?.error) {
          errorMessage = typeof data.error === 'string' 
            ? data.error 
            : data.error.message || 'Error desconocido';
        }
        
        // Mostrar notificación de error
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error al guardar la clave API:', error);
      
      // Mostrar notificación de error genérico si no se manejó antes
      if (!(error instanceof Error && error.message.includes('Error al guardar la clave API'))) {
        toast({
          title: 'Error',
          description: 'No se pudo guardar la clave API. Por favor, inténtalo de nuevo.',
          variant: 'destructive',
        });
      }
      
      // Re-lanzar el error para que pueda ser manejado por otros manejadores si es necesario
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  if (currentBrowser !== 'rendering') {
    return null;
  }

  if (hasApiKey && !isEditing) {
    return (
      <div className="mt-2 p-3 bg-muted/50 rounded-md text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Using Fireplexity API</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 px-2 text-xs"
          >
            Change Key
          </Button>
        </div>
      </div>
    );
  }

}
