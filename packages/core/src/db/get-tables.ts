import type { LLMOpsConfig } from '@/types';
import type { LLMOpsDBSchema, DBFieldAttribute } from './type';
import { tableSchemas, tableMetadata } from './schema';
import { zodSchemasToDBSchema } from './schema/zod-to-db-schema';

export interface DBLLMOpsOptions {
  database?: {
    customFields?: Record<string, Record<string, DBFieldAttribute>>;
    tablePrefix?: string;
  };
  plugins?: Array<{
    id: string;
    schema?: LLMOpsDBSchema;
  }>;
}

/**
 * Get the default schema by converting Zod schemas to LLMOpsDBSchema
 * This ensures Zod schemas are the single source of truth
 */
const getDefaultSchema = (): LLMOpsDBSchema => {
  return zodSchemasToDBSchema(tableSchemas, tableMetadata);
};

export const getTables = (
  config: LLMOpsConfig,
  options: DBLLMOpsOptions = {}
): LLMOpsDBSchema => {
  const defaultSchema = getDefaultSchema();

  // Apply custom fields if provided
  if (options.database?.customFields) {
    Object.entries(options.database.customFields).forEach(
      ([tableName, customFields]) => {
        if (defaultSchema[tableName]) {
          defaultSchema[tableName].fields = {
            ...defaultSchema[tableName].fields,
            ...customFields,
          };
        }
      }
    );
  }

  // Apply plugin schemas
  const pluginSchema = (options.plugins ?? []).reduce((acc, plugin) => {
    if (plugin.schema) {
      return { ...acc, ...plugin.schema };
    }
    return acc;
  }, {} as LLMOpsDBSchema);

  return {
    ...defaultSchema,
    ...pluginSchema,
  };
};
