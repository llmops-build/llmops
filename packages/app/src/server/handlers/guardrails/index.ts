import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { invalidateManifest } from '@server/services/manifest';
import { Hono } from 'hono';
import z from 'zod';
// Import manifest directly - works in both dev and production builds
// Note: 'with { type: "json" }' is required for Node.js v24+ compatibility
import defaultManifest from '@llmops/gateway/plugins/default/manifest.json' with { type: 'json' };

// Type for the manifest structure
interface ManifestFunction {
  name: string;
  id: string;
  type: 'guardrail' | 'transformer';
  supportedHooks: string[];
  description: Array<{ type: string; text: string }>;
  parameters?: {
    type: string;
    properties?: Record<string, unknown>;
    required?: string[];
  };
}

interface Manifest {
  id: string;
  name: string;
  description: string;
  credentials: unknown[];
  functions: ManifestFunction[];
}

function getDefaultManifest(): Manifest {
  return defaultManifest as Manifest;
}

const app = new Hono()
  // =============================================
  // Available Guardrails (from manifest)
  // =============================================

  // Get all available guardrails from the default plugin manifest
  .get('/available', async (c) => {
    try {
      const manifest = getDefaultManifest();
      // Filter to only guardrail type functions (not transformers)
      const guardrails = manifest.functions.filter(
        (f: ManifestFunction) => f.type === 'guardrail'
      );
      return c.json(successResponse(guardrails, 200));
    } catch (error) {
      console.error('Error fetching available guardrails:', error);
      return c.json(
        internalServerError('Failed to fetch available guardrails', 500),
        500
      );
    }
  })

  // =============================================
  // Guardrail Configs CRUD
  // =============================================

  // List all guardrail configs
  .get('/configs', async (c) => {
    const db = c.get('db');

    try {
      const configs = await db.listGuardrailConfigs();
      return c.json(successResponse(configs, 200));
    } catch (error) {
      console.error('Error fetching guardrail configs:', error);
      return c.json(
        internalServerError('Failed to fetch guardrail configs', 500),
        500
      );
    }
  })

  // Get guardrail config by ID
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
        const config = await db.getGuardrailConfigById({ id });
        if (!config) {
          return c.json(
            clientErrorResponse('Guardrail config not found', 404),
            404
          );
        }
        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error fetching guardrail config:', error);
        return c.json(
          internalServerError('Failed to fetch guardrail config', 500),
          500
        );
      }
    }
  )

  // Create new guardrail config
  .post(
    '/configs',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
        pluginId: z.string().min(1),
        functionId: z.string().min(1),
        hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
        parameters: z.record(z.string(), z.unknown()).optional(),
        enabled: z.boolean().optional(),
        priority: z.number().int().optional(),
        onFail: z.enum(['block', 'log']).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const body = c.req.valid('json');

      try {
        const config = await db.createGuardrailConfig({
          name: body.name,
          pluginId: body.pluginId,
          functionId: body.functionId,
          hookType: body.hookType,
          parameters: body.parameters ?? {},
          enabled: body.enabled ?? true,
          priority: body.priority ?? 0,
          onFail: body.onFail ?? 'block',
        });

        if (!config) {
          return c.json(
            internalServerError('Failed to create guardrail config', 500),
            500
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error creating guardrail config:', error);
        return c.json(
          internalServerError('Failed to create guardrail config', 500),
          500
        );
      }
    }
  )

  // Update guardrail config
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
        name: z.string().min(1).optional(),
        hookType: z.enum(['beforeRequestHook', 'afterRequestHook']).optional(),
        parameters: z.record(z.string(), z.unknown()).optional(),
        enabled: z.boolean().optional(),
        priority: z.number().int().optional(),
        onFail: z.enum(['block', 'log']).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const config = await db.updateGuardrailConfig({
          id,
          ...body,
        });
        if (!config) {
          return c.json(
            clientErrorResponse('Guardrail config not found', 404),
            404
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error updating guardrail config:', error);
        return c.json(
          internalServerError('Failed to update guardrail config', 500),
          500
        );
      }
    }
  )

  // Delete guardrail config
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
        // First delete all provider overrides for this guardrail
        await db.deleteOverridesByGuardrailConfigId({ guardrailConfigId: id });

        // Then delete the guardrail config itself
        const config = await db.deleteGuardrailConfig({ id });
        if (!config) {
          return c.json(
            clientErrorResponse('Guardrail config not found', 404),
            404
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(config, 200));
      } catch (error) {
        console.error('Error deleting guardrail config:', error);
        return c.json(
          internalServerError('Failed to delete guardrail config', 500),
          500
        );
      }
    }
  )

  // =============================================
  // Provider Guardrail Overrides CRUD
  // =============================================

  // Get all overrides for a guardrail config
  .get(
    '/configs/:id/overrides',
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
        const overrides = await db.getOverridesByGuardrailConfigId({
          guardrailConfigId: id,
        });
        return c.json(successResponse(overrides, 200));
      } catch (error) {
        console.error('Error fetching guardrail overrides:', error);
        return c.json(
          internalServerError('Failed to fetch guardrail overrides', 500),
          500
        );
      }
    }
  )

  // Create or update provider override for a guardrail
  .post(
    '/configs/:id/overrides',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        providerConfigId: z.string().uuid(),
        enabled: z.boolean().optional(),
        parameters: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        // Verify guardrail config exists
        const guardrailConfig = await db.getGuardrailConfigById({ id });
        if (!guardrailConfig) {
          return c.json(
            clientErrorResponse('Guardrail config not found', 404),
            404
          );
        }

        // Verify provider config exists
        const providerConfig = await db.getProviderConfigById({
          id: body.providerConfigId,
        });
        if (!providerConfig) {
          return c.json(
            clientErrorResponse('Provider config not found', 404),
            404
          );
        }

        const override = await db.upsertProviderGuardrailOverride({
          guardrailConfigId: id,
          providerConfigId: body.providerConfigId,
          enabled: body.enabled ?? true,
          parameters: body.parameters,
        });

        if (!override) {
          return c.json(
            internalServerError('Failed to create guardrail override', 500),
            500
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(override, 200));
      } catch (error) {
        console.error('Error creating guardrail override:', error);
        return c.json(
          internalServerError('Failed to create guardrail override', 500),
          500
        );
      }
    }
  )

  // Update provider override
  .patch(
    '/overrides/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        enabled: z.boolean().optional(),
        parameters: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const override = await db.updateProviderGuardrailOverride({
          id,
          ...body,
        });
        if (!override) {
          return c.json(
            clientErrorResponse('Guardrail override not found', 404),
            404
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(override, 200));
      } catch (error) {
        console.error('Error updating guardrail override:', error);
        return c.json(
          internalServerError('Failed to update guardrail override', 500),
          500
        );
      }
    }
  )

  // Delete provider override
  .delete(
    '/overrides/:id',
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
        const override = await db.deleteProviderGuardrailOverride({ id });
        if (!override) {
          return c.json(
            clientErrorResponse('Guardrail override not found', 404),
            404
          );
        }

        // Invalidate manifest so guardrails are reloaded
        await invalidateManifest();

        return c.json(successResponse(override, 200));
      } catch (error) {
        console.error('Error deleting guardrail override:', error);
        return c.json(
          internalServerError('Failed to delete guardrail override', 500),
          500
        );
      }
    }
  );

export default app;
