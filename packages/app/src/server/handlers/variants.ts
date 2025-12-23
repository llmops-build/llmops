import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
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
      const versionParam = c.req.query('version');

      try {
        // Get variant metadata
        const variant = await db.getVariantById({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }

        // Get the requested version or latest
        let versionData;
        if (versionParam) {
          const versionNumber = parseInt(versionParam, 10);
          if (isNaN(versionNumber) || versionNumber < 1) {
            return c.json(
              clientErrorResponse('Invalid version number', 400),
              400
            );
          }
          versionData = await db.getVariantVersionByNumber({
            variantId: id,
            version: versionNumber,
          });
          if (!versionData) {
            return c.json(
              clientErrorResponse(`Version ${versionNumber} not found`, 404),
              404
            );
          }
        } else {
          versionData = await db.getLatestVariantVersion({ variantId: id });
        }

        // Flatten the response
        const response = {
          id: variant.id,
          name: variant.name,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
          // Version data flattened
          versionId: versionData?.id ?? null,
          version: versionData?.version ?? null,
          provider: versionData?.provider ?? null,
          modelName: versionData?.modelName ?? null,
          jsonData: versionData?.jsonData ?? null,
          versionCreatedAt: versionData?.createdAt ?? null,
        };

        return c.json(successResponse(response, 200));
      } catch (error) {
        console.error('Error fetching variant:', error);
        return c.json(internalServerError('Failed to fetch variant', 500), 500);
      }
    }
  )
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
        name: z.string().optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const updates = c.req.valid('json');

      try {
        const variant = await db.updateVariant({
          variantId: id,
          ...updates,
        });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error updating variant:', error);
        return c.json(
          internalServerError('Failed to update variant', 500),
          500
        );
      }
    }
  )
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
        const variant = await db.deleteVariant({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error deleting variant:', error);
        return c.json(
          internalServerError('Failed to delete variant', 500),
          500
        );
      }
    }
  )
  .get('/', async (c) => {
    const db = c.get('db');
    const limit = parseInt(c.req.query('limit') || '100');
    const offset = parseInt(c.req.query('offset') || '0');

    try {
      const variants = await db.listVariantsWithLatestVersion({
        limit,
        offset,
      });

      // Flatten the response for each variant
      const flattenedVariants = variants.map((v) => ({
        id: v.id,
        name: v.name,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
        // Version data flattened
        versionId: v.latestVersion?.id ?? null,
        version: v.latestVersion?.version ?? null,
        provider: v.latestVersion?.provider ?? null,
        modelName: v.latestVersion?.modelName ?? null,
        jsonData: v.latestVersion?.jsonData ?? null,
        versionCreatedAt: v.latestVersion?.createdAt ?? null,
      }));

      return c.json(successResponse(flattenedVariants, 200));
    } catch (error) {
      console.error('Error fetching variants:', error);
      return c.json(internalServerError('Failed to fetch variants', 500), 500);
    }
  })
  .post(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { name } = c.req.valid('json');

      try {
        const variant = await db.createVariant({ name });
        return c.json(successResponse(variant, 200));
      } catch (error) {
        console.error('Error creating variant:', error);
        return c.json(
          internalServerError('Failed to create variant', 500),
          500
        );
      }
    }
  )
  // Get versions for a variant
  .get(
    '/:id/versions',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const limit = parseInt(c.req.query('limit') || '100');
      const offset = parseInt(c.req.query('offset') || '0');

      try {
        const versions = await db.getVariantVersionsByVariantId({
          variantId: id,
          limit,
          offset,
        });
        return c.json(successResponse(versions, 200));
      } catch (error) {
        console.error('Error fetching variant versions:', error);
        return c.json(
          internalServerError('Failed to fetch variant versions', 500),
          500
        );
      }
    }
  )
  // Create a new version for a variant
  .post(
    '/:id/versions',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      })
    ),
    zv(
      'json',
      z.object({
        provider: z.string().min(1),
        modelName: z.string().min(1),
        jsonData: z.record(z.string(), z.unknown()).optional(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { id } = c.req.valid('param');
      const { provider, modelName, jsonData } = c.req.valid('json');

      try {
        // Verify variant exists
        const variant = await db.getVariantById({ variantId: id });
        if (!variant) {
          return c.json(clientErrorResponse('Variant not found', 404), 404);
        }

        const version = await db.createVariantVersion({
          variantId: id,
          provider,
          modelName,
          jsonData: jsonData || {},
        });
        return c.json(successResponse(version, 200));
      } catch (error) {
        console.error('Error creating variant version:', error);
        return c.json(
          internalServerError('Failed to create variant version', 500),
          500
        );
      }
    }
  )
  // Get a specific version
  .get(
    '/:id/versions/:versionId',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        versionId: z.string().uuid(),
      })
    ),
    async (c) => {
      const db = c.get('db');
      const { versionId } = c.req.valid('param');

      try {
        const version = await db.getVariantVersionById({ id: versionId });
        if (!version) {
          return c.json(clientErrorResponse('Version not found', 404), 404);
        }
        return c.json(successResponse(version, 200));
      } catch (error) {
        console.error('Error fetching variant version:', error);
        return c.json(
          internalServerError('Failed to fetch variant version', 500),
          500
        );
      }
    }
  );

export default app;
