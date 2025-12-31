import { zv } from '@server/lib/zv';
import { internalServerError, successResponse } from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  // Get workspace settings
  .get('/', async (c) => {
    const db = c.get('db');

    try {
      const settings = await db.getWorkspaceSettings();
      return c.json(successResponse(settings, 200));
    } catch (error) {
      console.error('Error fetching workspace settings:', error);
      return c.json(
        internalServerError('Failed to fetch workspace settings', 500),
        500
      );
    }
  })
  // Update workspace settings
  .patch(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const body = c.req.valid('json');

      try {
        const settings = await db.updateWorkspaceSettings(body);
        return c.json(successResponse(settings, 200));
      } catch (error) {
        console.error('Error updating workspace settings:', error);
        return c.json(
          internalServerError('Failed to update workspace settings', 500),
          500
        );
      }
    }
  );

export default app;
