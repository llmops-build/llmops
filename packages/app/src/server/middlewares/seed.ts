import type { MiddlewareHandler } from 'hono';
import { generateId } from '@llmops/core';

const DEFAULT_ENVIRONMENTS = [
  { name: 'Production', slug: 'production', isProd: true },
  { name: 'Development', slug: 'development', isProd: true },
  { name: 'Staging', slug: 'staging', isProd: true },
] as const;

const generateSecretKey = () => {
  return `sk_${generateId(32)}`;
};

export const createSeedMiddleware = (): MiddlewareHandler => {
  let initialized = false;

  return async (c, next) => {
    if (!initialized) {
      const db = c.get('db');

      // Check if environments already exist
      const environmentCount = await db.countEnvironments();

      if (environmentCount === 0) {
        console.log(
          '[Seed] No environments found, seeding default environments...'
        );

        for (const env of DEFAULT_ENVIRONMENTS) {
          // Create environment
          const createdEnv = await db.createNewEnvironment({
            name: env.name,
            slug: env.slug,
            isProd: env.isProd,
          });

          if (createdEnv) {
            // Create secret for the environment
            await db.createEnvironmentSecret({
              environmentId: createdEnv.id,
              keyName: 'api_key',
              keyValue: generateSecretKey(),
            });

            console.log(`[Seed] Created environment: ${env.name} with API key`);
          }
        }

        console.log('[Seed] Default environments seeded successfully');
      }

      initialized = true;
    }

    await next();
  };
};
