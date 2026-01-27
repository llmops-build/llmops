import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID, createHash } from 'node:crypto';
import z from 'zod';

// Dataset schemas
const createDataset = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
});

const updateDataset = z.object({
  datasetId: z.string().uuid(),
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

const getDatasetById = z.object({
  datasetId: z.string().uuid(),
});

const deleteDataset = z.object({
  datasetId: z.string().uuid(),
});

const listDatasets = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Record schemas
const createRecord = z.object({
  datasetId: z.string().uuid(),
  input: z.record(z.string(), z.unknown()),
  expected: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const updateRecord = z.object({
  recordId: z.string().uuid(),
  input: z.record(z.string(), z.unknown()).optional(),
  expected: z.record(z.string(), z.unknown()).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const deleteRecord = z.object({
  recordId: z.string().uuid(),
});

const listRecords = z.object({
  datasetId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Version schemas
const createVersion = z.object({
  datasetId: z.string().uuid(),
  name: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

const getVersionById = z.object({
  versionId: z.string().uuid(),
});

const listVersions = z.object({
  datasetId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

const getVersionRecords = z.object({
  versionId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createDatasetsDataLayer = (db: Kysely<Database>) => {
  return {
    // ============ Dataset CRUD ============
    createDataset: async (params: z.infer<typeof createDataset>) => {
      const value = await createDataset.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, description } = value.data;

      return db
        .insertInto('datasets')
        .values({
          id: randomUUID(),
          name,
          description: description ?? null,
          recordCount: 0,
          latestVersionNumber: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    updateDataset: async (params: z.infer<typeof updateDataset>) => {
      const value = await updateDataset.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, name, description } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;

      return db
        .updateTable('datasets')
        .set(updateData)
        .where('id', '=', datasetId)
        .returningAll()
        .executeTakeFirst();
    },

    getDatasetById: async (params: z.infer<typeof getDatasetById>) => {
      const value = await getDatasetById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId } = value.data;

      return db
        .selectFrom('datasets')
        .selectAll()
        .where('id', '=', datasetId)
        .executeTakeFirst();
    },

    deleteDataset: async (params: z.infer<typeof deleteDataset>) => {
      const value = await deleteDataset.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId } = value.data;

      // Delete in order: version_records -> versions -> records -> dataset
      await db
        .deleteFrom('dataset_version_records')
        .where(
          'datasetVersionId',
          'in',
          db
            .selectFrom('dataset_versions')
            .select('id')
            .where('datasetId', '=', datasetId)
        )
        .execute();

      await db
        .deleteFrom('dataset_versions')
        .where('datasetId', '=', datasetId)
        .execute();

      await db
        .deleteFrom('dataset_records')
        .where('datasetId', '=', datasetId)
        .execute();

      return db
        .deleteFrom('datasets')
        .where('id', '=', datasetId)
        .returningAll()
        .executeTakeFirst();
    },

    listDatasets: async (params?: z.infer<typeof listDatasets>) => {
      const value = await listDatasets.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('datasets')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },

    countDatasets: async () => {
      const result = await db
        .selectFrom('datasets')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },

    // ============ Record CRUD ============
    createRecord: async (params: z.infer<typeof createRecord>) => {
      const value = await createRecord.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, input, expected, metadata } = value.data;

      const record = await db
        .insertInto('dataset_records')
        .values({
          id: randomUUID(),
          datasetId,
          input: JSON.stringify(input),
          expected: expected ? JSON.stringify(expected) : null,
          metadata: JSON.stringify(metadata || {}),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();

      // Update dataset record count
      await db
        .updateTable('datasets')
        .set((eb) => ({
          recordCount: eb('recordCount', '+', 1),
          updatedAt: new Date().toISOString(),
        }))
        .where('id', '=', datasetId)
        .execute();

      return record;
    },

    updateRecord: async (params: z.infer<typeof updateRecord>) => {
      const value = await updateRecord.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { recordId, input, expected, metadata } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (input !== undefined) updateData.input = JSON.stringify(input);
      if (expected !== undefined)
        updateData.expected = expected ? JSON.stringify(expected) : null;
      if (metadata !== undefined)
        updateData.metadata = JSON.stringify(metadata);

      return db
        .updateTable('dataset_records')
        .set(updateData)
        .where('id', '=', recordId)
        .returningAll()
        .executeTakeFirst();
    },

    deleteRecord: async (params: z.infer<typeof deleteRecord>) => {
      const value = await deleteRecord.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { recordId } = value.data;

      // Get the record first to find datasetId
      const record = await db
        .selectFrom('dataset_records')
        .select(['datasetId'])
        .where('id', '=', recordId)
        .executeTakeFirst();

      if (!record) {
        throw new LLMOpsError('Record not found');
      }

      // Delete version record associations first
      await db
        .deleteFrom('dataset_version_records')
        .where('datasetRecordId', '=', recordId)
        .execute();

      const deleted = await db
        .deleteFrom('dataset_records')
        .where('id', '=', recordId)
        .returningAll()
        .executeTakeFirst();

      // Update dataset record count
      await db
        .updateTable('datasets')
        .set((eb) => ({
          recordCount: eb('recordCount', '-', 1),
          updatedAt: new Date().toISOString(),
        }))
        .where('id', '=', record.datasetId)
        .execute();

      return deleted;
    },

    listRecords: async (params: z.infer<typeof listRecords>) => {
      const value = await listRecords.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('dataset_records')
        .selectAll()
        .where('datasetId', '=', datasetId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },

    getRecordById: async (recordId: string) => {
      return db
        .selectFrom('dataset_records')
        .selectAll()
        .where('id', '=', recordId)
        .executeTakeFirst();
    },

    // ============ Version CRUD ============
    createVersion: async (params: z.infer<typeof createVersion>) => {
      const value = await createVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, name, description } = value.data;

      // Get current dataset to get next version number
      const dataset = await db
        .selectFrom('datasets')
        .select(['latestVersionNumber', 'recordCount'])
        .where('id', '=', datasetId)
        .executeTakeFirst();

      if (!dataset) {
        throw new LLMOpsError('Dataset not found');
      }

      const newVersionNumber = dataset.latestVersionNumber + 1;

      // Get all current record IDs for the snapshot hash
      const records = await db
        .selectFrom('dataset_records')
        .select(['id'])
        .where('datasetId', '=', datasetId)
        .orderBy('createdAt', 'asc')
        .execute();

      const recordIds = records.map((r) => r.id);
      const snapshotHash = createHash('sha256')
        .update(recordIds.join(','))
        .digest('hex');

      const versionId = randomUUID();

      // Create the version
      const version = await db
        .insertInto('dataset_versions')
        .values({
          id: versionId,
          datasetId,
          versionNumber: newVersionNumber,
          name: name ?? null,
          description: description ?? null,
          recordCount: dataset.recordCount,
          snapshotHash,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();

      // Create version-record associations
      if (recordIds.length > 0) {
        await db
          .insertInto('dataset_version_records')
          .values(
            recordIds.map((recordId, index) => ({
              id: randomUUID(),
              datasetVersionId: versionId,
              datasetRecordId: recordId,
              position: index,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }))
          )
          .execute();
      }

      // Update dataset's latest version number
      await db
        .updateTable('datasets')
        .set({
          latestVersionNumber: newVersionNumber,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', datasetId)
        .execute();

      return version;
    },

    getVersionById: async (params: z.infer<typeof getVersionById>) => {
      const value = await getVersionById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { versionId } = value.data;

      return db
        .selectFrom('dataset_versions')
        .selectAll()
        .where('id', '=', versionId)
        .executeTakeFirst();
    },

    listVersions: async (params: z.infer<typeof listVersions>) => {
      const value = await listVersions.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('dataset_versions')
        .selectAll()
        .where('datasetId', '=', datasetId)
        .orderBy('versionNumber', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },

    getVersionRecords: async (params: z.infer<typeof getVersionRecords>) => {
      const value = await getVersionRecords.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { versionId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('dataset_version_records')
        .innerJoin(
          'dataset_records',
          'dataset_records.id',
          'dataset_version_records.datasetRecordId'
        )
        .selectAll('dataset_records')
        .select('dataset_version_records.position')
        .where('dataset_version_records.datasetVersionId', '=', versionId)
        .orderBy('dataset_version_records.position', 'asc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
  };
};
