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
      schema: 'llmops',
    });
  }
  return cachedClient;
}
