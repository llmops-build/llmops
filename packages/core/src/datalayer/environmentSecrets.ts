import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createEnvironmentSecret = z.object({
  environmentId: z.uuidv4(),
  keyName: z.string(),
  keyValue: z.string(),
});

const updateEnvironmentSecret = z.object({
  secretId: z.uuidv4(),
  keyName: z.string().optional(),
  keyValue: z.string().optional(),
});

const getEnvironmentSecretById = z.object({
  secretId: z.uuidv4(),
});

const getSecretsByEnvironmentId = z.object({
  environmentId: z.uuidv4(),
});

const deleteEnvironmentSecret = z.object({
  secretId: z.uuidv4(),
});

const deleteSecretsByEnvironmentId = z.object({
  environmentId: z.uuidv4(),
});

const listEnvironmentSecrets = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createEnvironmentSecretDataLayer = (db: Kysely<Database>) => {
  return {
    createEnvironmentSecret: async (
      params: z.infer<typeof createEnvironmentSecret>
    ) => {
      const value = await createEnvironmentSecret.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId, keyName, keyValue } = value.data;

      return db
        .insertInto('environment_secrets')
        .values({
          id: randomUUID(),
          environmentId,
          keyName,
          keyValue,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },
    updateEnvironmentSecret: async (
      params: z.infer<typeof updateEnvironmentSecret>
    ) => {
      const value = await updateEnvironmentSecret.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { secretId, keyName, keyValue } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (keyName !== undefined) updateData.keyName = keyName;
      if (keyValue !== undefined) updateData.keyValue = keyValue;

      return db
        .updateTable('environment_secrets')
        .set(updateData)
        .where('id', '=', secretId)
        .returningAll()
        .executeTakeFirst();
    },
    getEnvironmentSecretById: async (
      params: z.infer<typeof getEnvironmentSecretById>
    ) => {
      const value = await getEnvironmentSecretById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { secretId } = value.data;

      return db
        .selectFrom('environment_secrets')
        .selectAll()
        .where('id', '=', secretId)
        .executeTakeFirst();
    },
    getSecretsByEnvironmentId: async (
      params: z.infer<typeof getSecretsByEnvironmentId>
    ) => {
      const value = await getSecretsByEnvironmentId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return db
        .selectFrom('environment_secrets')
        .selectAll()
        .where('environmentId', '=', environmentId)
        .orderBy('createdAt', 'desc')
        .execute();
    },
    deleteEnvironmentSecret: async (
      params: z.infer<typeof deleteEnvironmentSecret>
    ) => {
      const value = await deleteEnvironmentSecret.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { secretId } = value.data;

      return db
        .deleteFrom('environment_secrets')
        .where('id', '=', secretId)
        .returningAll()
        .executeTakeFirst();
    },
    deleteSecretsByEnvironmentId: async (
      params: z.infer<typeof deleteSecretsByEnvironmentId>
    ) => {
      const value = await deleteSecretsByEnvironmentId.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { environmentId } = value.data;

      return db
        .deleteFrom('environment_secrets')
        .where('environmentId', '=', environmentId)
        .returningAll()
        .execute();
    },
    listEnvironmentSecrets: async (
      params?: z.infer<typeof listEnvironmentSecrets>
    ) => {
      const value = await listEnvironmentSecrets.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('environment_secrets')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },
    countEnvironmentSecrets: async () => {
      const result = await db
        .selectFrom('environment_secrets')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },
  };
};
