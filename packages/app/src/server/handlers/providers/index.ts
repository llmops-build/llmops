import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono().get(
  '/:providerId/models',
  zv(
    'param',
    z.object({
      providerId: z.string().min(1),
    })
  ),
  async (c) => {
    const providers = c.get('providers');
    const { providerId } = c.req.valid('param');

    try {
      const provider = providers[providerId as keyof typeof providers];
      if (!provider) {
        return c.json(
          clientErrorResponse(`Provider ${providerId} not found`, 404),
          404
        );
      }
      const models = await provider.getModels();
      return c.json(successResponse(models, 200));
    } catch (error) {
      console.error('Error fetching models:', error);
      return c.json(internalServerError('Failed to fetch models', 500), 500);
    }
  }
);

export default app;
