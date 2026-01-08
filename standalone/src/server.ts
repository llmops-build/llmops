import { Hono } from 'hono';
import { createLLMOpsMiddleware } from '@llmops/sdk/hono';
import llmopsClient from './llmops.js';

const app = new Hono();

// LLMOps middleware
app.use('/llmops/*', createLLMOpsMiddleware(llmopsClient));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'LLMOps Standalone Application',
    dashboard: '/llmops',
    health: '/health'
  });
});

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};