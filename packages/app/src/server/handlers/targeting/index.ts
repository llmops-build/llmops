import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  // Create a new targeting rule
  .post(
    '/',
    zv(
      'json',
      z.object({
        environmentId: z.string().uuid(),
        configId: z.string().uuid(),
        configVariantId: z.string().uuid(),
        weight: z.number().int().min(0).max(10000).optional(),
        priority: z.number().int().optional(),
        enabled: z.boolean().optional(),
        conditions: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const body = c.req.valid('json');

      try {
        const rule = await db.createTargetingRule({
          environmentId: body.environmentId,
          configId: body.configId,
          configVariantId: body.configVariantId,
          weight: body.weight ?? 10000,
          priority: body.priority ?? 0,
          enabled: body.enabled ?? true,
          conditions: body.conditions,
        });
        return c.json(successResponse(rule, 200));
      } catch (error) {
        console.error('Error creating targeting rule:', error);
        return c.json(
          internalServerError('Failed to create targeting rule', 500),
          500
        );
      }
    }
  )
  // List all targeting rules
  .get('/', async (c) => {
    const db = c.get('db');

    try {
      const rules = await db.listTargetingRules();
      return c.json(successResponse(rules, 200));
    } catch (error) {
      console.error('Error fetching targeting rules:', error);
      return c.json(
        internalServerError('Failed to fetch targeting rules', 500),
        500
      );
    }
  })
  // Get targeting rule by ID
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
        const rule = await db.getTargetingRuleById({ id });
        if (!rule) {
          return c.json(
            clientErrorResponse('Targeting rule not found', 404),
            404
          );
        }
        return c.json(successResponse(rule, 200));
      } catch (error) {
        console.error('Error fetching targeting rule:', error);
        return c.json(
          internalServerError('Failed to fetch targeting rule', 500),
          500
        );
      }
    }
  )
  // Update targeting rule
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
        weight: z.number().int().min(0).max(10000).optional(),
        priority: z.number().int().optional(),
        enabled: z.boolean().optional(),
        conditions: z.record(z.string(), z.unknown()).nullable().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const rule = await db.updateTargetingRule({ id, ...body });
        if (!rule) {
          return c.json(
            clientErrorResponse('Targeting rule not found', 404),
            404
          );
        }
        return c.json(successResponse(rule, 200));
      } catch (error) {
        console.error('Error updating targeting rule:', error);
        return c.json(
          internalServerError('Failed to update targeting rule', 500),
          500
        );
      }
    }
  )
  // Delete targeting rule
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
        const rule = await db.deleteTargetingRule({ id });
        if (!rule) {
          return c.json(
            clientErrorResponse('Targeting rule not found', 404),
            404
          );
        }
        return c.json(successResponse(rule, 200));
      } catch (error) {
        console.error('Error deleting targeting rule:', error);
        return c.json(
          internalServerError('Failed to delete targeting rule', 500),
          500
        );
      }
    }
  )
  // Get targeting rules by config ID (with details)
  .get(
    '/config/:configId',
    zv(
      'param',
      z.object({
        configId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { configId } = c.req.valid('param');

      try {
        const rules = await db.getTargetingRulesWithDetailsByConfigId({
          configId,
        });
        return c.json(successResponse(rules, 200));
      } catch (error) {
        console.error('Error fetching targeting rules for config:', error);
        return c.json(
          internalServerError(
            'Failed to fetch targeting rules for config',
            500
          ),
          500
        );
      }
    }
  )
  // Get targeting rules by environment ID
  .get(
    '/environment/:environmentId',
    zv(
      'param',
      z.object({
        environmentId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { environmentId } = c.req.valid('param');

      try {
        const rules = await db.getTargetingRulesByEnvironmentId({
          environmentId,
        });
        return c.json(successResponse(rules, 200));
      } catch (error) {
        console.error('Error fetching targeting rules for environment:', error);
        return c.json(
          internalServerError(
            'Failed to fetch targeting rules for environment',
            500
          ),
          500
        );
      }
    }
  )
  // Set targeting for environment (simple: one variant at 100%)
  .post(
    '/set',
    zv(
      'json',
      z.object({
        environmentId: z.string().uuid(),
        configId: z.string().uuid(),
        configVariantId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const body = c.req.valid('json');

      try {
        const rule = await db.setTargetingForEnvironment(body);
        return c.json(successResponse(rule, 200));
      } catch (error) {
        console.error('Error setting targeting for environment:', error);
        return c.json(
          internalServerError('Failed to set targeting for environment', 500),
          500
        );
      }
    }
  );

export default app;
