import { createDataStream } from 'ai';

export interface FireplexitySearchResult {
  type: 'status' | 'sources' | 'content' | 'answer' | 'error';
  message?: string;
  sources?: Array<{
    url: string;
    title: string;
    description?: string;
    content?: string;
    markdown?: string;
    publishedDate?: string;
    author?: string;
    image?: string;
    favicon?: string;
    siteName?: string;
  }>;
  content?: string;
  answer?: string;
  error?: string;
}

export async function* searchWithFireplexity(
  query: string,
  messages: any[],
  apiKey?: string
): AsyncGenerator<FireplexitySearchResult, void, unknown> {
  try {
    const response = await fetch('/api/fireplexity/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        query,
        messages,
        firecrawlApiKey: apiKey
      })
    });

    if (!response.ok) {
      try {
        const error: { error?: string; message?: string } = await response.json();
        throw new Error(
          error?.error || 
          error?.message || 
          `Search failed with status: ${response.status} ${response.statusText}`
        );
      } catch (jsonError) {
        const errorText = await response.text();
        throw new Error(
          `Search failed with status: ${response.status} ${response.statusText}. ` +
          `Response: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`
        );
      }
    }

    if (!response.body) {
      throw new Error('No response body');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process complete JSON objects in the buffer
      let startIndex = 0;
      let endIndex;
      
      while ((endIndex = buffer.indexOf('\n', startIndex)) !== -1) {
        const line = buffer.substring(startIndex, endIndex).trim();
        startIndex = endIndex + 1;
        
        if (!line) continue;
        
        try {
          const data = JSON.parse(line);
          yield data as FireplexitySearchResult;
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
      
      buffer = buffer.substring(startIndex);
    }

    // Process any remaining data in the buffer
    if (buffer.trim()) {
      try {
        const data = JSON.parse(buffer);
        yield data as FireplexitySearchResult;
      } catch (e) {
        console.error('Error parsing final JSON:', e);
      }
    }
  } catch (error) {
    console.error('Search error:', error as Error || 'Unknown error occurred');
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}
