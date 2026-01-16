import { httpAction } from './_generated/server'

// Mock LLMOps handler without Node.js dependencies
export const llmopsHandler = httpAction(async (ctx, request) => {
  const url = new URL(request.url)
  const method = request.method

  // Basic health check endpoint
  if (url.pathname === '/llmops/health' && method === 'GET') {
    return new Response(
      JSON.stringify({ status: 'ok', message: 'LLMOps API is running' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Example API endpoint
  if (url.pathname === '/llmops/models' && method === 'GET') {
    return new Response(
      JSON.stringify({
        data: [
          { id: 'gpt-4', name: 'GPT-4', provider: 'openai' },
          { id: 'claude-3', name: 'Claude 3', provider: 'anthropic' },
        ],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }

  // Catch-all route
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  })
})

export const basePath = '/llmops'
