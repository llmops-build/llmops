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
        description: z.string().optional(),
        state: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      try {
        const value = await db.createNewPlayground({
          name: c.req.valid('json').name,
          description: c.req.valid('json').description,
          state: c.req.valid('json').state,
        });
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error creating new playground:', error);
        return c.json(
          internalServerError('Failed to create new playground', 500),
          500
        );
      }
    }
  )
  .get('/', async (c) => {
    const db = c.get('db');
    try {
      const playgrounds = await db.listPlaygrounds();
      return c.json(successResponse(playgrounds, 200));
    } catch (error) {
      console.error('Error fetching playgrounds:', error);
      return c.json(
        internalServerError('Failed to fetch playgrounds', 500),
        500
      );
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
        const playground = await db.getPlaygroundById({ playgroundId: id });
        if (!playground) {
          return c.json(clientErrorResponse('Playground not found', 404), 404);
        }
        return c.json(successResponse(playground, 200));
      } catch (error) {
        console.error('Error fetching playground:', error);
        return c.json(
          internalServerError('Failed to fetch playground', 500),
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
        name: z.string().optional(),
        description: z.string().optional(),
        state: z.record(z.string(), z.unknown()).optional(),
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
      const { name, description, state } = c.req.valid('json');

      try {
        const value = await db.updatePlayground({
          playgroundId: id,
          name,
          description,
          state,
        });
        if (!value) {
          return c.json(clientErrorResponse('Playground not found', 404), 404);
        }
        return c.json(successResponse(value, 200));
      } catch (error) {
        console.error('Error updating playground:', error);
        return c.json(
          internalServerError('Failed to update playground', 500),
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
        const playground = await db.deletePlayground({ playgroundId: id });
        if (!playground) {
          return c.json(clientErrorResponse('Playground not found', 404), 404);
        }
        return c.json(successResponse(playground, 200));
      } catch (error) {
        console.error('Error deleting playground:', error);
        return c.json(
          internalServerError('Failed to delete playground', 500),
          500
        );
      }
    }
  );

export default app;
