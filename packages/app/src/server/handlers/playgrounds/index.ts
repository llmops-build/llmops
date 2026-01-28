import { playgroundColumnSchema, type PlaygroundColumn } from '@llmops/core';
import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
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
  // Create a playground from a config
  .post(
    '/from-config',
    zv(
      'json',
      z.object({
        configId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        datasetId: z.string().uuid().nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { configId, variantId, datasetId } = c.req.valid('json');

      try {
        // Get config with its variants
        const configData = await db.getConfigWithVariants({ configId });
        if (!configData || configData.length === 0) {
          return c.json(clientErrorResponse('Config not found', 404), 404);
        }

        const config = configData[0];

        // Find the variant to use (either specified or first one)
        let selectedVariant = variantId
          ? configData.find((v) => v.variantId === variantId)
          : configData.find((v) => v.variantId !== null);

        // Build the first column from the variant data
        let firstColumn: PlaygroundColumn;

        if (selectedVariant && selectedVariant.variantId) {
          // Parse jsonData to extract messages and settings
          const jsonData =
            typeof selectedVariant.jsonData === 'string'
              ? (JSON.parse(selectedVariant.jsonData) as Record<string, unknown>)
              : (selectedVariant.jsonData as Record<string, unknown> | null);

          // Build messages array from jsonData
          let messages: PlaygroundColumn['messages'] = [
            { role: 'system', content: 'You are a helpful assistant' },
          ];

          if (jsonData?.messages && Array.isArray(jsonData.messages)) {
            messages = (
              jsonData.messages as Array<{ role: string; content: string }>
            ).map((msg) => ({
              role: msg.role as 'system' | 'user' | 'assistant',
              content: msg.content,
            }));
          } else if (jsonData?.system_prompt) {
            messages = [
              {
                role: 'system',
                content: jsonData.system_prompt as string,
              },
            ];
          }

          // Get provider config ID from provider slug
          let providerConfigId: string | null = null;
          if (selectedVariant.provider) {
            const providerConfig = await db.getProviderConfigBySlug({
              slug: selectedVariant.provider,
            });
            if (providerConfig) {
              providerConfigId = providerConfig.id;
            }
          }

          // Get model name from jsonData or fallback to modelName column
          const modelName =
            (jsonData?.model as string) || selectedVariant.modelName || '';

          firstColumn = {
            id: uuidv4(),
            name: selectedVariant.variantName || 'Prompt 1',
            position: 0,
            providerConfigId,
            modelName,
            messages,
            temperature: (jsonData?.temperature as number) ?? null,
            maxTokens: (jsonData?.max_tokens as number) ?? null,
            topP: (jsonData?.top_p as number) ?? null,
            frequencyPenalty: (jsonData?.frequency_penalty as number) ?? null,
            presencePenalty: (jsonData?.presence_penalty as number) ?? null,
          };
        } else {
          // No variant found, create default column
          firstColumn = {
            id: uuidv4(),
            name: 'Prompt 1',
            position: 0,
            providerConfigId: null,
            modelName: '',
            messages: [
              { role: 'system', content: 'You are a helpful assistant' },
            ],
            temperature: null,
            maxTokens: null,
            topP: null,
            frequencyPenalty: null,
            presencePenalty: null,
          };
        }

        // Create the playground
        const playground = await db.createNewPlayground({
          name: config.name || 'Untitled Playground',
          datasetId: datasetId ?? null,
          columns: [firstColumn],
        });

        if (!playground) {
          return c.json(
            internalServerError('Failed to create playground', 500),
            500
          );
        }

        return c.json(successResponse(playground, 200));
      } catch (error) {
        console.error('Error creating playground from config:', error);
        return c.json(
          internalServerError('Failed to create playground from config', 500),
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
