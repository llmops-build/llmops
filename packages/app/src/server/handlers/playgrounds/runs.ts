import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  // List all runs for a playground
  .get(
    '/',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id: playgroundId } = c.req.valid('param');

      try {
        const runs = await db.listPlaygroundRuns({ playgroundId });
        return c.json(successResponse(runs, 200));
      } catch (error) {
        console.error('Error fetching playground runs:', error);
        return c.json(
          internalServerError('Failed to fetch playground runs', 500),
          500,
        );
      }
    },
  )
  // Get a specific run by ID
  .get(
    '/:runId',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        runId: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { runId } = c.req.valid('param');

      try {
        const run = await db.getPlaygroundRunById({ runId });
        if (!run) {
          return c.json(clientErrorResponse('Run not found', 404), 404);
        }
        return c.json(successResponse(run, 200));
      } catch (error) {
        console.error('Error fetching playground run:', error);
        return c.json(
          internalServerError('Failed to fetch playground run', 500),
          500,
        );
      }
    },
  )
  // Get results for a specific run
  .get(
    '/:runId/results',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        runId: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { runId } = c.req.valid('param');

      try {
        const results = await db.listPlaygroundResults({ runId });
        return c.json(successResponse(results, 200));
      } catch (error) {
        console.error('Error fetching playground results:', error);
        return c.json(
          internalServerError('Failed to fetch playground results', 500),
          500,
        );
      }
    },
  )
  // Delete a run
  .delete(
    '/:runId',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        runId: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { runId } = c.req.valid('param');

      try {
        // Delete results first
        await db.deletePlaygroundResultsByRunId({ runId });
        // Then delete the run
        const run = await db.deletePlaygroundRun({ runId });
        if (!run) {
          return c.json(clientErrorResponse('Run not found', 404), 404);
        }
        return c.json(successResponse(run, 200));
      } catch (error) {
        console.error('Error deleting playground run:', error);
        return c.json(
          internalServerError('Failed to delete playground run', 500),
          500,
        );
      }
    },
  );

export default app;
