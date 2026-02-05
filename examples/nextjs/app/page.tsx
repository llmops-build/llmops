export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>LLMOps Next.js Example</h1>
      <p>
        This is a minimal Next.js application demonstrating the @llmops/sdk
        integration.
      </p>

      <h2>Setup</h2>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`// llmops.ts - Use lazy initialization to avoid build-time execution
import { llmops, type LLMOpsClient } from '@llmops/sdk';
import { Pool } from 'pg';

let cachedClient: LLMOpsClient | null = null;

export function getLLMOpsClient(): LLMOpsClient {
  if (!cachedClient) {
    cachedClient = llmops({
      basePath: '/api/llmops',
      database: new Pool({
        connectionString: process.env.POSTGRES_URL || '',
      }),
    });
  }
  return cachedClient;
}

// app/api/llmops/[[...path]]/route.ts
import type { NextRequest } from 'next/server';
import { toNextJsHandler } from '@llmops/sdk/nextjs';
import { getLLMOpsClient } from '@/llmops';

export async function GET(request: NextRequest) {
  return toNextJsHandler(getLLMOpsClient()).GET(request);
}

export async function POST(request: NextRequest) {
  return toNextJsHandler(getLLMOpsClient()).POST(request);
}

// ... similar for PUT, DELETE, PATCH`}
      </pre>

      <h2>Available Endpoints</h2>
      <ul>
        <li>
          <code>/api/llmops/health</code> - Health check
        </li>
        <li>
          <code>/api/llmops/api/genai/v1/chat/completions</code> - Chat
          completions (OpenAI-compatible)
        </li>
      </ul>

      <h2>Example Usage</h2>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          borderRadius: '4px',
          overflow: 'auto',
        }}
      >
        {`curl -X POST http://localhost:3000/api/llmops/api/genai/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your-environment-secret>" \\
  -H "x-llmops-config: <your-config-id>" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`}
      </pre>
    </main>
  );
}
