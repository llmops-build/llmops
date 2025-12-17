import { z } from 'zod';
import type { ColumnType, Generated } from 'kysely';

/**
 * Zod Database Schema - Single Source of Truth
 * All Kysely types and migration metadata are derived from these schemas
 */

// Base schema with common fields
const baseSchema = {
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

// Configs table schema
export const configsSchema = z.object({
  ...baseSchema,
  name: z.string().optional(),
});

// Variants table schema - stores LLM model variants
export const variantsSchema = z.object({
  ...baseSchema,
  name: z.string(),
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()),
});

// Environments table schema
export const environmentsSchema = z.object({
  ...baseSchema,
  name: z.string(),
  slug: z.string(), // unique
});

// Environment secrets table schema
export const environmentSecretsSchema = z.object({
  ...baseSchema,
  environmentId: z.string().uuid(), // FK -> environments.id
  keyName: z.string(),
  keyValue: z.string(),
});

// Config variants junction table schema
export const configVariantsSchema = z.object({
  ...baseSchema,
  configId: z.string().uuid(), // FK -> configs.id
  variantId: z.string().uuid(), // FK -> variants.id
});

// Environment config variants junction table schema
export const environmentConfigVariantsSchema = z.object({
  ...baseSchema,
  environmentId: z.string().uuid(), // FK -> environments.id
  configVariantId: z.string().uuid(), // FK -> config_variants.id
});

/**
 * Zod inferred types (for runtime validation)
 */
export type Config = z.infer<typeof configsSchema>;
export type Variant = z.infer<typeof variantsSchema>;
export type Environment = z.infer<typeof environmentsSchema>;
export type EnvironmentSecret = z.infer<typeof environmentSecretsSchema>;
export type ConfigVariant = z.infer<typeof configVariantsSchema>;
export type EnvironmentConfigVariant = z.infer<
  typeof environmentConfigVariantsSchema
>;

/**
 * Kysely Table Interfaces
 * Derived from Zod schemas with proper column types
 */

// Base table interface with common fields
interface BaseTable {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, string | undefined>;
  updatedAt: ColumnType<Date, string | undefined, string | undefined>;
}

// Configs table
export interface ConfigsTable extends BaseTable {
  name?: string;
}

// Variants table
export interface VariantsTable extends BaseTable {
  name: string;
  provider: string;
  modelName: string;
  jsonData: ColumnType<Record<string, unknown>, string, string>;
}

// Environments table
export interface EnvironmentsTable extends BaseTable {
  name: string;
  slug: string;
}

// Environment secrets table
export interface EnvironmentSecretsTable extends BaseTable {
  environmentId: string;
  keyName: string;
  keyValue: string;
}

// Config variants junction table
export interface ConfigVariantsTable extends BaseTable {
  configId: string;
  variantId: string;
}

// Environment config variants junction table
export interface EnvironmentConfigVariantsTable extends BaseTable {
  environmentId: string;
  configVariantId: string;
}

/**
 * Main Kysely Database interface
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
 * Table names as a union type
 */
export type TableName = keyof Database;

/**
 * Utility types for type-safe operations
 */
export type Insertable<T extends TableName> = {
  [K in keyof Database[T]]: Database[T][K] extends ColumnType<
    infer _SelectType,
    infer InsertType,
    infer _UpdateType
  >
    ? InsertType
    : Database[T][K] extends Generated<infer _GeneratedType>
      ? never
      : Database[T][K];
};

export type Selectable<T extends TableName> = {
  [K in keyof Database[T]]: Database[T][K] extends ColumnType<
    infer SelectType,
    infer _InsertType,
    infer _UpdateType
  >
    ? SelectType
    : Database[T][K] extends Generated<infer GeneratedType>
      ? GeneratedType
      : Database[T][K];
};

export type Updateable<T extends TableName> = {
  [K in keyof Database[T]]?: Database[T][K] extends ColumnType<
    infer _SelectType,
    infer _InsertType,
    infer UpdateType
  >
    ? UpdateType
    : Database[T][K] extends Generated<infer _GeneratedType>
      ? never
      : Database[T][K];
};

/**
 * Schema metadata for migrations
 * Derived from Zod schemas
 */
export const SCHEMA_METADATA = {
  tables: {
    configs: {
      order: 1,
      schema: configsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    variants: {
      order: 2,
      schema: variantsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        provider: { type: 'text' },
        modelName: { type: 'text' },
        jsonData: { type: 'jsonb' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    environments: {
      order: 3,
      schema: environmentsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        slug: { type: 'text', unique: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    environment_secrets: {
      order: 4,
      schema: environmentSecretsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        environmentId: {
          type: 'uuid',
          references: { table: 'environments', column: 'id' },
        },
        keyName: { type: 'text' },
        keyValue: { type: 'text' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    config_variants: {
      order: 5,
      schema: configVariantsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        configId: {
          type: 'uuid',
          references: { table: 'configs', column: 'id' },
        },
        variantId: {
          type: 'uuid',
          references: { table: 'variants', column: 'id' },
        },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    environment_config_variants: {
      order: 6,
      schema: environmentConfigVariantsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        environmentId: {
          type: 'uuid',
          references: { table: 'environments', column: 'id' },
        },
        configVariantId: {
          type: 'uuid',
          references: { table: 'config_variants', column: 'id' },
        },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
  },
} as const;

/**
 * Export all Zod schemas for runtime validation
 */
export const schemas = {
  configs: configsSchema,
  variants: variantsSchema,
  environments: environmentsSchema,
  environment_secrets: environmentSecretsSchema,
  config_variants: configVariantsSchema,
  environment_config_variants: environmentConfigVariantsSchema,
} as const;
