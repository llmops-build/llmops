import type { Kysely } from 'kysely';
import type { CacheService } from '../cache/service';
import type { Database } from '../db/schema';
import { logger } from '../utils/logger';
import { ManifestBuilder } from './builder';
import type { GatewayManifest } from './types';

const MANIFEST_CACHE_KEY = 'manifest';
const MANIFEST_NAMESPACE = 'gateway';
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL fallback

const log = logger.child({ module: 'ManifestService' });

export class ManifestService {
  private builder: ManifestBuilder;

  constructor(
    private cache: CacheService,
    db: Kysely<Database>,
    private ttlMs: number = DEFAULT_TTL_MS
  ) {
    this.builder = new ManifestBuilder(db);
    log.debug({ ttlMs }, 'ManifestService initialized');
  }

  /**
   * Get the current manifest, building if necessary
   */
  async getManifest(): Promise<GatewayManifest> {
    log.debug('Getting manifest from cache or building');
    const manifest = await this.cache.getOrSet(
      MANIFEST_CACHE_KEY,
      async () => {
        log.info('Building new manifest');
        const built = await this.builder.build();
        log.info(
          {
            version: built.version,
          },
          'Manifest built successfully'
        );
        return built;
      },
      { namespace: MANIFEST_NAMESPACE, ttl: this.ttlMs }
    );
    log.debug({ version: manifest.version }, 'Manifest retrieved');
    return manifest;
  }

  /**
   * Force invalidate the manifest (called on mutations)
   */
  async invalidate(): Promise<void> {
    log.info('Invalidating manifest cache');
    await this.cache.delete(MANIFEST_CACHE_KEY, MANIFEST_NAMESPACE);
  }

  /**
   * Invalidate and immediately rebuild (atomic refresh)
   */
  async refresh(): Promise<GatewayManifest> {
    log.info('Refreshing manifest (invalidate + rebuild)');
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
    const version = manifest?.version ?? null;
    log.debug({ version }, 'Got manifest version');
    return version;
  }

  /**
   * Check if manifest exists in cache
   */
  async hasManifest(): Promise<boolean> {
    const exists = await this.cache.has(MANIFEST_CACHE_KEY, MANIFEST_NAMESPACE);
    log.debug({ exists }, 'Checked manifest existence');
    return exists;
  }
}
