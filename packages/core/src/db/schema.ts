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
  superAdminId: z.string().nullable().optional(), // The first user's ID - only this user can access the app
});

// Provider configs table schema - stores provider configurations set through the dashboard
export const providerConfigsSchema = z.object({
  ...baseSchema,
  providerId: z.string(), // e.g., "openai", "anthropic", "openrouter"
  slug: z.string().nullable().optional(), // URL-friendly identifier
  name: z.string().nullable().optional(), // Optional display name for the provider config
  config: z.record(z.string(), z.unknown()), // JSON config matching provider-configs.ts interfaces
  enabled: z.boolean().default(true), // Toggle without deleting
});

// Playground column schema (stored as JSON array in playgrounds.columns)
export const playgroundColumnSchema = z.object({
  id: z.string().uuid(), // Client-generated for React keys & result mapping
  name: z.string(),
  position: z.number().int().min(0),
  providerConfigId: z.union([z.string().uuid(), z.null()]), // FK to provider_configs - get slug for gateway calls (null when no model selected)
  modelName: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
    }),
  ),
  temperature: z.number().nullable().optional(),
  maxTokens: z.number().int().nullable().optional(),
  topP: z.number().nullable().optional(),
  frequencyPenalty: z.number().nullable().optional(),
  presencePenalty: z.number().nullable().optional(),
  // Source tracking - links column back to the original prompt config/variant
  configId: z.string().uuid().nullable().optional(), // FK to configs
  variantId: z.string().uuid().nullable().optional(), // FK to variants
  variantVersionId: z.string().uuid().nullable().optional(), // FK to variant_versions
});

// Playgrounds table schema - stores playground configurations
export const playgroundsSchema = z.object({
  ...baseSchema,
  name: z.string(),
  datasetId: z.string().uuid().nullable().optional(), // FK to datasets
  columns: z.array(playgroundColumnSchema).nullable(), // JSON column for prompt configurations
});

