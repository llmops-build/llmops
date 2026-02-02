import { llmops, type LLMOpsClient } from '@llmops/sdk';
import { Pool } from 'pg';

let client: LLMOpsClient | null = null;

export function getLLMOpsClient(): LLMOpsClient {
  if (!client) {
    client = llmops({
      basePath: '/api/llmops',
      database: new Pool({
        connectionString: process.env.POSTGRES_URL || '',
      }),
      schema: 'llmops',
    });
  }
  return client;
}
