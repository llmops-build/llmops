// Edge-compatible exports (main entry point)
export * from './lib/auth';
export * from './lib/convex';
export { createLLMOps as llmops } from './client';

// Note: Express middleware is Node.js only
// Import from '@llmops/sdk/express' for Express support
