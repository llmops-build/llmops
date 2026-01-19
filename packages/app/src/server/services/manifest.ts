import { ManifestService, ManifestRouter } from '@llmops/core';
import { cacheService } from './cache';

// Singleton manifest service - initialized lazily with first db access
let manifestServiceInstance: ManifestService | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initializedWithDb: any = null;

/**
 * Get or create the manifest service instance.
 * The service is created lazily on first access with the provided db.
 * Note: Using `any` for db type to avoid Kysely version mismatch issues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getManifestService(db: any): ManifestService {
  // If already initialized with same db, return existing instance
  if (manifestServiceInstance && initializedWithDb === db) {
    return manifestServiceInstance;
  }

  // Create new instance (or reinitialize if db changed)
  manifestServiceInstance = new ManifestService(cacheService, db);
  initializedWithDb = db;

  return manifestServiceInstance;
}

/**
 * Get the manifest service if it exists (for use in contexts without db access)
 * Returns null if not yet initialized
 */
export function getExistingManifestService(): ManifestService | null {
  return manifestServiceInstance;
}

/**
 * Invalidate the manifest cache.
 * Use this when data changes that affects routing (configs, variants, targeting rules, etc.)
 */
export async function invalidateManifest(): Promise<void> {
  if (manifestServiceInstance) {
    await manifestServiceInstance.invalidate();
  } else {
    // Fallback: clear the gateway namespace directly
    await cacheService.clear('gateway');
  }
}

// Re-export ManifestRouter for convenience
export { ManifestRouter };
