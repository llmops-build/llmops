import { z } from 'zod';
import type { ColumnType, Generated } from 'kysely';
import type { TableMetadata } from './zod-to-db-schema';
import { fieldMeta } from './zod-to-db-schema';

/**
 * Zod schemas for database tables
 * These serve as the single source of truth for table structure
 */

// Base fields that all tables share
const baseFields = {
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

// Configs table schema
export const configsSchema = z.object({
  ...baseFields,
});

// Variants table schema
export const variantsSchema = z.object({
  ...baseFields,
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()),
});

// Environments table schema
export const environmentsSchema = z.object({
  ...baseFields,
  name: z.string(),
  slug: z.string(),
});

// Environment secrets table schema
export const environmentSecretsSchema = z.object({
  ...baseFields,
  environmentId: z.string().uuid(),
  keyName: z.string(),
  keyValue: z.string(),
});

// Config variants table schema
export const configVariantsSchema = z.object({
  ...baseFields,
  configId: z.string().uuid(),
  variantId: z.string().uuid(),
});

// Environment config variants table schema
export const environmentConfigVariantsSchema = z.object({
  ...baseFields,
  environmentId: z.string().uuid(),
  configVariantId: z.string().uuid(),
});

/**
 * Map of all table schemas
 */
export const tableSchemas = {
  configs: configsSchema,
  variants: variantsSchema,
  environments: environmentsSchema,
  environment_secrets: environmentSecretsSchema,
  config_variants: configVariantsSchema,
  environment_config_variants: environmentConfigVariantsSchema,
} as const;

/**
 * Metadata for each table including field-level configurations
 */
export const tableMetadata: Record<string, TableMetadata> = {
  configs: {
    modelName: 'configs',
    order: 1,
    fields: {
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
  variants: {
    modelName: 'variants',
    order: 2,
    fields: {
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
  environments: {
    modelName: 'environments',
    order: 3,
    fields: {
      slug: fieldMeta.unique(),
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
  environment_secrets: {
    modelName: 'environment_secrets',
    order: 4,
    fields: {
      environmentId: fieldMeta.reference('environments'),
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
  config_variants: {
    modelName: 'config_variants',
    order: 5,
    fields: {
      configId: fieldMeta.reference('configs'),
      variantId: fieldMeta.reference('variants'),
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
  environment_config_variants: {
    modelName: 'environment_config_variants',
    order: 6,
    fields: {
      environmentId: fieldMeta.reference('environments'),
      configVariantId: fieldMeta.reference('config_variants'),
      createdAt: fieldMeta.timestamp('createdAt'),
      updatedAt: fieldMeta.timestamp('updatedAt'),
    },
  },
};

/**
 * Type-safe table names
 */
export type TableName = keyof typeof tableSchemas;

/**
 * Kysely-compatible table interfaces with proper column types
 */
export interface ConfigsTable {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

export interface VariantsTable {
  id: Generated<string>;
  provider: string;
  modelName: string;
  jsonData: ColumnType<Record<string, unknown>, string, string>;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

export interface EnvironmentsTable {
  id: Generated<string>;
  name: string;
  slug: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

export interface EnvironmentSecretsTable {
  id: Generated<string>;
  environmentId: string;
  keyName: string;
  keyValue: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

export interface ConfigVariantsTable {
  id: Generated<string>;
  configId: string;
  variantId: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

export interface EnvironmentConfigVariantsTable {
  id: Generated<string>;
  environmentId: string;
  configVariantId: string;
  createdAt: ColumnType<Date, string | undefined, never>;
  updatedAt: ColumnType<Date, string | undefined, never>;
}

/**
 * Kysely Database interface
 * Maps table names to their Kysely-compatible table interfaces
 */
export interface Database {
  configs: ConfigsTable;
  variants: VariantsTable;
  environments: EnvironmentsTable;
  environment_secrets: EnvironmentSecretsTable;
  config_variants: ConfigVariantsTable;
  environment_config_variants: EnvironmentConfigVariantsTable;
}

/**
 * Inferred TypeScript types from Zod schemas (for runtime validation)
 */
export type Configs = z.infer<typeof configsSchema>;
export type Variants = z.infer<typeof variantsSchema>;
export type Environments = z.infer<typeof environmentsSchema>;
export type EnvironmentSecrets = z.infer<typeof environmentSecretsSchema>;
export type ConfigVariants = z.infer<typeof configVariantsSchema>;
export type EnvironmentConfigVariants = z.infer<
  typeof environmentConfigVariantsSchema
>;

/**
 * Generic table type helper
 */
export type TableRecord<T extends TableName> = z.infer<
  (typeof tableSchemas)[T]
>;
