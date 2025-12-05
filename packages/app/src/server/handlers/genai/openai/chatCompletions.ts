import { Hono } from 'hono';
import {
  chatCompletionCreateParamsBaseSchema,
  SupportedProviders,
} from '@llmops/core';
import { zv } from '@server/lib/zv';

const app = new Hono().post(
  '/',
  zv('json', chatCompletionCreateParamsBaseSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const providers = c.get('providers');
      const provider = providers[SupportedProviders.OPENROUTER];
      const transformedBody = await provider.getChatCompletionResponse(body);
      return c.json(transformedBody);
    } catch (e) {
      console.log('Error in chat completions handler:', e);
      return c.json({ ok: false, error: e }, 400);
    }
  }
);

export default app;
