import type { ColumnType, Generated } from 'kysely';

/**
 * Kysely Database Schema
 * Fixed table definitions with full type safety
 */

// Base table interface with common fields
interface BaseTable {
  id: Generated<string>;
  createdAt: ColumnType<Date, string | undefined, string | undefined>;
  updatedAt: ColumnType<Date, string | undefined, string | undefined>;
}

// Configs table
export interface ConfigsTable extends BaseTable {}

// Variants table - stores LLM model variants
export interface VariantsTable extends BaseTable {
  provider: string;
  modelName: string;
  jsonData: ColumnType<Record<string, unknown>, string, string>;
}

// Environments table
export interface EnvironmentsTable extends BaseTable {
  name: string;
  slug: string; // unique
}

// Environment secrets table
export interface EnvironmentSecretsTable extends BaseTable {
  environmentId: string; // FK -> environments.id
  keyName: string;
  keyValue: string;
}

// Config variants junction table
export interface ConfigVariantsTable extends BaseTable {
  configId: string; // FK -> configs.id
  variantId: string; // FK -> variants.id
}

// Environment config variants junction table
export interface EnvironmentConfigVariantsTable extends BaseTable {
  environmentId: string; // FK -> environments.id
  configVariantId: string; // FK -> config_variants.id
}

/**
 * Main Kysely Database interface
 * Maps table names to their type definitions
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
 * Utility types for type-safe inserts and selects
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
 */
export const SCHEMA_METADATA = {
  tables: {
    configs: {
      order: 1,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    variants: {
      order: 2,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        provider: { type: 'text' },
        modelName: { type: 'text' },
        jsonData: { type: 'jsonb' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    environments: {
      order: 3,
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
