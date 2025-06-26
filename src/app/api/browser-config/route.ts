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
    
    // Store the configuration in KV storage
    await env.MODEL_CONFIG.put(`browser:${config.chatId}`, config.browser);
    
    return jsonResponse({ success: true });
  } catch (error) {
    console.error('Error saving browser config:', error);
    return jsonResponse(
      { error: 'Failed to save browser configuration' },
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
    
    // Get the configuration from KV storage
    const browser = await env.MODEL_CONFIG.get<BrowserType>(`browser:${chatId}`);
    
    if (!browser) {
      return jsonResponse(
        { error: 'Browser configuration not found' },
        404
      );
    }
    
    return jsonResponse({ browser });
  } catch (error) {
    console.error('Error fetching browser config:', error);
    return jsonResponse(
      { error: 'Failed to fetch browser configuration' },
      500
    );
  }
}
