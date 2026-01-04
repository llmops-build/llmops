import { internalServerError, successResponse } from '@shared/responses';
import { Hono } from 'hono';

const app = new Hono()
  // Mark setup as complete
  .post('/complete-setup', async (c) => {
    const db = c.get('db') as any;

    try {
      const settings = await db.markSetupComplete();
      return c.json(successResponse(settings, 200));
    } catch (error) {
      console.error('Error completing setup:', error);
      return c.json(internalServerError('Failed to complete setup', 500), 500);
    }
  });

export default app;
