/**
 * @file src/cache/types.ts
 * Type definitions for the unified cache system
 */

export interface CacheEntry<T = unknown> {
  value: T;
  expiresAt?: number;
  createdAt: number;
  metadata?: Record<string, unknown>;
}

export interface CacheOptions {
  /** Time to live in milliseconds */
  ttl?: number;
  /** Cache namespace for organization */
  namespace?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  expired: number;
}

export interface CacheBackend {
  get<T = unknown>(
    key: string,
    namespace?: string
  ): Promise<CacheEntry<T> | null>;
  set<T = unknown>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void>;
  delete(key: string, namespace?: string): Promise<boolean>;
  clear(namespace?: string): Promise<void>;
  has(key: string, namespace?: string): Promise<boolean>;
  keys(namespace?: string): Promise<string[]>;
  getStats(namespace?: string): Promise<CacheStats>;
  /** Remove expired entries */
  cleanup(): Promise<void>;
  /** Cleanup resources */
  close(): Promise<void>;
}

export type CacheBackendType = 'memory' | 'file';

export interface BaseCacheConfig {
  backend: CacheBackendType;
  /** Default TTL in milliseconds */
  defaultTtl?: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

export interface MemoryCacheConfig extends BaseCacheConfig {
  backend: 'memory';
  /** Maximum number of entries */
  maxSize?: number;
}

export interface FileCacheConfig extends BaseCacheConfig {
  backend: 'file';
  /** Data directory path */
  dataDir?: string;
  /** Cache file name */
  fileName?: string;
  /** Debounce save interval in milliseconds */
  saveInterval?: number;
}

export type CacheConfig = MemoryCacheConfig | FileCacheConfig;

/** Time constants in milliseconds for convenience */
export const MS = {
  '1_MINUTE': 1 * 60 * 1000,
  '5_MINUTES': 5 * 60 * 1000,
  '10_MINUTES': 10 * 60 * 1000,
  '30_MINUTES': 30 * 60 * 1000,
  '1_HOUR': 60 * 60 * 1000,
  '6_HOURS': 6 * 60 * 60 * 1000,
  '12_HOURS': 12 * 60 * 60 * 1000,
  '1_DAY': 24 * 60 * 60 * 1000,
  '7_DAYS': 7 * 24 * 60 * 60 * 1000,
  '30_DAYS': 30 * 24 * 60 * 60 * 1000,
} as const;
