import { llmops } from '@llmops/sdk';
import { env } from 'node:process';
import { Pool } from 'pg';

export default llmops({
  basePath: '/llmops',

  // Authentication configuration
  // Options: 'basic' (built-in), 'custom' (BYOA), 'none' (development only)
  auth: {
    type: 'basic',
    defaultEmail: env.LLMOPS_DEFAULT_EMAIL || 'admin@llmops.local',
    defaultPassword: env.LLMOPS_DEFAULT_PASSWORD || 'admin@llmops.local',
    sessionExpiryHours: 168, // 7 days
  },

  providers: {
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY || '',
    },
  },
  database: new Pool({
    connectionString: env.POSTGRES_URL || '',
  }),
});
