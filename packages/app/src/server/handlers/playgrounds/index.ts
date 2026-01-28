import { playgroundColumnSchema } from '@llmops/core';
import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';
import runs from './runs';
import execute from './execute';

const app = new Hono()
  // Mount sub-routers
  .route('/:id/runs', runs)
  .route('/:id/execute', execute)
  // Create a new playground
  .post(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
        datasetId: z.string().uuid().nullable().optional(),
        columns: z.array(playgroundColumnSchema).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { name, datasetId, columns } = c.req.valid('json');

      try {
        const playground = await db.createNewPlayground({
          name,
          datasetId,
          columns,
        });

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
        datasetId: z.string().uuid().nullable().optional(),
        columns: z.array(playgroundColumnSchema).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const { name, datasetId, columns } = c.req.valid('json');

      try {
        const playground = await db.updatePlayground({
          playgroundId: id,
          name,
          datasetId,
          columns,
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
