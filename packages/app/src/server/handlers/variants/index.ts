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
        provider: z.string().min(1),
        modelName: z.string().min(1),
        jsonData: z.record(z.string(), z.unknown()).optional().default({}),
      })
    ),
    async (c) => {
      const db = c.get('db');
      try {
        const { name, provider, modelName, jsonData } = c.req.valid('json');
        const value = await db.createVariant({
          name,
          provider,
          modelName,
          jsonData,
        });
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error creating variant:', error);
        return c.json(
          internalServerError('Failed to create variant', 500),
          500
        );
      }
    }
  )
  .get('/', async (c) => {
    const db = c.get('db');
    try {
      const variants = await db.listVariants();
      return c.json(successResponse(variants, 200));
    } catch (error) {
      console.error('Error fetching variants:', error);
      return c.json(internalServerError('Failed to fetch variants', 500), 500);
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
        const variant = await db.getVariantById({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error fetching variant:', error);
        return c.json(
          internalServerError('Failed to fetch variant', 500),
          500
        );
      }
    }
  )
  .patch(
    '/:id',
    zv(
      'json',
      z.object({
        name: z.string().min(1).optional(),
        provider: z.string().min(1).optional(),
        modelName: z.string().min(1).optional(),
        jsonData: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const id = c.req.valid('param').id;
      const updates = c.req.valid('json');

      try {
        const value = await db.updateVariant({
          variantId: id,
          ...updates,
        });
        if (!value) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(value, 200));
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
      const id = c.req.valid('param').id;

      try {
        const value = await db.deleteVariant({ variantId: id });
        if (!value) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error deleting variant:', error);
        return c.json(
          internalServerError('Failed to delete variant', 500),
          500
        );
      }
    }
  );

export default app;
