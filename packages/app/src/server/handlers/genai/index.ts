import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { HTTPException } from 'hono/http-exception';
import chatCompletions from './openai/chatCompletions';
import { completions } from './openai/completions';
import models from './openai/models';
import { requestValidator } from './requestValidator';
import { createRequestGuardMiddleware } from './requestGuard';

const app = new Hono();

// Middleware
app
  .use('*', prettyJSON())
  // Health check endpoint
  .get('/health', async (c) => {
    return c.json({ status: 'healthy' });
  })
  .use('*', requestValidator)
  .use('*', createRequestGuardMiddleware())
  // Models
  .route('/models', models)
  // Chat completions
  .route('/chat/completions', chatCompletions)
  // Completions (legacy)
  .post('/completions', completions)
  // Error handling
  .notFound((c) =>
    c.json(
      { error: { message: 'Not Found', type: 'invalid_request_error' } },
      404
    )
  )
  .onError((err, c) => {
    if (err instanceof HTTPException) {
      return err.getResponse();
    }
    return c.json(
      { error: { message: 'Internal Server Error', type: 'api_error' } },
      500
    );
  });

export default app;
