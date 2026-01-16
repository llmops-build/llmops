/**
 * @file src/node.ts
 * Node.js-only exports for @llmops/core
 * Import from '@llmops/core/node' for Node.js-specific features
 */

// File-based cache backend (requires fs, path, process.cwd())
export { FileCacheBackend } from './cache/backends/file';

// Pino logger (has native dependencies)
export { logger } from './utils/logger';
