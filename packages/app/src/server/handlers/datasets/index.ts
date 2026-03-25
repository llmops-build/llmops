import { zv } from '@server/lib/zv';
import {
  clientErrorResponse,
  internalServerError,
  successResponse,
} from '@shared/responses';
import { Hono } from 'hono';
import z from 'zod';

const app = new Hono()
  // ============ Dataset CRUD ============

  // Create a new dataset
  .post(
    '/',
    zv(
      'json',
      z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { name, description } = c.req.valid('json');

      try {
        const dataset = await db.createDataset({ name, description });

        if (!dataset) {
          return c.json(
            internalServerError('Failed to create dataset', 500),
            500,
          );
        }

        return c.json(successResponse(dataset, 200));
      } catch (error) {
        console.error('Error creating dataset:', error);
        return c.json(
          internalServerError('Failed to create dataset', 500),
          500,
        );
      }
    },
  )

  // List all datasets
  .get('/', async (c) => {
    const db = c.get('db')!;

    try {
      const datasets = await db.listDatasets();
      return c.json(successResponse(datasets, 200));
    } catch (error) {
      console.error('Error fetching datasets:', error);
      return c.json(internalServerError('Failed to fetch datasets', 500), 500);
    }
  })

  // Get dataset by ID
  .get(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');

      try {
        const dataset = await db.getDatasetById({ datasetId: id });
        if (!dataset) {
          return c.json(clientErrorResponse('Dataset not found', 404), 404);
        }
        return c.json(successResponse(dataset, 200));
      } catch (error) {
        console.error('Error fetching dataset:', error);
        return c.json(internalServerError('Failed to fetch dataset', 500), 500);
      }
    },
  )

  // Update dataset
  .patch(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    zv(
      'json',
      z.object({
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const dataset = await db.updateDataset({
          datasetId: id,
          ...body,
        });
        if (!dataset) {
          return c.json(clientErrorResponse('Dataset not found', 404), 404);
        }
        return c.json(successResponse(dataset, 200));
      } catch (error) {
        console.error('Error updating dataset:', error);
        return c.json(
          internalServerError('Failed to update dataset', 500),
          500,
        );
      }
    },
  )

  // Delete dataset
  .delete(
    '/:id',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');

      try {
        const dataset = await db.deleteDataset({ datasetId: id });
        if (!dataset) {
          return c.json(clientErrorResponse('Dataset not found', 404), 404);
        }
        return c.json(successResponse(dataset, 200));
      } catch (error) {
        console.error('Error deleting dataset:', error);
        return c.json(
          internalServerError('Failed to delete dataset', 500),
          500,
        );
      }
    },
  )

  // ============ Record CRUD ============

  // List records for a dataset
  .get(
    '/:id/records',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    zv(
      'query',
      z.object({
        limit: z.coerce.number().int().positive().optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');
      const { limit, offset } = c.req.valid('query');

      try {
        const records = await db.listRecords({ datasetId: id, limit, offset });
        return c.json(successResponse(records, 200));
      } catch (error) {
        console.error('Error fetching records:', error);
        return c.json(internalServerError('Failed to fetch records', 500), 500);
      }
    },
  )

  // Create a new record
  .post(
    '/:id/records',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    zv(
      'json',
      z.object({
        input: z.record(z.string(), z.unknown()),
        expected: z.record(z.string(), z.unknown()).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const record = await db.createRecord({
          datasetId: id,
          ...body,
        });

        if (!record) {
          return c.json(
            internalServerError('Failed to create record', 500),
            500,
          );
        }

        return c.json(successResponse(record, 200));
      } catch (error) {
        console.error('Error creating record:', error);
        return c.json(internalServerError('Failed to create record', 500), 500);
      }
    },
  )

  // Update a record
  .patch(
    '/:id/records/:recordId',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        recordId: z.string().uuid(),
      }),
    ),
    zv(
      'json',
      z.object({
        input: z.record(z.string(), z.unknown()).optional(),
        expected: z.record(z.string(), z.unknown()).nullable().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { recordId } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const record = await db.updateRecord({
          recordId,
          ...body,
        });
        if (!record) {
          return c.json(clientErrorResponse('Record not found', 404), 404);
        }
        return c.json(successResponse(record, 200));
      } catch (error) {
        console.error('Error updating record:', error);
        return c.json(internalServerError('Failed to update record', 500), 500);
      }
    },
  )

  // Delete a record
  .delete(
    '/:id/records/:recordId',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        recordId: z.string().uuid(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { recordId } = c.req.valid('param');

      try {
        const record = await db.deleteRecord({ recordId });
        if (!record) {
          return c.json(clientErrorResponse('Record not found', 404), 404);
        }
        return c.json(successResponse(record, 200));
      } catch (error) {
        console.error('Error deleting record:', error);
        return c.json(internalServerError('Failed to delete record', 500), 500);
      }
    },
  )

  // ============ Version CRUD ============

  // List versions for a dataset
  .get(
    '/:id/versions',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    zv(
      'query',
      z.object({
        limit: z.coerce.number().int().positive().optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');
      const { limit, offset } = c.req.valid('query');

      try {
        const versions = await db.listVersions({
          datasetId: id,
          limit,
          offset,
        });
        return c.json(successResponse(versions, 200));
      } catch (error) {
        console.error('Error fetching versions:', error);
        return c.json(
          internalServerError('Failed to fetch versions', 500),
          500,
        );
      }
    },
  )

  // Create a new version (snapshot current records)
  .post(
    '/:id/versions',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
      }),
    ),
    zv(
      'json',
      z.object({
        name: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      try {
        const version = await db.createVersion({
          datasetId: id,
          ...body,
        });

        if (!version) {
          return c.json(
            internalServerError('Failed to create version', 500),
            500,
          );
        }

        return c.json(successResponse(version, 200));
      } catch (error) {
        console.error('Error creating version:', error);
        return c.json(
          internalServerError('Failed to create version', 500),
          500,
        );
      }
    },
  )

  // Get records for a specific version
  .get(
    '/:id/versions/:versionId/records',
    zv(
      'param',
      z.object({
        id: z.string().uuid(),
        versionId: z.string().uuid(),
      }),
    ),
    zv(
      'query',
      z.object({
        limit: z.coerce.number().int().positive().optional(),
        offset: z.coerce.number().int().nonnegative().optional(),
      }),
    ),
    async (c) => {
      const db = c.get('db')!;
      const { versionId } = c.req.valid('param');
      const { limit, offset } = c.req.valid('query');

      try {
        const records = await db.getVersionRecords({
          versionId,
          limit,
          offset,
        });
        return c.json(successResponse(records, 200));
      } catch (error) {
        console.error('Error fetching version records:', error);
        return c.json(
          internalServerError('Failed to fetch version records', 500),
          500,
        );
      }
    },
  );

export default app;
