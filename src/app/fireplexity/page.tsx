'use client';

import { FireplexityChatInterface } from "@/components/fireplexity/FireplexityChatInterface";
import { FireplexitySearch } from "@/components/fireplexity/FireplexitySearch";
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message } from 'ai';
import type { SearchResult } from '@/components/fireplexity/types';

// Interfaz para la respuesta de la API
interface ApiResponse {
  answer?: string;
  sources?: SearchResult[];
  followUpQuestions?: string[];
  ticker?: string;
}

interface MessageData {
  sources: SearchResult[];
  followUpQuestions: string[];
  ticker?: string;
}

// Tipo para los datos del mensaje que espera el componente
interface MessageDataMap extends Map<number, MessageData> {}

export default function FireplexityPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [searchStatus, setSearchStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [messageData, setMessageData] = useState<MessageDataMap>(new Map<number, MessageData>());
  const [currentTicker, setCurrentTicker] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Efecto para limpiar el controlador de aborto al desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Crear un nuevo controlador de aborto para esta solicitud
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: input,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setSearchStatus('Buscando información...');

    try {
      const response = await fetch('/api/fireplexity/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
        signal: abortControllerRef.current?.signal,
      });

      if (!response.ok) {
        throw new Error('Error en la búsqueda');
      }

      const data = await response.json() as ApiResponse;
      
      // Generar un ID numérico único
      const messageId = Date.now();
      
      // Procesar la respuesta de la API
      const botMessage: Message = {
        id: messageId.toString(),
        role: 'assistant',
        content: data.answer || 'No se pudo obtener una respuesta.',
        createdAt: new Date(),
      };

      const newSources = Array.isArray(data.sources) ? data.sources : [];
      const newFollowUpQuestions = Array.isArray(data.followUpQuestions) ? data.followUpQuestions : [];
      
      // Actualizar el estado con la nueva información
      setMessages(prev => [...prev, botMessage]);
      setSources(newSources);
      setFollowUpQuestions(newFollowUpQuestions);
      
      // Actualizar los datos del mensaje
      setMessageData(prev => {
        const newMap = new Map(prev);
        newMap.set(messageId, {
          sources: newSources,
          followUpQuestions: newFollowUpQuestions,
          ticker: data.ticker,
        });
        return newMap;
      });
      
      if (data.ticker && typeof data.ticker === 'string') {
        setCurrentTicker(data.ticker);
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error:', error);
        // Agregar un mensaje de error al chat
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.',
          createdAt: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setSearchStatus('');
    }
  }, [input, isLoading, messageData, messages]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value);
  }, []);

  // Función para obtener los datos del mensaje en el formato esperado
  const getMessageData = useCallback((messageId: string) => {
    const id = parseInt(messageId, 10) || 0;
    return messageData.get(id) || { sources: [], followUpQuestions: [] };
  }, [messageData]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900">
      <div className="flex-1 overflow-auto p-4">
        <FireplexityChatInterface 
          messages={messages}
          sources={sources}
          followUpQuestions={followUpQuestions}
          searchStatus={searchStatus}
          isLoading={isLoading}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          messageData={messageData}
          currentTicker={currentTicker || undefined}
        />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <FireplexitySearch 
          handleSubmit={handleSubmit}
          input={input}
          handleInputChange={handleInputChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
function uuidv4(): string {
    throw new Error("Function not implemented.");
}

