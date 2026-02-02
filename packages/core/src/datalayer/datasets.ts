import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type {
  Dataset,
  DatasetRecord,
  DatasetVersion,
  DatasetVersionRecord,
} from '@/schemas';
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

export const createDatasetsDataLayer = (adapter: Adapter) => {
  return {
    // ============ Dataset CRUD ============
    createDataset: async (params: z.infer<typeof createDataset>) => {
      const value = await createDataset.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { name, description } = value.data;

      return adapter.create<Dataset>('datasets', {
        id: randomUUID(),
        name,
        description: description ?? null,
        recordCount: 0,
        latestVersionNumber: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
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

      return adapter.update<Dataset>(
        'datasets',
        [{ field: 'id', value: datasetId }],
        updateData
      );
    },

    getDatasetById: async (params: z.infer<typeof getDatasetById>) => {
      const value = await getDatasetById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId } = value.data;

      return adapter.findOne<Dataset>('datasets', [
        { field: 'id', value: datasetId },
      ]);
    },

    deleteDataset: async (params: z.infer<typeof deleteDataset>) => {
      const value = await deleteDataset.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId } = value.data;

      // Get all versions for this dataset first
      const versions = await adapter.findMany<DatasetVersion>(
        'dataset_versions',
        {
          where: [{ field: 'datasetId', value: datasetId }],
        }
      );

      // Delete version records for each version
      for (const version of versions) {
        await adapter.deleteMany('dataset_version_records', [
          { field: 'datasetVersionId', value: version.id },
        ]);
      }

      // Delete all versions
      await adapter.deleteMany('dataset_versions', [
        { field: 'datasetId', value: datasetId },
      ]);

      // Delete all records
      await adapter.deleteMany('dataset_records', [
        { field: 'datasetId', value: datasetId },
      ]);

      // Delete the dataset
      return adapter.delete<Dataset>('datasets', [
        { field: 'id', value: datasetId },
      ]);
    },

    listDatasets: async (params?: z.infer<typeof listDatasets>) => {
      const value = await listDatasets.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return adapter.findMany<Dataset>('datasets', {
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    countDatasets: async () => {
      return adapter.count('datasets');
    },

    // ============ Record CRUD ============
    createRecord: async (params: z.infer<typeof createRecord>) => {
      const value = await createRecord.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, input, expected, metadata } = value.data;

      const record = await adapter.create<DatasetRecord>('dataset_records', {
        id: randomUUID(),
        datasetId,
        input: JSON.stringify(input),
        expected: expected ? JSON.stringify(expected) : null,
        metadata: JSON.stringify(metadata || {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update dataset record count
      const dataset = await adapter.findOne<Dataset>('datasets', [
        { field: 'id', value: datasetId },
      ]);
      if (dataset) {
        await adapter.update<Dataset>(
          'datasets',
          [{ field: 'id', value: datasetId }],
          {
            recordCount: dataset.recordCount + 1,
            updatedAt: new Date().toISOString(),
          }
        );
      }

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

      return adapter.update<DatasetRecord>(
        'dataset_records',
        [{ field: 'id', value: recordId }],
        updateData
      );
    },

    deleteRecord: async (params: z.infer<typeof deleteRecord>) => {
      const value = await deleteRecord.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { recordId } = value.data;

      // Get the record first to find datasetId
      const record = await adapter.findOne<DatasetRecord>('dataset_records', [
        { field: 'id', value: recordId },
      ]);

      if (!record) {
        throw new LLMOpsError('Record not found');
      }

      // Delete version record associations first
      await adapter.deleteMany('dataset_version_records', [
        { field: 'datasetRecordId', value: recordId },
      ]);

      const deleted = await adapter.delete<DatasetRecord>('dataset_records', [
        { field: 'id', value: recordId },
      ]);

      // Update dataset record count
      const dataset = await adapter.findOne<Dataset>('datasets', [
        { field: 'id', value: record.datasetId },
      ]);
      if (dataset) {
        await adapter.update<Dataset>(
          'datasets',
          [{ field: 'id', value: record.datasetId }],
          {
            recordCount: Math.max(0, dataset.recordCount - 1),
            updatedAt: new Date().toISOString(),
          }
        );
      }

      return deleted;
    },

    listRecords: async (params: z.infer<typeof listRecords>) => {
      const value = await listRecords.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<DatasetRecord>('dataset_records', {
        where: [{ field: 'datasetId', value: datasetId }],
        orderBy: [{ field: 'createdAt', direction: 'desc' }],
        limit,
        offset,
      });
    },

    getRecordById: async (recordId: string) => {
      return adapter.findOne<DatasetRecord>('dataset_records', [
        { field: 'id', value: recordId },
      ]);
    },

    // ============ Version CRUD ============
    createVersion: async (params: z.infer<typeof createVersion>) => {
      const value = await createVersion.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, name, description } = value.data;

      // Get current dataset to get next version number
      const dataset = await adapter.findOne<Dataset>('datasets', [
        { field: 'id', value: datasetId },
      ]);

      if (!dataset) {
        throw new LLMOpsError('Dataset not found');
      }

      const newVersionNumber = dataset.latestVersionNumber + 1;

      // Get all current record IDs for the snapshot hash
      const records = await adapter.findMany<DatasetRecord>('dataset_records', {
        where: [{ field: 'datasetId', value: datasetId }],
        orderBy: [{ field: 'createdAt', direction: 'asc' }],
      });

      const recordIds = records.map((r) => r.id);
      const snapshotHash = createHash('sha256')
        .update(recordIds.join(','))
        .digest('hex');

      const versionId = randomUUID();
      const now = new Date().toISOString();

      // Create the version
      const version = await adapter.create<DatasetVersion>('dataset_versions', {
        id: versionId,
        datasetId,
        versionNumber: newVersionNumber,
        name: name ?? null,
        description: description ?? null,
        recordCount: dataset.recordCount,
        snapshotHash,
        createdAt: now,
        updatedAt: now,
      });

      // Create version-record associations
      if (recordIds.length > 0) {
        const versionRecords = recordIds.map((recordId, index) => ({
          id: randomUUID(),
          datasetVersionId: versionId,
          datasetRecordId: recordId,
          position: index,
          createdAt: now,
          updatedAt: now,
        }));

        await adapter.createMany<DatasetVersionRecord>(
          'dataset_version_records',
          versionRecords
        );
      }

      // Update dataset's latest version number
      await adapter.update<Dataset>(
        'datasets',
        [{ field: 'id', value: datasetId }],
        {
          latestVersionNumber: newVersionNumber,
          updatedAt: now,
        }
      );

      return version;
    },

    getVersionById: async (params: z.infer<typeof getVersionById>) => {
      const value = await getVersionById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { versionId } = value.data;

      return adapter.findOne<DatasetVersion>('dataset_versions', [
        { field: 'id', value: versionId },
      ]);
    },

    listVersions: async (params: z.infer<typeof listVersions>) => {
      const value = await listVersions.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { datasetId, limit = 100, offset = 0 } = value.data;

      return adapter.findMany<DatasetVersion>('dataset_versions', {
        where: [{ field: 'datasetId', value: datasetId }],
        orderBy: [{ field: 'versionNumber', direction: 'desc' }],
        limit,
        offset,
      });
    },

    getVersionRecords: async (params: z.infer<typeof getVersionRecords>) => {
      const value = await getVersionRecords.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { versionId, limit = 100, offset = 0 } = value.data;

      // Get version-record associations ordered by position
      const versionRecords = await adapter.findMany<DatasetVersionRecord>(
        'dataset_version_records',
        {
          where: [{ field: 'datasetVersionId', value: versionId }],
          orderBy: [{ field: 'position', direction: 'asc' }],
          limit,
          offset,
        }
      );

      // Get the actual records
      const records = await Promise.all(
        versionRecords.map(async (vr) => {
          const record = await adapter.findOne<DatasetRecord>(
            'dataset_records',
            [{ field: 'id', value: vr.datasetRecordId }]
          );
          return record
            ? {
                ...record,
                position: vr.position,
              }
            : null;
        })
      );

      return records.filter((r): r is DatasetRecord & { position: number } =>
        r !== null
      );
    },
  };
};
