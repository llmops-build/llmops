import type { Kysely } from 'kysely';
import type { CacheService } from '../cache/service';
import type { Database } from '../db/schema';
import { ManifestBuilder } from './builder';
import type { GatewayManifest } from './types';

const MANIFEST_CACHE_KEY = 'manifest';
const MANIFEST_NAMESPACE = 'gateway';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL fallback

export class ManifestService {
  private builder: ManifestBuilder;

  constructor(
    private cache: CacheService,
    db: Kysely<Database>,
    private ttlMs: number = DEFAULT_TTL_MS
  ) {
    this.builder = new ManifestBuilder(db);
  }

  /**
   * Get the current manifest, building if necessary
   */
  async getManifest(): Promise<GatewayManifest> {
    return this.cache.getOrSet(
      MANIFEST_CACHE_KEY,
      () => this.builder.build(),
      { namespace: MANIFEST_NAMESPACE, ttl: this.ttlMs }
    );
  }

  /**
   * Force invalidate the manifest (called on mutations)
   */
  async invalidate(): Promise<void> {
    await this.cache.delete(MANIFEST_CACHE_KEY, MANIFEST_NAMESPACE);
  }

  /**
   * Invalidate and immediately rebuild (atomic refresh)
   */
  async refresh(): Promise<GatewayManifest> {
    await this.invalidate();
    return this.getManifest();
  }

  /**
   * Get manifest version without fetching full manifest
   * Useful for checking if manifest is stale
   */
  async getVersion(): Promise<number | null> {
    const manifest = await this.cache.get<GatewayManifest>(
      MANIFEST_CACHE_KEY,
      MANIFEST_NAMESPACE
    );
    return manifest?.version ?? null;
  }

  /**
   * Check if manifest exists in cache
   */
  async hasManifest(): Promise<boolean> {
    return this.cache.has(MANIFEST_CACHE_KEY, MANIFEST_NAMESPACE);
  }
}
