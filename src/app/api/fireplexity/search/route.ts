// Using Response directly instead of NextResponse for Edge Runtime
const { Response } = globalThis;
import { GoogleGenerativeAI } from '@google/generative-ai';
import FirecrawlApp from '@mendable/firecrawl-js';

// Type definitions
interface SearchRequest {
  query: string;
  messages?: Array<{ role: string; content: string }>;
  firecrawlApiKey?: string;
}

interface SearchResult {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  markdown?: string;
  metadata?: {
    title?: string;
    description?: string;
    publishedTime?: string;
    author?: string;
    image?: string;
    favicon?: string;
    publisher?: string;
  };
}

interface SearchResponse {
  success: boolean;
  data?: SearchResult[];
  error?: string;
}

export const runtime = 'edge';

// Utility for exponential backoff retries
async function withRetry<T>(
  fn: () => Promise<any>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError = new Error('Unknown error');
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      // If the response has a success flag, check it
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          return result as T;
        } else {
          throw new Error(result.error || 'Request failed');
        }
      }
      return result as T;
    } catch (error: any) {
      lastError = error;
      
      if (error?.status !== 429 || attempt === maxRetries) {
        throw error;
      }
      
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000,
        10000 // Max 10 seconds
      );
      
      console.log(`Rate limit hit. Retrying in ${Math.round(delay / 1000)}s (attempt ${attempt}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Partial<SearchRequest>;
    const { query, messages = [], firecrawlApiKey } = body;

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = firecrawlApiKey || process.env.FIRECRAWL_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Firecrawl API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ error: 'Gemini API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize Firecrawl
    const firecrawl = new FirecrawlApp({ apiKey });
    const genAI = new GoogleGenerativeAI(geminiApiKey);

    // Create a streaming response
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();

    // Process the search in the background
    (async () => {
      try {
        // Notify client that search is starting
        await writer.write(encoder.encode(JSON.stringify({
          type: 'status',
          message: 'Starting search...'
        }) + '\n'));

        // Perform the search
        const response = await withRetry<SearchResponse>(() => 
          firecrawl.search(query, {
            limit: 5,
            scrapeOptions: {
              formats: ['markdown'],
              onlyMainContent: true,
              includeImages: false,
              excludeTags: ['nav', 'footer', 'aside', 'header']
            }
          })
        );

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to perform search');
        }

        // Process and send sources
        const sources = response.data.map((result) => ({
          url: result.url,
          title: result.metadata?.title || 'No title',
          description: result.metadata?.description,
          content: result.markdown || result.content,
          publishedDate: result.metadata?.publishedTime,
          author: result.metadata?.author,
          image: result.metadata?.image,
          favicon: result.metadata?.favicon,
          siteName: result.metadata?.publisher
        }));

        await writer.write(encoder.encode(JSON.stringify({
          type: 'sources',
          sources
        }) + '\n'));

        // Generate answer using Gemini
        const prompt = `Based on the following search results, provide a comprehensive answer to the query: ${query}\n\n` +
          sources.map((src, i) => 
            `Source ${i + 1} (${src.url}):\n${src.content?.substring(0, 1000)}...`
          ).join('\n\n');

        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        const result = await model.generateContentStream(prompt);
        
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          await writer.write(encoder.encode(JSON.stringify({
            type: 'answer',
            answer: chunkText
          }) + '\n'));
        }

      } catch (error) {
        console.error('Search error:', error);
        await writer.write(encoder.encode(JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }) + '\n'));
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({
      error: 'An error occurred while processing your request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
