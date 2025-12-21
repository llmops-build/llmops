import { generateId } from '@llmops/core';
import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

/**
 * Generate a secret key with environment-specific prefix
 * Format: sec_{slug_prefix}_{random_string}
 */
const generateSecretKey = (slug: string): string => {
  const slugPrefix = slug.slice(0, 4).toLowerCase();
  const randomPart = generateId(24);
  return `sec_${slugPrefix}_${randomPart}`;
};

const app = new Hono()
  // Create a new environment
  .post(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
        slug: z.string().min(1),
        isProd: z.boolean().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { name, slug, isProd } = c.req.valid('json');

      try {
        const environment = await db.createNewEnvironment({
          name,
          slug,
          isProd: isProd ?? false,
        });

        if (!environment) {
          return c.json(
            internalServerError('Failed to create environment', 500),
            500
          );
        }

        // Generate and store a secret key for the new environment
        const secretKey = generateSecretKey(slug);
        await db.createEnvironmentSecret({
          environmentId: environment.id,
          keyName: 'Secret key',
          keyValue: secretKey,
        });

        return c.json(successResponse(environment, 200));
      } catch (error) {
        console.error('Error creating environment:', error);
        return c.json(
          internalServerError('Failed to create environment', 500),
          500
        );
      }
    }
  )
  // List all environments
  .get('/', async (c) => {
    const db = c.get('db');

    try {
      const environments = await db.listEnvironments();
      return c.json(successResponse(environments, 200));
    } catch (error) {
      console.error('Error fetching environments:', error);
      return c.json(
        internalServerError('Failed to fetch environments', 500),
        500
      );
    }
  })
  // Get environment by ID
  .get(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');

      try {
        const environment = await db.getEnvironmentById({ environmentId: id });
        if (!environment) {
          return c.json(clientErrorResponse('Environment not found', 404), 404);
        }
        return c.json(successResponse(environment, 200));
      } catch (error) {
        console.error('Error fetching environment:', error);
        return c.json(
          internalServerError('Failed to fetch environment', 500),
          500
        );
      }
    }
  )
  // Update environment
  .patch(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        name: z.string().min(1).optional(),
        slug: z.string().min(1).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const environment = await db.updateEnvironment({
          environmentId: id,
          ...body,
        });
        if (!environment) {
          return c.json(clientErrorResponse('Environment not found', 404), 404);
        }
        return c.json(successResponse(environment, 200));
      } catch (error) {
        console.error('Error updating environment:', error);
        return c.json(
          internalServerError('Failed to update environment', 500),
          500
        );
      }
    }
  )
  // Delete environment
  .delete(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');

      try {
        const environment = await db.deleteEnvironment({ environmentId: id });
        if (!environment) {
          return c.json(clientErrorResponse('Environment not found', 404), 404);
        }
        return c.json(successResponse(environment, 200));
      } catch (error) {
        console.error('Error deleting environment:', error);
        return c.json(
          internalServerError('Failed to delete environment', 500),
          500
        );
      }
    }
  )
  // Get secrets by environment ID
  .get(
    '/:id/secrets',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');

      try {
        const secrets = await db.getSecretsByEnvironmentId({
          environmentId: id,
        });
        return c.json(successResponse(secrets, 200));
      } catch (error) {
        console.error('Error fetching environment secrets:', error);
        return c.json(
          internalServerError('Failed to fetch environment secrets', 500),
          500
        );
      }
    }
  );

export default app;
