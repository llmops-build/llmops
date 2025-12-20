import type { MiddlewareHandler } from 'hono';
import { generateId } from '@llmops/core';
import { hashPassword, isBasicAuth } from './auth';

const DEFAULT_ENVIRONMENTS = [
  { name: 'Production', slug: 'production', isProd: true },
  { name: 'Development', slug: 'development', isProd: false },
  { name: 'Staging', slug: 'staging', isProd: false },
] as const;

const generateSecretKey = () => {
  return `sk_${generateId(32)}`;
};

export const createSeedMiddleware = (): MiddlewareHandler => {
  let initialized = false;

  return async (c, next) => {
    if (!initialized) {
      const db = c.get('db');
      const config = c.get('llmopsConfig');

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

      // Only seed users if basic auth is configured
      if (isBasicAuth(config.auth)) {
        const userCount = await db.countUsers();

        if (userCount === 0) {
          console.log('[Seed] No users found, seeding default admin user...');

          const { defaultEmail, defaultPassword } = config.auth;
          const passwordHash = await hashPassword(defaultPassword);

          const adminUser = await db.createNewUser({
            email: defaultEmail,
            passwordHash,
            name: 'Admin',
            role: 'admin',
          });

          if (adminUser) {
            console.log('[Seed] Default admin user created successfully');
            console.log(`[Seed] Admin email: ${defaultEmail}`);
          }
        }
      }

      initialized = true;
    }

    await next();
  };
};
