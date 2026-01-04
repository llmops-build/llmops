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

// Workspace settings table schema (single-tenant settings)
export const workspaceSettingsSchema = z.object({
  ...baseSchema,
  name: z.string().nullable().optional(), // Workspace display name
  setupComplete: z.boolean().default(false), // Whether initial setup has been completed
});

// LLM Requests table schema - stores request logs with cost tracking
export const llmRequestsSchema = z.object({
  ...baseSchema,
  requestId: z.string().uuid(), // Unique request identifier for tracing

  // Foreign keys (nullable for direct gateway calls without config)
  configId: z.string().uuid().nullable().optional(), // FK -> configs.id
  variantId: z.string().uuid().nullable().optional(), // FK -> variants.id
  environmentId: z.string().uuid().nullable().optional(), // FK -> environments.id

  // Provider & Model
  provider: z.string(), // e.g., "openai", "anthropic", "openrouter"
  model: z.string(), // e.g., "gpt-4o", "claude-3-sonnet"

  // Token Usage
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0), // For cache-aware pricing

  // Cost (stored in micro-dollars for precision: $0.001 = 1000)
  cost: z.number().int().default(0), // Total cost in micro-dollars
  inputCost: z.number().int().default(0), // Input/prompt cost in micro-dollars
  outputCost: z.number().int().default(0), // Output/completion cost in micro-dollars

  // Request Metadata
  endpoint: z.string(), // "chat/completions", "completions", "embeddings", etc.
  statusCode: z.number().int(), // HTTP status code (200, 400, 500, etc.)
  latencyMs: z.number().int().default(0), // Request latency in milliseconds
  isStreaming: z.boolean().default(false), // Whether request used streaming

  // Optional identifiers (for future budget tracking)
  userId: z.string().nullable().optional(), // User identifier from request
  tags: z.record(z.string(), z.string()).default({}), // Custom tags/metadata
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
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
export type LLMRequest = z.infer<typeof llmRequestsSchema>;

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

// Workspace settings table (single-tenant settings)
export interface WorkspaceSettingsTable extends BaseTable {
  name: string | null;
  setupComplete: ColumnType<boolean, boolean | undefined, boolean | undefined>;
}

// LLM Requests table - request logs with cost tracking
export interface LLMRequestsTable extends BaseTable {
  requestId: string;
  configId: string | null;
  variantId: string | null;
  environmentId: string | null;
  provider: string;
  model: string;
  promptTokens: ColumnType<number, number | undefined, number | undefined>;
  completionTokens: ColumnType<number, number | undefined, number | undefined>;
  totalTokens: ColumnType<number, number | undefined, number | undefined>;
  cachedTokens: ColumnType<number, number | undefined, number | undefined>;
  cost: ColumnType<number, number | undefined, number | undefined>;
  inputCost: ColumnType<number, number | undefined, number | undefined>;
  outputCost: ColumnType<number, number | undefined, number | undefined>;
  endpoint: string;
  statusCode: number;
  latencyMs: ColumnType<number, number | undefined, number | undefined>;
  isStreaming: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  userId: string | null;
  tags: ColumnType<Record<string, string>, string, string>;
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
  workspace_settings: WorkspaceSettingsTable;
  llm_requests: LLMRequestsTable;
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
    workspace_settings: {
      order: 8,
      schema: workspaceSettingsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text', nullable: true },
        setupComplete: { type: 'boolean', default: false },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    llm_requests: {
      order: 9,
      schema: llmRequestsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        requestId: { type: 'uuid' },
        configId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'configs', column: 'id' },
        },
        variantId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'variants', column: 'id' },
        },
        environmentId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'environments', column: 'id' },
        },
        provider: { type: 'text' },
        model: { type: 'text' },
        promptTokens: { type: 'integer', default: 0 },
        completionTokens: { type: 'integer', default: 0 },
        totalTokens: { type: 'integer', default: 0 },
        cachedTokens: { type: 'integer', default: 0 },
        cost: { type: 'integer', default: 0 },
        inputCost: { type: 'integer', default: 0 },
        outputCost: { type: 'integer', default: 0 },
        endpoint: { type: 'text' },
        statusCode: { type: 'integer' },
        latencyMs: { type: 'integer', default: 0 },
        isStreaming: { type: 'boolean', default: false },
        userId: { type: 'text', nullable: true },
        tags: { type: 'jsonb', default: '{}' },
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
  workspace_settings: workspaceSettingsSchema,
  llm_requests: llmRequestsSchema,
} as const;
