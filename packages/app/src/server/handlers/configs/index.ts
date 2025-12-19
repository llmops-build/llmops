import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  .post(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
      })
    ),
    async (c) => {
      const db = c.get('db');
      try {
        const value = await db.createNewConfig({
          name: c.req.valid('json').name,
        });
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error creating new config:', error);
        return c.json(
          internalServerError('Failed to create new config', 500),
          500
        );
      }
    }
  )
  .get('/', async (c) => {
    const db = c.get('db');
    try {
      const configs = await db.listConfigs();
      return c.json(successResponse(configs, 200));
    } catch (error) {
      console.error('Error fetching configs:', error);
      return c.json(internalServerError('Failed to fetch configs', 500), 500);
    }
  })
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
      const id = c.req.valid('param').id;

      try {
        const config = await db.getConfigById({ configId: id });
        if (!config) {
          return c.json(clientErrorResponse('Config not found', 404), 404);
        }
        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error fetching config:', error);
        return c.json(internalServerError('Failed to fetch config', 500), 500);
      }
    }
  )
  .patch(
    '/:id',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
      })
    ),
    zv(
      'param',
      z.object({
        id: z.string().min(1),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const id = c.req.valid('param').id;

      try {
        const value = await db.updateConfigName({
          configId: id,
          newName: c.req.valid('json').name,
        });
        if (!value) {
          return c.json(clientErrorResponse('Config not found', 404), 404);
        }
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error updating config name:', error);
        return c.json(
          internalServerError('Failed to update config name', 500),
          500
        );
      }
    }
  )
  .get(
    '/:configId/variants',
    zv(
      'param',
      z.object({
        configId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const configId = c.req.valid('param').configId;

      try {
        const variants = await db.getConfigVariantsWithDetailsByConfigId({
          configId,
        });
        return c.json(successResponse(variants, 200));
      } catch (error) {
        console.error('Error fetching config variants:', error);
        return c.json(
          internalServerError('Failed to fetch config variants', 500),
          500
        );
      }
    }
  )
  .post(
    '/:configId/variants',
    zv(
      'param',
      z.object({
        configId: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        name: z.string().min(1),
        provider: z.string().min(1),
        modelName: z.string().min(1),
        jsonData: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const configId = c.req.valid('param').configId;
      const { name, provider, modelName, jsonData } = c.req.valid('json');

      try {
        const value = await db.createVariantAndLinkToConfig({
          configId,
          name,
          provider,
          modelName,
          jsonData: jsonData ?? {},
        });
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error creating variant and linking to config:', error);
        return c.json(
          internalServerError(
            'Failed to create variant and link to config',
            500
          ),
          500
        );
      }
    }
  )
  .delete(
    '/:configId/variants/:variantId',
    zv(
      'param',
      z.object({
        configId: z.string().uuid(),
        variantId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { configId, variantId } = c.req.valid('param');

      try {
        const value = await db.deleteConfigVariantByIds({
          configId,
          variantId,
        });
        if (!value) {
          return c.json(
            clientErrorResponse('Config variant not found', 404),
            404
          );
        }
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error removing variant from config:', error);
        return c.json(
          internalServerError('Failed to remove variant from config', 500),
          500
        );
      }
    }
  );

export default app;
