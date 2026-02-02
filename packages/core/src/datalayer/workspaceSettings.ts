import { LLMOpsError } from '@/error';
import type { Adapter } from '@/adapter/types';
import type { WorkspaceSettings } from '@/schemas';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const updateWorkspaceSettings = z.object({
  name: z.string().nullable().optional(),
  setupComplete: z.boolean().optional(),
  superAdminId: z.string().nullable().optional(),
});

export const createWorkspaceSettingsDataLayer = (adapter: Adapter) => {
  return {
    /**
     * Get workspace settings (creates default if not exists)
     */
    getWorkspaceSettings: async () => {
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      let settings = allSettings[0];

      // Create default settings if none exist
      if (!settings) {
        settings = await adapter.create<WorkspaceSettings>('workspace_settings', {
          id: randomUUID(),
          name: null,
          setupComplete: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
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
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      let settings = allSettings[0];

      if (!settings) {
        // Create with the provided values
        return adapter.create<WorkspaceSettings>('workspace_settings', {
          id: randomUUID(),
          name: value.data.name ?? null,
          setupComplete: value.data.setupComplete ?? false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
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

      return adapter.update<WorkspaceSettings>(
        'workspace_settings',
        [{ field: 'id', value: settings.id }],
        updateData
      );
    },

    /**
     * Get the super admin user ID
     */
    getSuperAdminId: async (): Promise<string | null> => {
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      const settings = allSettings[0];

      return settings?.superAdminId ?? null;
    },

    /**
     * Set the super admin user ID (only if not already set)
     */
    setSuperAdminId: async (userId: string): Promise<boolean> => {
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      let settings = allSettings[0];

      // If superAdminId is already set, don't allow changes
      if (settings?.superAdminId) {
        return false;
      }

      if (!settings) {
        await adapter.create<WorkspaceSettings>('workspace_settings', {
          id: randomUUID(),
          name: null,
          setupComplete: false,
          superAdminId: userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        return true;
      }

      await adapter.update<WorkspaceSettings>(
        'workspace_settings',
        [{ field: 'id', value: settings.id }],
        {
          superAdminId: userId,
          updatedAt: new Date().toISOString(),
        }
      );

      return true;
    },

    /**
     * Check if initial setup has been completed
     */
    isSetupComplete: async (): Promise<boolean> => {
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      const settings = allSettings[0];

      return settings?.setupComplete ?? false;
    },

    /**
     * Mark initial setup as complete
     */
    markSetupComplete: async () => {
      const allSettings = await adapter.findMany<WorkspaceSettings>(
        'workspace_settings',
        { limit: 1 }
      );
      let settings = allSettings[0];

      if (!settings) {
        // Create with setupComplete = true
        return adapter.create<WorkspaceSettings>('workspace_settings', {
          id: randomUUID(),
          name: null,
          setupComplete: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // Update existing settings
      return adapter.update<WorkspaceSettings>(
        'workspace_settings',
        [{ field: 'id', value: settings.id }],
        {
          setupComplete: true,
          updatedAt: new Date().toISOString(),
        }
      );
    },
  };
};
