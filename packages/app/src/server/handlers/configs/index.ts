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
  );

export default app;
