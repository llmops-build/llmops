import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createLLMOpsMiddleware } from '@llmops/sdk/hono';
import llmopsClient from './llmops';

const app = new Hono();
const llmopsMiddleware = createLLMOpsMiddleware(llmopsClient);

// Middleware
app.use('*', logger());
app.use('*', cors());

app.use('*', llmopsMiddleware);

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'LLMOps Standalone Server',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.get('/api/health', (c) => {
  return c.json({ status: 'healthy' });
});

// Start server
const port = Number(process.env.PORT) || 3000;

console.log(`Starting server on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`Server running at http://localhost:${port}`);

export { app };
export type AppType = typeof app;
