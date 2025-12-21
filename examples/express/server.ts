import 'dotenv/config';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createLLMOpsMiddleware } from '@llmops/sdk/express';
import OpenAI from 'openai';
import llmopsClient from './llmops';

const app = express();
const port = 3000;

const llmops = createLLMOpsMiddleware(llmopsClient);

// OpenAPI specification
const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'LLMOps Express Example API',
    description: 'API documentation for the LLMOps Express example server',
    version: '1.0.0',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Local development server',
    },
  ],
  paths: {
    '/': {
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
                  example: 'Hello World!',
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
        parameters: [
          {
            name: 'x-llmops-config',
            in: 'header',
            required: true,
            description: 'LLMOps Config ID (UUID)',
            schema: {
              type: 'string',
              format: 'uuid',
            },
          },
          {
            name: 'x-llmops-environment',
            in: 'header',
            required: false,
            description:
              'Environment secret (optional - uses production if not provided)',
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
          '403': {
            description: 'Cross-origin requests require an environment ID',
          },
        },
      },
    },
    '/api/openai/completion': {
      post: {
        summary: 'OpenAI completion (direct)',
        description: 'Direct OpenAI API call with provided API key',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['apiKey', 'prompt'],
                properties: {
                  apiKey: {
                    type: 'string',
                    description: 'OpenAI API key',
                  },
                  model: {
                    type: 'string',
                    default: 'gpt-4o-mini',
                    description: 'Model to use',
                  },
                  prompt: {
                    type: 'string',
                    description: 'User prompt',
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
                    model: { type: 'string' },
                    usage: {
                      type: 'object',
                      properties: {
                        prompt_tokens: { type: 'integer' },
                        completion_tokens: { type: 'integer' },
                        total_tokens: { type: 'integer' },
                      },
                    },
                    response: { type: 'string' },
                    created: { type: 'integer' },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Missing API key or prompt',
          },
          '500': {
            description: 'OpenAI API error',
          },
        },
      },
    },
  },
};

app.use(express.json());

// Serve Swagger UI at root
app.use('/', swaggerUi.serve);
app.get(
  '/',
  swaggerUi.setup(openApiSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'LLMOps API Documentation',
  })
);

app.use('/llmops', llmops);

// OpenAI API endpoint for secure server-side requests
app.post('/api/openai/completion', async (req, res) => {
  try {
    const { model, prompt, apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const chatCompletion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model || 'gpt-4o-mini',
    });

    res.json({
      model: chatCompletion.model,
      usage: chatCompletion.usage,
      response: chatCompletion.choices[0].message.content,
      created: chatCompletion.created,
    });
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    res.status(error.status || 500).json({
      error: error.message || 'An error occurred while processing your request',
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Documentation available at http://localhost:${port}/`);
});
