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
  weight: z.number().int().min(0).max(10000).default(10000), // 0-10000 for precision (10000 = 100%)
  priority: z.number().int().default(0), // Higher priority rules evaluated first
  enabled: z.boolean().default(true), // Toggle without deleting
  conditions: z.record(z.string(), z.unknown()).default({}), // JSONLogic conditions for advanced targeting
});

/**
 * Role enum for RBAC - extensible for future Pro features
 * - admin: Full access to all features
 * - member: Standard user access (for future team features)
 * - viewer: Read-only access (for future team features)
 */
export const UserRole = z.enum(['admin', 'member', 'viewer']);
export type UserRoleType = z.infer<typeof UserRole>;

// Users table schema - extensible for teams and RBAC
export const usersSchema = z.object({
  ...baseSchema,
  email: z.string().email(),
  passwordHash: z.string(),
  name: z.string().optional(),
  role: UserRole.default('admin'),
  // Future Pro fields (nullable for now):
  teamId: z.string().uuid().optional(), // FK -> teams.id (future)
  lastLoginAt: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Sessions table schema
export const sessionsSchema = z.object({
  ...baseSchema,
  userId: z.string().uuid(), // FK -> users.id
  token: z.string(), // Session token (hashed)
  expiresAt: z.date(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

/**
 * Zod inferred types (for runtime validation)
 */
export type Config = z.infer<typeof configsSchema>;
export type Variant = z.infer<typeof variantsSchema>;
export type Environment = z.infer<typeof environmentsSchema>;
export type EnvironmentSecret = z.infer<typeof environmentSecretsSchema>;
export type ConfigVariant = z.infer<typeof configVariantsSchema>;
export type TargetingRule = z.infer<typeof targetingRulesSchema>;
export type User = z.infer<typeof usersSchema>;
export type Session = z.infer<typeof sessionsSchema>;

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
  weight: ColumnType<number, number | undefined, number | undefined>;
  priority: ColumnType<number, number | undefined, number | undefined>;
  enabled: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  conditions: ColumnType<Record<string, unknown>, string, string>;
}

// Users table - extensible for teams and RBAC
export interface UsersTable extends BaseTable {
  email: string;
  passwordHash: string;
  name?: string;
  role: ColumnType<
    UserRoleType,
    UserRoleType | undefined,
    UserRoleType | undefined
  >;
  teamId?: string; // Future Pro field
  lastLoginAt: ColumnType<Date | null, string | undefined, string | undefined>;
  isActive: ColumnType<boolean, boolean | undefined, boolean | undefined>;
}

// Sessions table
export interface SessionsTable extends BaseTable {
  userId: string;
  token: string;
  expiresAt: ColumnType<Date, string, string>;
  userAgent?: string;
  ipAddress?: string;
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
  targeting_rules: TargetingRulesTable;
  users: UsersTable;
  sessions: SessionsTable;
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
        isProd: { type: 'boolean', default: false },
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
    targeting_rules: {
      order: 6,
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
        weight: { type: 'integer', default: 10000 },
        priority: { type: 'integer', default: 0 },
        enabled: { type: 'boolean', default: true },
        conditions: { type: 'jsonb', default: '{}' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    users: {
      order: 7,
      schema: usersSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        email: { type: 'text', unique: true },
        passwordHash: { type: 'text' },
        name: { type: 'text', nullable: true },
        role: { type: 'text', default: 'admin' },
        teamId: {
          type: 'uuid',
          nullable: true,
          // Future Pro feature - will reference teams.id when teams table is added
        },
        lastLoginAt: { type: 'timestamp', nullable: true },
        isActive: { type: 'boolean', default: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    sessions: {
      order: 8,
      schema: sessionsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        userId: {
          type: 'uuid',
          references: { table: 'users', column: 'id' },
        },
        token: { type: 'text', unique: true },
        expiresAt: { type: 'timestamp' },
        userAgent: { type: 'text', nullable: true },
        ipAddress: { type: 'text', nullable: true },
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
  targeting_rules: targetingRulesSchema,
  users: usersSchema,
  sessions: sessionsSchema,
} as const;
