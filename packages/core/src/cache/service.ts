/**
 * @file src/cache/service.ts
 * Unified cache service with pluggable backends
 */

import { MemoryCacheBackend } from './backends/memory';
import { FileCacheBackend } from './backends/file';
import type {
  CacheBackend,
  CacheEntry,
  CacheOptions,
  CacheStats,
  CacheConfig,
} from './types';

export class CacheService {
  private backend: CacheBackend;
  private defaultTtl?: number;

  constructor(config: CacheConfig) {
    this.defaultTtl = config.defaultTtl;
    this.backend = this.createBackend(config);
  }

  private createBackend(config: CacheConfig): CacheBackend {
    switch (config.backend) {
      case 'memory':
        return new MemoryCacheBackend(config.maxSize, config.cleanupInterval);

      case 'file':
        return new FileCacheBackend(
          config.dataDir,
          config.fileName,
          config.saveInterval,
          config.cleanupInterval
        );

      default:
        throw new Error(
          `Unsupported cache backend: ${(config as CacheConfig).backend}`
        );
    }
  }

  /** Get a value from the cache */
  async get<T = unknown>(key: string, namespace?: string): Promise<T | null> {
    const entry = await this.backend.get<T>(key, namespace);
    return entry ? entry.value : null;
  }

  /** Get the full cache entry (with metadata) */
  async getEntry<T = unknown>(
    key: string,
    namespace?: string
  ): Promise<CacheEntry<T> | null> {
    return this.backend.get<T>(key, namespace);
  }

  /** Set a value in the cache */
  async set<T = unknown>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    const finalOptions = {
      ...options,
      ttl: options.ttl ?? this.defaultTtl,
    };

    await this.backend.set(key, value, finalOptions);
  }

  /** Set a value with TTL in seconds (convenience method) */
  async setWithTtl<T = unknown>(
    key: string,
    value: T,
    ttlSeconds: number,
    namespace?: string
  ): Promise<void> {
    await this.set(key, value, {
      ttl: ttlSeconds * 1000,
      namespace,
    });
  }

  /** Delete a value from the cache */
  async delete(key: string, namespace?: string): Promise<boolean> {
    return this.backend.delete(key, namespace);
  }

  /** Check if a key exists in the cache */
  async has(key: string, namespace?: string): Promise<boolean> {
    return this.backend.has(key, namespace);
  }

  /** Get all keys in a namespace */
  async keys(namespace?: string): Promise<string[]> {
    return this.backend.keys(namespace);
  }

  /** Clear all entries in a namespace (or all entries if no namespace) */
  async clear(namespace?: string): Promise<void> {
    await this.backend.clear(namespace);
  }

  /** Get cache statistics */
  async getStats(namespace?: string): Promise<CacheStats> {
    return this.backend.getStats(namespace);
  }

  /** Manually trigger cleanup of expired entries */
  async cleanup(): Promise<void> {
    await this.backend.cleanup();
  }

  /** Wait for the backend to be ready */
  async waitForReady(): Promise<void> {
    if ('waitForReady' in this.backend) {
      await (this.backend as FileCacheBackend).waitForReady();
    }
  }

  /** Close the cache and cleanup resources */
  async close(): Promise<void> {
    await this.backend.close();
  }

  /** Get or set pattern - get value, or compute and cache it if not found */
  async getOrSet<T = unknown>(
    key: string,
    factory: () => Promise<T> | T,
    options: CacheOptions = {}
  ): Promise<T> {
    const existing = await this.get<T>(key, options.namespace);
    if (existing !== null) {
      return existing;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /** Increment a numeric value (simulated atomic operation) */
  async increment(
    key: string,
    delta: number = 1,
    options: CacheOptions = {}
  ): Promise<number> {
    const current = (await this.get<number>(key, options.namespace)) || 0;
    const newValue = current + delta;
    await this.set(key, newValue, options);
    return newValue;
  }

  /** Set multiple values at once */
  async setMany<T = unknown>(
    entries: Array<{ key: string; value: T; options?: CacheOptions }>,
    defaultOptions: CacheOptions = {}
  ): Promise<void> {
    const promises = entries.map(({ key, value, options }) =>
      this.set(key, value, { ...defaultOptions, ...options })
    );
    await Promise.all(promises);
  }

  /** Get multiple values at once */
  async getMany<T = unknown>(
    keys: string[],
    namespace?: string
  ): Promise<Array<{ key: string; value: T | null }>> {
    const promises = keys.map(async (key) => ({
      key,
      value: await this.get<T>(key, namespace),
    }));
    return Promise.all(promises);
  }

  /** Get the underlying backend (for advanced use cases) */
  getBackend(): CacheBackend {
    return this.backend;
  }
}
