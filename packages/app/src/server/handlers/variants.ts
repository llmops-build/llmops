import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
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
        const variant = await db.getVariantById({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error fetching variant:', error);
        return c.json(internalServerError('Failed to fetch variant', 500), 500);
      }
    }
  )
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
        name: z.string().optional(),
        provider: z.string().optional(),
        modelName: z.string().optional(),
        jsonData: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const updates = c.req.valid('json');

      try {
        const variant = await db.updateVariant({
          variantId: id,
          ...updates,
        });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error updating variant:', error);
        return c.json(
          internalServerError('Failed to update variant', 500),
          500
        );
      }
    }
  )
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
        const variant = await db.deleteVariant({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error deleting variant:', error);
        return c.json(
          internalServerError('Failed to delete variant', 500),
          500
        );
      }
    }
  )
  .get('/', async (c) => {
    const db = c.get('db');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    try {
      const variants = await db.listVariants({ limit, offset });
      return c.json(successResponse(variants, 200));
    } catch (error) {
      console.error('Error fetching variants:', error);
      return c.json(internalServerError('Failed to fetch variants', 500), 500);
    }
  })
  .post(
    '/',
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
      const { name, provider, modelName, jsonData } = c.req.valid('json');

      try {
        const variant = await db.createVariant({
          name,
          provider,
          modelName,
          jsonData: jsonData || {},
        });
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error creating variant:', error);
        return c.json(
          internalServerError('Failed to create variant', 500),
          500
        );
      }
    }
  );

export default app;
