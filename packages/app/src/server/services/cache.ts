import { CacheService } from '@llmops/core';

export const cacheService = new CacheService({
  backend: 'memory',
  maxSize: 1000,
  cleanupInterval: 60 * 1000, // 1 minute
  defaultTtl: 5 * 60 * 1000, // 5 minutes
});
