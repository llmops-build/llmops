import 'dotenv/config';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { createLLMOpsMiddleware } from '@llmops/sdk/hono';
import llmopsClient from './llmops';

const app = new Hono();
const port = Number(process.env.PORT) || 3000;

const llmops = createLLMOpsMiddleware(llmopsClient);

// OpenAPI specification
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LLMOps Hono Example API',
    description: 'API documentation for the LLMOps Hono example server',
    version: '1.0.0',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Environment secret as Bearer token',
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        description: 'Basic health check endpoint',
        responses: {
          '200': {
            description: 'Server is running',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                  example: 'Hello from Hono!',
                },
              },
            },
          },
        },
      },
    },
    '/llmops/health': {
      get: {
        summary: 'LLMOps health check',
        description: 'Check if LLMOps middleware is running',
        responses: {
          '200': {
            description: 'LLMOps middleware is healthy',
          },
        },
      },
    },
    '/llmops/api/genai/v1/chat/completions': {
      post: {
        summary: 'Chat completions',
        description: 'OpenAI-compatible chat completions endpoint',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'x-llmops-config',
            in: 'header',
            required: true,
            description: 'LLMOps Config ID (UUID or short slug)',
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages', 'model'],
                properties: {
                  model: {
                    type: 'string',
                    description: 'Model to use for completion',
                    example: 'gpt-4o-mini',
                  },
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['role', 'content'],
                      properties: {
                        role: {
                          type: 'string',
                          enum: ['system', 'user', 'assistant'],
                        },
                        content: {
                          type: 'string',
                        },
                      },
                    },
                    example: [{ role: 'user', content: 'Hello, how are you?' }],
                  },
                  temperature: {
                    type: 'number',
                    minimum: 0,
                    maximum: 2,
                    description: 'Sampling temperature',
                  },
                  max_tokens: {
                    type: 'integer',
                    description: 'Maximum tokens to generate',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful completion',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    object: { type: 'string' },
                    created: { type: 'integer' },
                    model: { type: 'string' },
                    choices: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          index: { type: 'integer' },
                          message: {
                            type: 'object',
                            properties: {
                              role: { type: 'string' },
                              content: { type: 'string' },
                            },
                          },
                          finish_reason: { type: 'string' },
                        },
                      },
                    },
                    usage: {
                      type: 'object',
                      properties: {
                        prompt_tokens: { type: 'integer' },
                        completion_tokens: { type: 'integer' },
                        total_tokens: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request headers',
          },
          '401': {
            description: 'Missing or invalid Authorization header',
          },
        },
      },
    },
  },
};

// Serve OpenAPI spec as JSON
app.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

// Serve Swagger UI at root
app.get(
  '/',
  swaggerUI({
    url: '/openapi.json',
  })
);

// Health check endpoint
app.get('/health', (c) => {
  return c.text('Hello from Hono!');
});

// Mount LLMOps middleware
app.use('/llmops/*', llmops);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Server running at http://localhost:${info.port}`);
    console.log(
      `API Documentation available at http://localhost:${info.port}/`
    );
  }
);
