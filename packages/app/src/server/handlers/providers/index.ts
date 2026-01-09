import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';
import { cacheService } from '@server/services/cache';

const MODELS_DEV_API = 'https://models.dev/api.json';
const MODELS_DEV_LOGOS = 'https://models.dev/logos';

/**
 * Models.dev API response types
 * The API returns an object keyed by provider ID
 */
interface ModelsDevModel {
  id: string;
  name: string;
  family?: string;
  attachment: boolean;
  reasoning: boolean;
  tool_call: boolean;
  structured_output?: boolean;
  temperature?: boolean;
  knowledge?: string;
  release_date: string;
  last_updated: string;
  open_weights: boolean;
  status?: 'alpha' | 'beta' | 'deprecated';
  cost: {
    input: number;
    output: number;
    reasoning?: number;
    cache_read?: number;
    cache_write?: number;
    input_audio?: number;
    output_audio?: number;
  };
  limit: {
    context: number;
    input?: number;
    output: number;
  };
  modalities: {
    input: string[];
    output: string[];
  };
  interleaved?: boolean | { field: string };
}

interface ModelsDevProvider {
  id: string;
  name: string;
  npm: string;
  env: string[];
  doc: string;
  api?: string;
  models: Record<string, ModelsDevModel>;
}

// API returns object keyed by provider ID
type ModelsDevResponse = Record<string, ModelsDevProvider>;

// Cache for models.dev data
let modelsCache: ModelsDevResponse | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchModelsDevData(): Promise<ModelsDevResponse> {
  const now = Date.now();
  if (modelsCache && now - cacheTimestamp < CACHE_TTL) {
    return modelsCache;
  }

  const response = await fetch(MODELS_DEV_API);
  if (!response.ok) {
    throw new Error(`Failed to fetch models.dev API: ${response.status}`);
  }

  const data = await response.json();

  // Validate the response structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid response from models.dev API: expected object');
  }

  modelsCache = data as ModelsDevResponse;
  cacheTimestamp = now;
  return modelsCache;
}

