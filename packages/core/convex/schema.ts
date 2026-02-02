/**
 * Convex Schema Definition
 *
 * This schema mirrors the Zod schemas in packages/core/src/db/schema.ts
 * Users deploying to Convex should copy this to their Convex project.
 *
 * Table naming convention:
 * - Convex uses camelCase table names (no underscores)
 * - This matches the TABLE_NAME_MAP in the Convex adapter
 */

import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // Configs table - stores prompt configuration metadata
  configs: defineTable({
    id: v.string(), // UUID
    slug: v.string(), // Short unique ID for LLM calls
    name: v.optional(v.string()),
    createdAt: v.string(), // ISO timestamp
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_slug', ['slug']),

  // Variants table - stores LLM model variant metadata
  variants: defineTable({
    id: v.string(),
    name: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_id', ['id']),

  // Variant versions table - stores actual variant data with versioning
  variantVersions: defineTable({
    id: v.string(),
    variantId: v.string(), // FK -> variants.id
    version: v.number(), // Version number, auto-incremented per variant
    provider: v.string(),
    modelName: v.string(),
    jsonData: v.any(), // JSON config object
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_variantId', ['variantId'])
    .index('by_variantId_version', ['variantId', 'version']),

  // Environments table
  environments: defineTable({
    id: v.string(),
    name: v.string(),
    slug: v.string(), // unique
    isProd: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_slug', ['slug']),

  // Environment secrets table
  environmentSecrets: defineTable({
    id: v.string(),
    environmentId: v.string(), // FK -> environments.id
    keyName: v.string(),
    keyValue: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_environmentId', ['environmentId']),

  // Config variants junction table
  configVariants: defineTable({
    id: v.string(),
    configId: v.string(), // FK -> configs.id
    variantId: v.string(), // FK -> variants.id
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_configId', ['configId'])
    .index('by_variantId', ['variantId']),

  // Targeting rules table
  targetingRules: defineTable({
    id: v.string(),
    environmentId: v.string(), // FK -> environments.id
    configId: v.string(), // FK -> configs.id
    configVariantId: v.string(), // FK -> config_variants.id
    variantVersionId: v.optional(v.union(v.string(), v.null())), // FK -> variant_versions.id (null = use latest)
    weight: v.number(), // 0-10000 for precision
    priority: v.number(), // Higher priority rules evaluated first
    enabled: v.boolean(),
    conditions: v.any(), // JSONLogic conditions
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_environmentId', ['environmentId'])
    .index('by_configId', ['configId'])
    .index('by_configVariantId', ['configVariantId']),

  // Workspace settings table (single-tenant settings)
  workspaceSettings: defineTable({
    id: v.string(),
    name: v.optional(v.union(v.string(), v.null())),
    setupComplete: v.boolean(),
    superAdminId: v.optional(v.union(v.string(), v.null())),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_id', ['id']),

  // Provider configs table - stores provider configurations
  providerConfigs: defineTable({
    id: v.string(),
    providerId: v.string(), // e.g., "openai", "anthropic"
    slug: v.optional(v.union(v.string(), v.null())),
    name: v.optional(v.union(v.string(), v.null())),
    config: v.any(), // JSON config
    enabled: v.boolean(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_providerId', ['providerId'])
    .index('by_slug', ['slug']),

  // Playgrounds table - stores playground configurations
  playgrounds: defineTable({
    id: v.string(),
    name: v.string(),
    datasetId: v.optional(v.union(v.string(), v.null())), // FK to datasets
    columns: v.optional(v.union(v.array(v.any()), v.null())), // JSON column array
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_datasetId', ['datasetId']),

  // Playground runs table - execution run metadata
  playgroundRuns: defineTable({
    id: v.string(),
    playgroundId: v.string(),
    datasetId: v.optional(v.union(v.string(), v.null())),
    datasetVersionId: v.optional(v.union(v.string(), v.null())),
    status: v.string(), // 'pending', 'running', 'completed', 'failed', 'cancelled'
    startedAt: v.optional(v.union(v.string(), v.null())),
    completedAt: v.optional(v.union(v.string(), v.null())),
    totalRecords: v.number(),
    completedRecords: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_playgroundId', ['playgroundId'])
    .index('by_status', ['status']),

  // Playground results table - individual execution results
  playgroundResults: defineTable({
    id: v.string(),
    runId: v.string(),
    columnId: v.string(), // References playgroundColumn.id
    datasetRecordId: v.optional(v.union(v.string(), v.null())),
    inputVariables: v.any(), // JSON
    outputContent: v.optional(v.union(v.string(), v.null())),
    status: v.string(), // 'pending', 'running', 'completed', 'failed'
    error: v.optional(v.union(v.string(), v.null())),
    latencyMs: v.optional(v.union(v.number(), v.null())),
    promptTokens: v.optional(v.union(v.number(), v.null())),
    completionTokens: v.optional(v.union(v.number(), v.null())),
    totalTokens: v.optional(v.union(v.number(), v.null())),
    cost: v.optional(v.union(v.number(), v.null())), // In micro-dollars
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_runId', ['runId'])
    .index('by_columnId', ['columnId']),

  // Guardrail configs table - stores global guardrail configurations
  guardrailConfigs: defineTable({
    id: v.string(),
    name: v.string(),
    pluginId: v.string(), // "default" for built-in guardrails
    functionId: v.string(), // e.g., "regexMatch", "modelWhitelist"
    hookType: v.string(), // 'beforeRequestHook' | 'afterRequestHook'
    parameters: v.any(), // JSON
    enabled: v.boolean(),
    priority: v.number(), // Higher priority = runs first
    onFail: v.string(), // 'block' | 'log'
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_pluginId', ['pluginId'])
    .index('by_enabled', ['enabled']),

  // Provider guardrail overrides table - per-provider guardrail overrides
  providerGuardrailOverrides: defineTable({
    id: v.string(),
    providerConfigId: v.string(), // FK -> provider_configs.id
    guardrailConfigId: v.string(), // FK -> guardrail_configs.id
    enabled: v.boolean(),
    parameters: v.optional(v.union(v.any(), v.null())), // Override parameters
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_providerConfigId', ['providerConfigId'])
    .index('by_guardrailConfigId', ['guardrailConfigId']),

  // Datasets table - stores dataset metadata
  datasets: defineTable({
    id: v.string(),
    name: v.string(),
    description: v.optional(v.union(v.string(), v.null())),
    recordCount: v.number(),
    latestVersionNumber: v.number(),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index('by_id', ['id']),

  // Dataset versions table - track dataset snapshots
  datasetVersions: defineTable({
    id: v.string(),
    datasetId: v.string(), // FK -> datasets.id
    versionNumber: v.number(),
    name: v.optional(v.union(v.string(), v.null())),
    description: v.optional(v.union(v.string(), v.null())),
    recordCount: v.number(),
    snapshotHash: v.string(), // SHA-256 hash
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_datasetId', ['datasetId'])
    .index('by_datasetId_versionNumber', ['datasetId', 'versionNumber']),

  // Dataset records table - individual test case records
  datasetRecords: defineTable({
    id: v.string(),
    datasetId: v.string(), // FK -> datasets.id
    input: v.any(), // JSON - required input data
    expected: v.optional(v.union(v.any(), v.null())), // JSON - ground truth
    metadata: v.any(), // JSON - arbitrary key-value pairs
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_datasetId', ['datasetId']),

  // Dataset version records table - junction table
  datasetVersionRecords: defineTable({
    id: v.string(),
    datasetVersionId: v.string(), // FK -> dataset_versions.id
    datasetRecordId: v.string(), // FK -> dataset_records.id
    position: v.number(), // Position in version
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_datasetVersionId', ['datasetVersionId'])
    .index('by_datasetRecordId', ['datasetRecordId']),

  // LLM Requests table - request logs with cost tracking
  llmRequests: defineTable({
    id: v.string(),
    requestId: v.string(), // Unique request identifier

    // Foreign keys (nullable)
    configId: v.optional(v.union(v.string(), v.null())),
    variantId: v.optional(v.union(v.string(), v.null())),
    environmentId: v.optional(v.union(v.string(), v.null())),
    providerConfigId: v.optional(v.union(v.string(), v.null())),

    // Provider & Model
    provider: v.string(),
    model: v.string(),

    // Token Usage
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
    cachedTokens: v.number(),

    // Cost (micro-dollars)
    cost: v.number(),
    inputCost: v.number(),
    outputCost: v.number(),

    // Request Metadata
    endpoint: v.string(),
    statusCode: v.number(),
    latencyMs: v.number(),
    isStreaming: v.boolean(),

    // Optional identifiers
    userId: v.optional(v.union(v.string(), v.null())),
    tags: v.any(), // JSON

    // Guardrail telemetry
    guardrailResults: v.optional(v.union(v.any(), v.null())),

    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index('by_id', ['id'])
    .index('by_requestId', ['requestId'])
    .index('by_configId', ['configId'])
    .index('by_provider', ['provider'])
    .index('by_createdAt', ['createdAt']),
});
