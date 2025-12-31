import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const updateWorkspaceSettings = z.object({
  name: z.string().nullable().optional(),
});

export const createWorkspaceSettingsDataLayer = (db: Kysely<Database>) => {
  return {
    /**
     * Get workspace settings (creates default if not exists)
     */
    getWorkspaceSettings: async () => {
      let settings = await db
        .selectFrom('workspace_settings')
        .selectAll()
        .executeTakeFirst();

      // Create default settings if none exist
      if (!settings) {
        settings = await db
          .insertInto('workspace_settings')
          .values({
            id: randomUUID(),
            name: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirst();
      }

      return settings;
    },

    /**
     * Update workspace settings
     */
    updateWorkspaceSettings: async (
      params: z.infer<typeof updateWorkspaceSettings>
    ) => {
      const value = await updateWorkspaceSettings.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }

      // Ensure settings exist first
      let settings = await db
        .selectFrom('workspace_settings')
        .selectAll()
        .executeTakeFirst();

      if (!settings) {
        // Create with the provided values
        return db
          .insertInto('workspace_settings')
          .values({
            id: randomUUID(),
            name: value.data.name ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirst();
      }

      // Update existing settings
      return db
        .updateTable('workspace_settings')
        .set({
          name: value.data.name ?? null,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', settings.id)
        .returningAll()
        .executeTakeFirst();
    },
  };
};
