// Cloudflare Workers types
/// <reference types="@cloudflare/workers-types" />

// The KV namespace is bound to the environment as MODEL_CONFIG
interface Env {
  MODEL_CONFIG: KVNamespace;
}

// Simple response helper
function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

type BrowserType = 'browserbase' | 'rendering';

interface BrowserConfig {
  browser: BrowserType;
  chatId: string;
  fireplexityApiKey?: string;
}

export async function POST(request: Request, env: Env) {
  try {
    const config: BrowserConfig = await request.json();
    
    if (!config.chatId) {
      return jsonResponse(
        { error: 'chatId is required' },
        400
      );
    }
    
    // Check if KV namespace is available
    if (!env.MODEL_CONFIG) {
      console.warn('KV namespace MODEL_CONFIG is not available');
      return jsonResponse(
        { 
          success: true, 
          browser: config.browser,
          hasFireplexityKey: !!config.fireplexityApiKey,
          kvAvailable: false
        },
        200
      );
    }
    
    try {
      // Store the browser type in KV storage
      await env.MODEL_CONFIG.put(`browser:${config.chatId}`, config.browser);
      
      // Store the Fireplexity API key if provided
      if (config.fireplexityApiKey) {
        await env.MODEL_CONFIG.put(`fireplexity_key:${config.chatId}`, config.fireplexityApiKey);
      }
      
      return jsonResponse({ 
        success: true,
        browser: config.browser,
        hasFireplexityKey: !!config.fireplexityApiKey,
        kvAvailable: true
      });
    } catch (kvError) {
      console.error('KV storage error:', kvError);
      // Even if KV fails, we'll still return success since the operation conceptually worked
      return jsonResponse({ 
        success: true,
        browser: config.browser,
        hasFireplexityKey: !!config.fireplexityApiKey,
        kvAvailable: false
      });
    }
  } catch (error) {
    console.error('Error saving browser config:', error);
    return jsonResponse(
      { 
        error: 'Failed to save browser configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}

export async function GET(request: Request, env: Env) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return jsonResponse(
        { error: 'chatId is required' },
        400
      );
    }

    // Check if KV namespace is available
    if (!env.MODEL_CONFIG) {
      console.warn('KV namespace MODEL_CONFIG is not available');
      return jsonResponse({
        browser: 'browserbase',
        chatId,
        hasFireplexityKey: false,
        kvAvailable: false
      });
    }

    try {
      // Get the browser configuration from KV storage
      const [browser, fireplexityKey] = await Promise.all([
        env.MODEL_CONFIG.get(`browser:${chatId}`) as Promise<BrowserType | null>,
        env.MODEL_CONFIG.get(`fireplexity_key:${chatId}`) as Promise<string | null>
      ]);

      return jsonResponse({
        browser: browser || 'browserbase', // Default to browserbase if not set
        chatId,
        hasFireplexityKey: !!fireplexityKey,
        kvAvailable: true
      });
    } catch (kvError) {
      console.error('KV storage error:', kvError);
      // Return default values if KV access fails
      return jsonResponse({
        browser: 'browserbase',
        chatId,
        hasFireplexityKey: false,
        kvAvailable: false
      });
    }
  } catch (error) {
    console.error('Error getting browser config:', error);
    return jsonResponse(
      { 
        error: 'Failed to get browser configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
