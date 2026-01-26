import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  // Create a new playground
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
      const { name } = c.req.valid('json');

      try {
        const playground = await db.createNewPlayground({ name });

        if (!playground) {
          return c.json(
            internalServerError('Failed to create playground', 500),
            500
          );
        }

        return c.json(successResponse(playground, 200));
      } catch (error) {
        console.error('Error creating playground:', error);
        return c.json(
          internalServerError('Failed to create playground', 500),
          500
        );
      }
    }
  )
  // List all playgrounds
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
  // Get playground by ID
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
  // Update playground
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
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const playground = await db.updatePlayground({
          playgroundId: id,
          ...body,
        });
        if (!playground) {
          return c.json(clientErrorResponse('Playground not found', 404), 404);
        }
        return c.json(successResponse(playground, 200));
      } catch (error) {
        console.error('Error updating playground:', error);
        return c.json(
          internalServerError('Failed to update playground', 500),
          500
        );
      }
    }
  )
  // Delete playground
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
