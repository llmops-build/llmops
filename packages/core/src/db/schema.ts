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
  slug: z.string(), // Short unique ID for LLM calls (x-llmops-config header)
  name: z.string().optional(),
});

// Variants table schema - stores LLM model variant metadata only
export const variantsSchema = z.object({
  ...baseSchema,
  name: z.string(),
});

// Variant versions table schema - stores actual variant data with versioning
export const variantVersionsSchema = z.object({
  ...baseSchema,
  variantId: z.string().uuid(), // FK -> variants.id
  version: z.number().int().min(1), // Version number, auto-incremented per variant
  provider: z.string(),
  modelName: z.string(),
  jsonData: z.record(z.string(), z.unknown()),
});

// Environments table schema
export const environmentsSchema = z.object({
  ...baseSchema,
  name: z.string(),
  slug: z.string(), // unique
  isProd: z.boolean().default(false), // System-managed environments cannot be deleted/updated
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

// Targeting rules table schema
export const targetingRulesSchema = z.object({
  ...baseSchema,
  environmentId: z.string().uuid(), // FK -> environments.id
  configId: z.string().uuid(), // FK -> configs.id (for easier querying)
  configVariantId: z.string().uuid(), // FK -> config_variants.id
  variantVersionId: z.string().uuid().nullable().optional(), // FK -> variant_versions.id (null = use latest)
  weight: z.number().int().min(0).max(10000).default(10000), // 0-10000 for precision (10000 = 100%)
  priority: z.number().int().default(0), // Higher priority rules evaluated first
  enabled: z.boolean().default(true), // Toggle without deleting
  conditions: z.record(z.string(), z.unknown()).default({}), // JSONLogic conditions for advanced targeting
});

/**
 * Zod inferred types (for runtime validation)
 */
export type Config = z.infer<typeof configsSchema>;
export type Variant = z.infer<typeof variantsSchema>;
export type VariantVersion = z.infer<typeof variantVersionsSchema>;
export type Environment = z.infer<typeof environmentsSchema>;
export type EnvironmentSecret = z.infer<typeof environmentSecretsSchema>;
export type ConfigVariant = z.infer<typeof configVariantsSchema>;
export type TargetingRule = z.infer<typeof targetingRulesSchema>;

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
  slug: string; // Short unique ID for LLM calls (x-llmops-config header)
  name?: string;
}

// Variants table - metadata only
export interface VariantsTable extends BaseTable {
  name: string;
}

// Variant versions table - actual model configuration
export interface VariantVersionsTable extends BaseTable {
  variantId: string;
  version: number;
  provider: string;
  modelName: string;
  jsonData: ColumnType<Record<string, unknown>, string, string>;
}

// Environments table
export interface EnvironmentsTable extends BaseTable {
  name: string;
  slug: string;
  isProd: ColumnType<boolean, boolean | undefined, boolean | undefined>;
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

// Targeting rules table
export interface TargetingRulesTable extends BaseTable {
  environmentId: string;
  configId: string;
  configVariantId: string;
  variantVersionId: string | null; // null means use latest version
  weight: ColumnType<number, number | undefined, number | undefined>;
  priority: ColumnType<number, number | undefined, number | undefined>;
  enabled: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  conditions: ColumnType<Record<string, unknown>, string, string>;
}

/**
 * Main Kysely Database interface
 */
export interface Database {
  configs: ConfigsTable;
  variants: VariantsTable;
  variant_versions: VariantVersionsTable;
  environments: EnvironmentsTable;
  environment_secrets: EnvironmentSecretsTable;
  config_variants: ConfigVariantsTable;
  targeting_rules: TargetingRulesTable;
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
        slug: { type: 'text', unique: true }, // Short unique ID for LLM calls
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
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    variant_versions: {
      order: 3,
      schema: variantVersionsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        variantId: {
          type: 'uuid',
          references: { table: 'variants', column: 'id' },
        },
        version: { type: 'integer' },
        provider: { type: 'text' },
        modelName: { type: 'text' },
        jsonData: { type: 'jsonb' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
      uniqueConstraints: [{ columns: ['variantId', 'version'] }],
    },
    environments: {
      order: 4,
      schema: environmentsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        slug: { type: 'text', unique: true },
        isProd: { type: 'boolean', default: false },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    environment_secrets: {
      order: 5,
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
      order: 6,
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
    targeting_rules: {
      order: 7,
      schema: targetingRulesSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        environmentId: {
          type: 'uuid',
          references: { table: 'environments', column: 'id' },
        },
        configId: {
          type: 'uuid',
          references: { table: 'configs', column: 'id' },
        },
        configVariantId: {
          type: 'uuid',
          references: { table: 'config_variants', column: 'id' },
        },
        variantVersionId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'variant_versions', column: 'id' },
        },
        weight: { type: 'integer', default: 10000 },
        priority: { type: 'integer', default: 0 },
        enabled: { type: 'boolean', default: true },
        conditions: { type: 'jsonb', default: '{}' },
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
  variant_versions: variantVersionsSchema,
  environments: environmentsSchema,
  environment_secrets: environmentSecretsSchema,
  config_variants: configVariantsSchema,
  targeting_rules: targetingRulesSchema,
} as const;