const app = new Hono()
  // Get all providers
  .get('/', async (c) => {
    try {
      const data = await fetchModelsDevData();
      const providers = Object.values(data).map((provider) => ({
        id: provider.id,
        name: provider.name,
        logo: `${MODELS_DEV_LOGOS}/${provider.id}.svg`,
        npm: provider.npm,
        env: provider.env,
        doc: provider.doc,
        api: provider.api,
        modelCount: Object.keys(provider.models || {}).length,
      }));
      return c.json(successResponse(providers, 200));
    } catch (error) {
      console.error('Error fetching providers:', error);
      return c.json(internalServerError('Failed to fetch providers', 500), 500);
    }
  })
  // Get models for a specific provider
  .get(
    '/:providerId/models',
    zv(
      'param',
      z.object({
        providerId: z.string().min(1),
      })
    ),
    async (c) => {
      const { providerId } = c.req.valid('param');

      try {
        const data = await fetchModelsDevData();

        // Check if provider exists
        const provider = data[providerId];
        if (!provider) {
          return c.json(
            clientErrorResponse(`Provider ${providerId} not found`, 404),
            404
          );
        }

        // Get models for this provider
        const models = Object.values(provider.models || {}).map((model) => ({
          id: model.id,
          name: model.name,
          family: model.family,
          provider: {
            id: provider.id,
            name: provider.name,
            logo: `${MODELS_DEV_LOGOS}/${provider.id}.svg`,
          },
          capabilities: {
            attachment: model.attachment,
            reasoning: model.reasoning,
            tool_call: model.tool_call,
            structured_output: model.structured_output,
            temperature: model.temperature,
          },
          pricing: {
            input: model.cost?.input,
            output: model.cost?.output,
            reasoning: model.cost?.reasoning,
            cache_read: model.cost?.cache_read,
            cache_write: model.cost?.cache_write,
          },
          limits: {
            context: model.limit?.context,
            input: model.limit?.input,
            output: model.limit?.output,
          },
          modalities: model.modalities,
          knowledge: model.knowledge,
          release_date: model.release_date,
          last_updated: model.last_updated,
          open_weights: model.open_weights,
          status: model.status,
        }));

        return c.json(successResponse(models, 200));
      } catch (error) {
        console.error('Error fetching models:', error);
        return c.json(internalServerError('Failed to fetch models', 500), 500);
      }
    }
  )
  // Get all models from all providers
  .get('/models', async (c) => {
    try {
      const data = await fetchModelsDevData();

      const allModels: Array<{
        id: string;
        name: string;
        family?: string;
        provider: { id: string; name: string; logo: string };
        capabilities: Record<string, boolean | undefined>;
        pricing: Record<string, number | undefined>;
        limits: Record<string, number | undefined>;
        modalities: { input: string[]; output: string[] };
        knowledge?: string;
        release_date: string;
        last_updated: string;
        open_weights: boolean;
        status?: string;
      }> = [];

      for (const provider of Object.values(data)) {
        for (const model of Object.values(provider.models || {})) {
          allModels.push({
            id: model.id,
            name: model.name,
            family: model.family,
            provider: {
              id: provider.id,
              name: provider.name,
              logo: `${MODELS_DEV_LOGOS}/${provider.id}.svg`,
            },
            capabilities: {
              attachment: model.attachment,
              reasoning: model.reasoning,
              tool_call: model.tool_call,
              structured_output: model.structured_output,
              temperature: model.temperature,
            },
            pricing: {
              input: model.cost?.input,
              output: model.cost?.output,
              reasoning: model.cost?.reasoning,
              cache_read: model.cost?.cache_read,
              cache_write: model.cost?.cache_write,
            },
            limits: {
              context: model.limit?.context,
              input: model.limit?.input,
              output: model.limit?.output,
            },
            modalities: model.modalities,
            knowledge: model.knowledge,
            release_date: model.release_date,
            last_updated: model.last_updated,
            open_weights: model.open_weights,
            status: model.status,
          });
        }
      }

      return c.json(successResponse(allModels, 200));
    } catch (error) {
      console.error('Error fetching models:', error);
      return c.json(internalServerError('Failed to fetch models', 500), 500);
    }
  })
  // =============================================
  // Provider Configs CRUD (stored configurations)
  // =============================================

  // List all provider configs
  .get('/configs', async (c) => {
    const db = c.get('db');

    try {
      const configs = await db.listProviderConfigs();
      return c.json(successResponse(configs, 200));
    } catch (error) {
      console.error('Error fetching provider configs:', error);
      return c.json(
        internalServerError('Failed to fetch provider configs', 500),
        500
      );
    }
  })
  // Get provider config by ID
  .get(
    '/configs/:id',
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
        const config = await db.getProviderConfigById({ id });
        if (!config) {
          return c.json(
            clientErrorResponse('Provider config not found', 404),
            404
          );
        }
        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error fetching provider config:', error);
        return c.json(
          internalServerError('Failed to fetch provider config', 500),
          500
        );
      }
    }
  )
  // Create or update provider config (upsert)
  .post(
    '/configs',
    zv(
      'json',
      z.object({
        providerId: z.string().min(1),
        config: z.record(z.string(), z.unknown()),
        enabled: z.boolean().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const body = c.req.valid('json');

      try {
        const config = await db.upsertProviderConfig({
          providerId: body.providerId,
          config: body.config,
          enabled: body.enabled ?? true,
        });

        if (!config) {
          return c.json(
            internalServerError('Failed to create/update provider config', 500),
            500
          );
        }

        await cacheService.delete(
          `provider:${config.providerId}`,
          'provider-configs'
        );

        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error creating/updating provider config:', error);
        return c.json(
          internalServerError('Failed to create/update provider config', 500),
          500
        );
      }
    }
  )
  // Update provider config
  .patch(
    '/configs/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        config: z.record(z.string(), z.unknown()).optional(),
        enabled: z.boolean().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const config = await db.updateProviderConfig({
          id,
          ...body,
        });
        if (!config) {
          return c.json(
            clientErrorResponse('Provider config not found', 404),
            404
          );
        }
        await cacheService.delete(
          `provider:${config.providerId}`,
          'provider-configs'
        );
        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error updating provider config:', error);
        return c.json(
          internalServerError('Failed to update provider config', 500),
          500
        );
      }
    }
  )
  // Delete provider config
  .delete(
    '/configs/:id',
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
        const config = await db.deleteProviderConfig({ id });
        if (!config) {
          return c.json(
            clientErrorResponse('Provider config not found', 404),
            404
          );
        }
        await cacheService.delete(
          `provider:${config.providerId}`,
          'provider-configs'
        );
        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error deleting provider config:', error);
        return c.json(
          internalServerError('Failed to delete provider config', 500),
          500
        );
      }
    }
  );

export default app;
