import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const updateWorkspaceSettings = z.object({
  name: z.string().nullable().optional(),
  setupComplete: z.boolean().optional(),
  superAdminId: z.string().nullable().optional(),
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
            setupComplete: false,
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
            setupComplete: value.data.setupComplete ?? false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .returningAll()
          .executeTakeFirst();
      }

      // Update existing settings
      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (value.data.name !== undefined) {
        updateData.name = value.data.name ?? null;
      }
      if (value.data.setupComplete !== undefined) {
        updateData.setupComplete = value.data.setupComplete;
      }
      if (value.data.superAdminId !== undefined) {
        updateData.superAdminId = value.data.superAdminId ?? null;
      }

      return db
        .updateTable('workspace_settings')
        .set(updateData)
        .where('id', '=', settings.id)
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Get the super admin user ID
     */
    getSuperAdminId: async (): Promise<string | null> => {
      const settings = await db
        .selectFrom('workspace_settings')
        .select('superAdminId')
        .executeTakeFirst();

      return settings?.superAdminId ?? null;
    },

    /**
     * Set the super admin user ID (only if not already set)
     */
    setSuperAdminId: async (userId: string): Promise<boolean> => {
      let settings = await db
        .selectFrom('workspace_settings')
        .selectAll()
        .executeTakeFirst();

      // If superAdminId is already set, don't allow changes
      if (settings?.superAdminId) {
        return false;
      }

      if (!settings) {
        await db
          .insertInto('workspace_settings')
          .values({
            id: randomUUID(),
            name: null,
            setupComplete: false,
            superAdminId: userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .execute();
        return true;
      }

      await db
        .updateTable('workspace_settings')
        .set({
          superAdminId: userId,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', settings.id)
        .execute();

      return true;
    },

    /**
     * Check if initial setup has been completed
     */
    isSetupComplete: async (): Promise<boolean> => {
      const settings = await db
        .selectFrom('workspace_settings')
        .select('setupComplete')
        .executeTakeFirst();

      return settings?.setupComplete ?? false;
    },

    /**
     * Mark initial setup as complete
     */
    markSetupComplete: async () => {
      let settings = await db
        .selectFrom('workspace_settings')
        .selectAll()
        .executeTakeFirst();

      if (!settings) {
        // Create with setupComplete = true
        return db
          .insertInto('workspace_settings')
          .values({
            id: randomUUID(),
            name: null,
            setupComplete: true,
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
          setupComplete: true,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', settings.id)
        .returningAll()
        .executeTakeFirst();
    },
  };
};
