import { zv } from '@server/lib/zv';
import { internalServerError, successResponse } from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const createNewConfigForm = z.object({
  name: z.string().min(1),
});

const app = new Hono().post('/', zv('form', createNewConfigForm), async (c) => {
  const db = c.get('db');
  console.log('Creating new config with name:', c.req.valid('form').name);
  try {
    const value = await db.createNewConfig({
      name: c.req.valid('form').name,
    });
    return c.json(successResponse(value, 200));
  } catch (error) {
    console.error('Error creating new config:', error);
    return c.json(internalServerError('Failed to create new config', 500), 500);
  }
});

export default app;