// Playground runs table schema - execution run metadata
export const playgroundRunsSchema = z.object({
  ...baseSchema,
  playgroundId: z.string().uuid(),
  datasetId: z.string().uuid().nullable(),
  datasetVersionId: z.string().uuid().nullable(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  totalRecords: z.number().int().default(0),
  completedRecords: z.number().int().default(0),
});

// Playground results table schema - individual execution results
export const playgroundResultsSchema = z.object({
  ...baseSchema,
  runId: z.string().uuid(),
  columnId: z.string().uuid(), // References playgroundColumn.id (from JSON)
  datasetRecordId: z.string().uuid().nullable(),
  inputVariables: z.record(z.string(), z.unknown()),
  outputContent: z.string().nullable(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  error: z.string().nullable(),
  latencyMs: z.number().int().nullable(),
  promptTokens: z.number().int().nullable(),
  completionTokens: z.number().int().nullable(),
  totalTokens: z.number().int().nullable(),
  cost: z.number().int().nullable(), // In micro-dollars
});

// Datasets table schema - stores dataset metadata
export const datasetsSchema = z.object({
  ...baseSchema,
  name: z.string(),
  description: z.string().nullable().optional(),
  // Stats (denormalized for performance)
  recordCount: z.number().int().default(0),
  latestVersionNumber: z.number().int().default(1),
});

// Dataset versions table schema - track dataset snapshots for reproducible experiments
export const datasetVersionsSchema = z.object({
  ...baseSchema,
  datasetId: z.string().uuid(), // FK -> datasets.id
  versionNumber: z.number().int().min(1), // Auto-incremented per dataset
  name: z.string().nullable().optional(), // Optional version name
  description: z.string().nullable().optional(),
  recordCount: z.number().int().default(0),
  snapshotHash: z.string(), // SHA-256 hash of record IDs for integrity check
});

// Dataset records table schema - individual test case records
export const datasetRecordsSchema = z.object({
  ...baseSchema,
  datasetId: z.string().uuid(), // FK -> datasets.id
  input: z.record(z.string(), z.unknown()), // Required: input data for the test case
  expected: z.record(z.string(), z.unknown()).nullable().optional(), // Optional: ground truth / ideal output
  metadata: z.record(z.string(), z.unknown()).default({}), // Arbitrary key-value pairs
});

// Dataset version records table schema - junction table mapping records to versions
export const datasetVersionRecordsSchema = z.object({
  ...baseSchema,
  datasetVersionId: z.string().uuid(), // FK -> dataset_versions.id
  datasetRecordId: z.string().uuid(), // FK -> dataset_records.id
  position: z.number().int().default(0), // Position in version (for ordering)
});

// Guardrail configs table schema - stores global guardrail configurations
export const guardrailConfigsSchema = z.object({
  ...baseSchema,
  name: z.string(), // Display name for the guardrail
  pluginId: z.string(), // "default" for built-in guardrails
  functionId: z.string(), // e.g., "regexMatch", "modelWhitelist"
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  parameters: z.record(z.string(), z.unknown()).default({}), // JSON parameters for the guardrail
  enabled: z.boolean().default(true), // Toggle without deleting
  priority: z.number().int().default(0), // Higher priority = runs first
  onFail: z.enum(['block', 'log']).default('block'), // Action on failure
});

// Provider guardrail overrides table schema - per-provider guardrail overrides
export const providerGuardrailOverridesSchema = z.object({
  ...baseSchema,
  providerConfigId: z.string().uuid(), // FK -> provider_configs.id
  guardrailConfigId: z.string().uuid(), // FK -> guardrail_configs.id
  enabled: z.boolean().default(true), // Override: enable/disable for this provider
  parameters: z.record(z.string(), z.unknown()).nullable().optional(), // Override parameters (null = use global)
});

// Guardrail results schema - for telemetry tracking
const guardrailResultSchema = z.object({
  checkId: z.string(), // Guardrail check ID (format: pluginId.functionId, e.g., "default.regexMatch")
  functionId: z.string(),
  hookType: z.enum(['beforeRequestHook', 'afterRequestHook']),
  verdict: z.boolean(),
  latencyMs: z.number(),
});

const guardrailResultsSchema = z.object({
  results: z.array(guardrailResultSchema),
  action: z.enum(['allowed', 'blocked', 'logged']),
  totalLatencyMs: z.number(),
});

// LLM Requests table schema - stores request logs with cost tracking
export const llmRequestsSchema = z.object({
  ...baseSchema,
  requestId: z.string().uuid(), // Unique request identifier for tracing

  // Foreign keys (nullable for direct gateway calls without config)
  configId: z.string().uuid().nullable().optional(), // FK -> configs.id
  variantId: z.string().uuid().nullable().optional(), // FK -> variants.id
  environmentId: z.string().uuid().nullable().optional(), // FK -> environments.id
  providerConfigId: z.string().uuid().nullable().optional(), // FK -> provider_configs.id

  // Provider & Model
  provider: z.string(), // e.g., "openai", "anthropic", "openrouter"
  model: z.string(), // e.g., "gpt-4o", "claude-3-sonnet"

  // Token Usage
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cachedTokens: z.number().int().default(0), // Cache read tokens (OpenAI cached_tokens / Anthropic cache_read_input_tokens)
  cacheCreationTokens: z.number().int().default(0), // Anthropic cache_creation_input_tokens

  // Cost (stored in micro-dollars for precision: $0.001 = 1000)
  cost: z.number().int().default(0), // Total cost in micro-dollars
  cacheSavings: z.number().int().default(0), // Cost saved by cache hits in micro-dollars
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

  // Guardrail telemetry (nullable for seamless migration)
  guardrailResults: guardrailResultsSchema.nullable().optional(), // Guardrail execution results

  // Trace context (nullable for backward compatibility)
  traceId: z.string().nullable().optional(), // W3C 32-hex trace ID
  spanId: z.string().nullable().optional(), // 16-hex span ID
  parentSpanId: z.string().nullable().optional(), // Parent span ID
  sessionId: z.string().nullable().optional(), // Session grouping
});

// Traces table schema - one row per trace, denormalized aggregates
export const tracesSchema = z.object({
  ...baseSchema,
  traceId: z.string(), // W3C 32-hex or UUID
  name: z.string().nullable().optional(), // From x-llmops-trace-name header or first span name
  sessionId: z.string().nullable().optional(), // Session grouping
  userId: z.string().nullable().optional(), // User identifier
  status: z.string().default('unset'), // unset / ok / error (OTel StatusCode as string)
  startTime: z.date(), // Earliest span start
  endTime: z.date().nullable().optional(), // Latest span end
  durationMs: z.number().int().nullable().optional(), // endTime - startTime
  spanCount: z.number().int().default(0),
  totalInputTokens: z.number().int().default(0),
  totalOutputTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  totalCost: z.number().int().default(0), // micro-dollars
  tags: z.record(z.string(), z.string()).default({}),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// Spans table schema - individual operations within a trace
export const spansSchema = z.object({
  ...baseSchema,
  traceId: z.string(), // Links to traces.traceId
  spanId: z.string(), // 16-hex unique span ID
  parentSpanId: z.string().nullable().optional(), // Parent span (enables waterfall)
  name: z.string(), // OTel span name (e.g., "ai.generateText", "chat gpt-4o")
  kind: z.number().int().default(1), // OTel SpanKind (1=INTERNAL, 2=SERVER, 3=CLIENT)
  status: z.number().int().default(0), // OTel StatusCode (0=UNSET, 1=OK, 2=ERROR)
  statusMessage: z.string().nullable().optional(), // Error message
  startTime: z.date(),
  endTime: z.date().nullable().optional(),
  durationMs: z.number().int().nullable().optional(),
  provider: z.string().nullable().optional(), // From gen_ai.provider.name / ai.model.provider
  model: z.string().nullable().optional(), // From gen_ai.request.model / ai.model.id
  promptTokens: z.number().int().default(0),
  completionTokens: z.number().int().default(0),
  totalTokens: z.number().int().default(0),
  cost: z.number().int().default(0), // micro-dollars
  configId: z.string().uuid().nullable().optional(),
  variantId: z.string().uuid().nullable().optional(),
  environmentId: z.string().uuid().nullable().optional(),
  providerConfigId: z.string().uuid().nullable().optional(),
  requestId: z.string().uuid().nullable().optional(), // FK to llm_requests.requestId
  source: z.string().default('gateway'), // 'gateway' or 'otlp'
  input: z.unknown().nullable().optional(), // Request messages/prompt
  output: z.unknown().nullable().optional(), // Response completion/choices
  attributes: z.record(z.string(), z.unknown()).default({}), // Full OTel attributes
});

// Span events table schema - streaming milestones, tool calls, input/output messages
export const spanEventsSchema = z.object({
  id: z.string().uuid(),
  traceId: z.string(),
  spanId: z.string(), // Links to spans.spanId
  name: z.string(), // Event name (e.g., "ai.stream.firstChunk", "gen_ai.tool.call")
  timestamp: z.date(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
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
export type ProviderConfig = z.infer<typeof providerConfigsSchema>;
export type PlaygroundColumn = z.infer<typeof playgroundColumnSchema>;
export type Playground = z.infer<typeof playgroundsSchema>;
export type PlaygroundRun = z.infer<typeof playgroundRunsSchema>;
export type PlaygroundResult = z.infer<typeof playgroundResultsSchema>;
export type GuardrailConfig = z.infer<typeof guardrailConfigsSchema>;
export type ProviderGuardrailOverride = z.infer<
  typeof providerGuardrailOverridesSchema
>;
export type GuardrailResult = z.infer<typeof guardrailResultSchema>;
export type GuardrailResults = z.infer<typeof guardrailResultsSchema>;
export type Dataset = z.infer<typeof datasetsSchema>;
export type DatasetVersion = z.infer<typeof datasetVersionsSchema>;
export type DatasetRecord = z.infer<typeof datasetRecordsSchema>;
export type DatasetVersionRecord = z.infer<typeof datasetVersionRecordsSchema>;
export type LLMRequest = z.infer<typeof llmRequestsSchema>;
export type Trace = z.infer<typeof tracesSchema>;
export type Span = z.infer<typeof spansSchema>;
export type SpanEvent = z.infer<typeof spanEventsSchema>;

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
  superAdminId: string | null;
}

// Provider configs table - stores provider configurations
export interface ProviderConfigsTable extends BaseTable {
  providerId: string;
  slug: string | null;
  name: string | null;
  config: ColumnType<Record<string, unknown>, string, string>;
  enabled: ColumnType<boolean, boolean | undefined, boolean | undefined>;
}

// Playgrounds table
export interface PlaygroundsTable extends BaseTable {
  name: string;
  datasetId: string | null;
  columns: ColumnType<PlaygroundColumn[] | null, string | null, string | null>;
}

// Playground runs table
export interface PlaygroundRunsTable extends BaseTable {
  playgroundId: string;
  datasetId: string | null;
  datasetVersionId: string | null;
  status: string;
  startedAt: ColumnType<Date | null, string | null, string | null>;
  completedAt: ColumnType<Date | null, string | null, string | null>;
  totalRecords: ColumnType<number, number | undefined, number | undefined>;
  completedRecords: ColumnType<number, number | undefined, number | undefined>;
}

// Playground results table
export interface PlaygroundResultsTable extends BaseTable {
  runId: string;
  columnId: string;
  datasetRecordId: string | null;
  inputVariables: ColumnType<Record<string, unknown>, string, string>;
  outputContent: string | null;
  status: string;
  error: string | null;
  latencyMs: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  cost: number | null;
}

// Datasets table
export interface DatasetsTable extends BaseTable {
  name: string;
  description: string | null;
  recordCount: ColumnType<number, number | undefined, number | undefined>;
  latestVersionNumber: ColumnType<
    number,
    number | undefined,
    number | undefined
  >;
}

// Dataset versions table
export interface DatasetVersionsTable extends BaseTable {
  datasetId: string;
  versionNumber: number;
  name: string | null;
  description: string | null;
  recordCount: ColumnType<number, number | undefined, number | undefined>;
  snapshotHash: string;
}

// Dataset records table
export interface DatasetRecordsTable extends BaseTable {
  datasetId: string;
  input: ColumnType<Record<string, unknown>, string, string>;
  expected: ColumnType<
    Record<string, unknown> | null,
    string | null,
    string | null
  >;
  metadata: ColumnType<Record<string, unknown>, string, string>;
}

// Dataset version records table (junction)
export interface DatasetVersionRecordsTable extends BaseTable {
  datasetVersionId: string;
  datasetRecordId: string;
  position: ColumnType<number, number | undefined, number | undefined>;
}

// Guardrail configs table - global guardrail configurations
export interface GuardrailConfigsTable extends BaseTable {
  name: string;
  pluginId: string;
  functionId: string;
  hookType: string;
  parameters: ColumnType<Record<string, unknown>, string, string>;
  enabled: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  priority: ColumnType<number, number | undefined, number | undefined>;
  onFail: ColumnType<string, string | undefined, string | undefined>;
}

// Provider guardrail overrides table - per-provider overrides
export interface ProviderGuardrailOverridesTable extends BaseTable {
  providerConfigId: string;
  guardrailConfigId: string;
  enabled: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  parameters: ColumnType<
    Record<string, unknown> | null,
    string | null,
    string | null
  >;
}

// LLM Requests table - request logs with cost tracking
export interface LLMRequestsTable extends BaseTable {
  requestId: string;
  configId: string | null;
  variantId: string | null;
  environmentId: string | null;
  providerConfigId: string | null;
  provider: string;
  model: string;
  promptTokens: ColumnType<number, number | undefined, number | undefined>;
  completionTokens: ColumnType<number, number | undefined, number | undefined>;
  totalTokens: ColumnType<number, number | undefined, number | undefined>;
  cachedTokens: ColumnType<number, number | undefined, number | undefined>;
  cacheCreationTokens: ColumnType<
    number,
    number | undefined,
    number | undefined
  >;
  cost: ColumnType<number, number | undefined, number | undefined>;
  cacheSavings: ColumnType<number, number | undefined, number | undefined>;
  inputCost: ColumnType<number, number | undefined, number | undefined>;
  outputCost: ColumnType<number, number | undefined, number | undefined>;
  endpoint: string;
  statusCode: number;
  latencyMs: ColumnType<number, number | undefined, number | undefined>;
  isStreaming: ColumnType<boolean, boolean | undefined, boolean | undefined>;
  userId: string | null;
  tags: ColumnType<Record<string, string>, string, string>;
  guardrailResults: ColumnType<
    GuardrailResults | null,
    string | null,
    string | null
  >;
  traceId: string | null;
  spanId: string | null;
  parentSpanId: string | null;
  sessionId: string | null;
}

// Traces table - one row per trace with denormalized aggregates
export interface TracesTable extends BaseTable {
  traceId: string;
  name: string | null;
  sessionId: string | null;
  userId: string | null;
  status: ColumnType<string, string | undefined, string | undefined>;
  startTime: ColumnType<Date, string, string>;
  endTime: ColumnType<Date | null, string | null, string | null>;
  durationMs: number | null;
  spanCount: ColumnType<number, number | undefined, number | undefined>;
  totalInputTokens: ColumnType<number, number | undefined, number | undefined>;
  totalOutputTokens: ColumnType<number, number | undefined, number | undefined>;
  totalTokens: ColumnType<number, number | undefined, number | undefined>;
  totalCost: ColumnType<number, number | undefined, number | undefined>;
  tags: ColumnType<Record<string, string>, string, string>;
  metadata: ColumnType<Record<string, unknown>, string, string>;
}

// Spans table - individual operations within a trace
export interface SpansTable extends BaseTable {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  kind: ColumnType<number, number | undefined, number | undefined>;
  status: ColumnType<number, number | undefined, number | undefined>;
  statusMessage: string | null;
  startTime: ColumnType<Date, string, string>;
  endTime: ColumnType<Date | null, string | null, string | null>;
  durationMs: number | null;
  provider: string | null;
  model: string | null;
  promptTokens: ColumnType<number, number | undefined, number | undefined>;
  completionTokens: ColumnType<number, number | undefined, number | undefined>;
  totalTokens: ColumnType<number, number | undefined, number | undefined>;
  cost: ColumnType<number, number | undefined, number | undefined>;
  configId: string | null;
  variantId: string | null;
  environmentId: string | null;
  providerConfigId: string | null;
  requestId: string | null;
  source: ColumnType<string, string | undefined, string | undefined>;
  input: ColumnType<unknown | null, string | null, string | null>;
  output: ColumnType<unknown | null, string | null, string | null>;
  attributes: ColumnType<Record<string, unknown>, string, string>;
}

// Span events table - streaming milestones, tool calls, input/output
export interface SpanEventsTable {
  id: Generated<string>;
  traceId: string;
  spanId: string;
  name: string;
  timestamp: ColumnType<Date, string, string>;
  attributes: ColumnType<Record<string, unknown>, string, string>;
  createdAt: ColumnType<Date, string | undefined, string | undefined>;
}

/**
 * Main Kysely Database interface
 */
export interface Database {
  workspace_settings: WorkspaceSettingsTable;
  provider_configs: ProviderConfigsTable;
  playgrounds: PlaygroundsTable;
  playground_runs: PlaygroundRunsTable;
  playground_results: PlaygroundResultsTable;
  guardrail_configs: GuardrailConfigsTable;
  provider_guardrail_overrides: ProviderGuardrailOverridesTable;
  datasets: DatasetsTable;
  dataset_versions: DatasetVersionsTable;
  dataset_records: DatasetRecordsTable;
  dataset_version_records: DatasetVersionRecordsTable;
  llm_requests: LLMRequestsTable;
  traces: TracesTable;
  spans: SpansTable;
  span_events: SpanEventsTable;
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
    workspace_settings: {
      order: 8,
      schema: workspaceSettingsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text', nullable: true },
        setupComplete: { type: 'boolean', default: false },
        superAdminId: { type: 'text', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    provider_configs: {
      order: 9,
      schema: providerConfigsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        providerId: { type: 'text' },
        slug: { type: 'text', nullable: true },
        name: { type: 'text', nullable: true },
        config: { type: 'jsonb', default: '{}' },
        enabled: { type: 'boolean', default: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    playgrounds: {
      order: 20,
      schema: playgroundsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        datasetId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'datasets', column: 'id' },
        },
        columns: { type: 'jsonb', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    playground_runs: {
      order: 21,
      schema: playgroundRunsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        playgroundId: {
          type: 'uuid',
          references: { table: 'playgrounds', column: 'id' },
        },
        datasetId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'datasets', column: 'id' },
        },
        datasetVersionId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'dataset_versions', column: 'id' },
        },
        status: { type: 'text' },
        startedAt: { type: 'timestamp', nullable: true },
        completedAt: { type: 'timestamp', nullable: true },
        totalRecords: { type: 'integer', default: 0 },
        completedRecords: { type: 'integer', default: 0 },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    playground_results: {
      order: 22,
      schema: playgroundResultsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        runId: {
          type: 'uuid',
          references: { table: 'playground_runs', column: 'id' },
        },
        columnId: { type: 'uuid' }, // References JSON column ID, no FK
        datasetRecordId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'dataset_records', column: 'id' },
        },
        inputVariables: { type: 'jsonb', default: '{}' },
        outputContent: { type: 'text', nullable: true },
        status: { type: 'text' },
        error: { type: 'text', nullable: true },
        latencyMs: { type: 'integer', nullable: true },
        promptTokens: { type: 'integer', nullable: true },
        completionTokens: { type: 'integer', nullable: true },
        totalTokens: { type: 'integer', nullable: true },
        cost: { type: 'integer', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    guardrail_configs: {
      order: 14,
      schema: guardrailConfigsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        pluginId: { type: 'text' },
        functionId: { type: 'text' },
        hookType: { type: 'text' },
        parameters: { type: 'jsonb', default: '{}' },
        enabled: { type: 'boolean', default: true },
        priority: { type: 'integer', default: 0 },
        onFail: { type: 'text', default: 'block' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    datasets: {
      order: 10,
      schema: datasetsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        name: { type: 'text' },
        description: { type: 'text', nullable: true },
        recordCount: { type: 'integer', default: 0 },
        latestVersionNumber: { type: 'integer', default: 1 },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    dataset_versions: {
      order: 11,
      schema: datasetVersionsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        datasetId: {
          type: 'uuid',
          references: { table: 'datasets', column: 'id' },
        },
        versionNumber: { type: 'integer' },
        name: { type: 'text', nullable: true },
        description: { type: 'text', nullable: true },
        recordCount: { type: 'integer', default: 0 },
        snapshotHash: { type: 'text' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
      uniqueConstraints: [{ columns: ['datasetId', 'versionNumber'] }],
    },
    dataset_records: {
      order: 12,
      schema: datasetRecordsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        datasetId: {
          type: 'uuid',
          references: { table: 'datasets', column: 'id' },
        },
        input: { type: 'jsonb' },
        expected: { type: 'jsonb', nullable: true },
        metadata: { type: 'jsonb', default: '{}' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    dataset_version_records: {
      order: 13,
      schema: datasetVersionRecordsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        datasetVersionId: {
          type: 'uuid',
          references: { table: 'dataset_versions', column: 'id' },
        },
        datasetRecordId: {
          type: 'uuid',
          references: { table: 'dataset_records', column: 'id' },
        },
        position: { type: 'integer', default: 0 },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
      uniqueConstraints: [{ columns: ['datasetVersionId', 'datasetRecordId'] }],
    },
    provider_guardrail_overrides: {
      order: 15,
      schema: providerGuardrailOverridesSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        providerConfigId: {
          type: 'uuid',
          references: { table: 'provider_configs', column: 'id' },
        },
        guardrailConfigId: {
          type: 'uuid',
          references: { table: 'guardrail_configs', column: 'id' },
        },
        enabled: { type: 'boolean', default: true },
        parameters: { type: 'jsonb', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
      uniqueConstraints: [
        { columns: ['providerConfigId', 'guardrailConfigId'] },
      ],
    },
    llm_requests: {
      order: 17,
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
        providerConfigId: {
          type: 'uuid',
          nullable: true,
          references: { table: 'provider_configs', column: 'id' },
        },
        provider: { type: 'text' },
        model: { type: 'text' },
        promptTokens: { type: 'integer', default: 0 },
        completionTokens: { type: 'integer', default: 0 },
        totalTokens: { type: 'integer', default: 0 },
        cachedTokens: { type: 'integer', default: 0 },
        cacheCreationTokens: { type: 'integer', default: 0 },
        cost: { type: 'integer', default: 0 },
        cacheSavings: { type: 'integer', default: 0 },
        inputCost: { type: 'integer', default: 0 },
        outputCost: { type: 'integer', default: 0 },
        endpoint: { type: 'text' },
        statusCode: { type: 'integer' },
        latencyMs: { type: 'integer', default: 0 },
        isStreaming: { type: 'boolean', default: false },
        userId: { type: 'text', nullable: true },
        tags: { type: 'jsonb', default: '{}' },
        guardrailResults: { type: 'jsonb', nullable: true },
        traceId: { type: 'text', nullable: true },
        spanId: { type: 'text', nullable: true },
        parentSpanId: { type: 'text', nullable: true },
        sessionId: { type: 'text', nullable: true },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    traces: {
      order: 30,
      schema: tracesSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        traceId: { type: 'text', unique: true },
        name: { type: 'text', nullable: true },
        sessionId: { type: 'text', nullable: true },
        userId: { type: 'text', nullable: true },
        status: { type: 'text', default: 'unset' },
        startTime: { type: 'timestamp' },
        endTime: { type: 'timestamp', nullable: true },
        durationMs: { type: 'integer', nullable: true },
        spanCount: { type: 'integer', default: 0 },
        totalInputTokens: { type: 'integer', default: 0 },
        totalOutputTokens: { type: 'integer', default: 0 },
        totalTokens: { type: 'integer', default: 0 },
        totalCost: { type: 'integer', default: 0 },
        tags: { type: 'jsonb', default: '{}' },
        metadata: { type: 'jsonb', default: '{}' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    spans: {
      order: 31,
      schema: spansSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        traceId: { type: 'text' },
        spanId: { type: 'text', unique: true },
        parentSpanId: { type: 'text', nullable: true },
        name: { type: 'text' },
        kind: { type: 'integer', default: 1 },
        status: { type: 'integer', default: 0 },
        statusMessage: { type: 'text', nullable: true },
        startTime: { type: 'timestamp' },
        endTime: { type: 'timestamp', nullable: true },
        durationMs: { type: 'integer', nullable: true },
        provider: { type: 'text', nullable: true },
        model: { type: 'text', nullable: true },
        promptTokens: { type: 'integer', default: 0 },
        completionTokens: { type: 'integer', default: 0 },
        totalTokens: { type: 'integer', default: 0 },
        cost: { type: 'integer', default: 0 },
        configId: { type: 'uuid', nullable: true },
        variantId: { type: 'uuid', nullable: true },
        environmentId: { type: 'uuid', nullable: true },
        providerConfigId: { type: 'uuid', nullable: true },
        requestId: { type: 'uuid', nullable: true },
        source: { type: 'text', default: 'gateway' },
        input: { type: 'jsonb', nullable: true },
        output: { type: 'jsonb', nullable: true },
        attributes: { type: 'jsonb', default: '{}' },
        createdAt: { type: 'timestamp', default: 'now()' },
        updatedAt: { type: 'timestamp', default: 'now()', onUpdate: 'now()' },
      },
    },
    span_events: {
      order: 32,
      schema: spanEventsSchema,
      fields: {
        id: { type: 'uuid', primaryKey: true },
        traceId: { type: 'text' },
        spanId: { type: 'text' },
        name: { type: 'text' },
        timestamp: { type: 'timestamp' },
        attributes: { type: 'jsonb', default: '{}' },
        createdAt: { type: 'timestamp', default: 'now()' },
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
  provider_configs: providerConfigsSchema,
  playgrounds: playgroundsSchema,
  playground_columns: playgroundColumnSchema,
  playground_runs: playgroundRunsSchema,
  playground_results: playgroundResultsSchema,
  guardrail_configs: guardrailConfigsSchema,
  provider_guardrail_overrides: providerGuardrailOverridesSchema,
  datasets: datasetsSchema,
  dataset_versions: datasetVersionsSchema,
  dataset_records: datasetRecordsSchema,
  dataset_version_records: datasetVersionRecordsSchema,
  llm_requests: llmRequestsSchema,
  traces: tracesSchema,
  spans: spansSchema,
  span_events: spanEventsSchema,
} as const;
