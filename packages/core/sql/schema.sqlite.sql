-- LLMOps Database Schema (SQLite)
-- Generated: 2026-02-05T15:34:50.950Z
-- NOTE: SQLite doesn't support ADD COLUMN IF NOT EXISTS.
-- This schema creates tables if they don't exist but cannot add columns to existing tables.

-- Table: configs
CREATE TABLE IF NOT EXISTS configs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slug)
);

-- Table: variants
CREATE TABLE IF NOT EXISTS variants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: variant_versions
CREATE TABLE IF NOT EXISTS variant_versions (
  id TEXT PRIMARY KEY,
  variant_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  json_data TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (variant_id, version)
);

-- Table: environments
CREATE TABLE IF NOT EXISTS environments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_prod INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (slug)
);

-- Table: environment_secrets
CREATE TABLE IF NOT EXISTS environment_secrets (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: config_variants
CREATE TABLE IF NOT EXISTS config_variants (
  id TEXT PRIMARY KEY,
  config_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: targeting_rules
CREATE TABLE IF NOT EXISTS targeting_rules (
  id TEXT PRIMARY KEY,
  environment_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  config_variant_id TEXT NOT NULL,
  variant_version_id TEXT,
  weight INTEGER NOT NULL DEFAULT 10000,
  priority INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  conditions TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: workspace_settings
CREATE TABLE IF NOT EXISTS workspace_settings (
  id TEXT PRIMARY KEY,
  name TEXT,
  setup_complete INTEGER NOT NULL DEFAULT 0,
  super_admin_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: provider_configs
CREATE TABLE IF NOT EXISTS provider_configs (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  slug TEXT,
  name TEXT,
  config TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: datasets
CREATE TABLE IF NOT EXISTS datasets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  record_count INTEGER NOT NULL DEFAULT 0,
  latest_version_number INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: dataset_versions
CREATE TABLE IF NOT EXISTS dataset_versions (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  name TEXT,
  description TEXT,
  record_count INTEGER NOT NULL DEFAULT 0,
  snapshot_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (dataset_id, version_number)
);

-- Table: dataset_records
CREATE TABLE IF NOT EXISTS dataset_records (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  input TEXT NOT NULL,
  expected TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: dataset_version_records
CREATE TABLE IF NOT EXISTS dataset_version_records (
  id TEXT PRIMARY KEY,
  dataset_version_id TEXT NOT NULL,
  dataset_record_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (dataset_version_id, dataset_record_id)
);

-- Table: guardrail_configs
CREATE TABLE IF NOT EXISTS guardrail_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  function_id TEXT NOT NULL,
  hook_type TEXT NOT NULL,
  parameters TEXT NOT NULL DEFAULT '{}',
  enabled INTEGER NOT NULL DEFAULT 1,
  priority INTEGER NOT NULL DEFAULT 0,
  on_fail TEXT NOT NULL DEFAULT 'block',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: provider_guardrail_overrides
CREATE TABLE IF NOT EXISTS provider_guardrail_overrides (
  id TEXT PRIMARY KEY,
  provider_config_id TEXT NOT NULL,
  guardrail_config_id TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  parameters TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (provider_config_id, guardrail_config_id)
);

-- Table: llm_requests
CREATE TABLE IF NOT EXISTS llm_requests (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  config_id TEXT,
  variant_id TEXT,
  environment_id TEXT,
  provider_config_id TEXT,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INTEGER NOT NULL DEFAULT 0,
  completion_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  cached_tokens INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  input_cost INTEGER NOT NULL DEFAULT 0,
  output_cost INTEGER NOT NULL DEFAULT 0,
  endpoint TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  latency_ms INTEGER NOT NULL DEFAULT 0,
  is_streaming INTEGER NOT NULL DEFAULT 0,
  user_id TEXT,
  tags TEXT NOT NULL DEFAULT '{}',
  guardrail_results TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: playgrounds
CREATE TABLE IF NOT EXISTS playgrounds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dataset_id TEXT,
  columns TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: playground_runs
CREATE TABLE IF NOT EXISTS playground_runs (
  id TEXT PRIMARY KEY,
  playground_id TEXT NOT NULL,
  dataset_id TEXT,
  dataset_version_id TEXT,
  status TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  total_records INTEGER NOT NULL DEFAULT 0,
  completed_records INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Table: playground_results
CREATE TABLE IF NOT EXISTS playground_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  column_id TEXT NOT NULL,
  dataset_record_id TEXT,
  input_variables TEXT NOT NULL DEFAULT '{}',
  output_content TEXT,
  status TEXT NOT NULL,
  error TEXT,
  latency_ms INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_variant_versions_variant_id ON variant_versions(variant_id);
CREATE INDEX IF NOT EXISTS idx_environment_secrets_environment_id ON environment_secrets(environment_id);
CREATE INDEX IF NOT EXISTS idx_config_variants_config_id ON config_variants(config_id);
CREATE INDEX IF NOT EXISTS idx_config_variants_variant_id ON config_variants(variant_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_environment_id ON targeting_rules(environment_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_config_id ON targeting_rules(config_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_config_variant_id ON targeting_rules(config_variant_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_variant_version_id ON targeting_rules(variant_version_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_records_dataset_id ON dataset_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_version_records_dataset_version_id ON dataset_version_records(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_dataset_version_records_dataset_record_id ON dataset_version_records(dataset_record_id);
CREATE INDEX IF NOT EXISTS idx_provider_guardrail_overrides_provider_config_id ON provider_guardrail_overrides(provider_config_id);
CREATE INDEX IF NOT EXISTS idx_provider_guardrail_overrides_guardrail_config_id ON provider_guardrail_overrides(guardrail_config_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_config_id ON llm_requests(config_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_variant_id ON llm_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_environment_id ON llm_requests(environment_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_provider_config_id ON llm_requests(provider_config_id);
CREATE INDEX IF NOT EXISTS idx_playgrounds_dataset_id ON playgrounds(dataset_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_playground_id ON playground_runs(playground_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_dataset_id ON playground_runs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_dataset_version_id ON playground_runs(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_playground_results_run_id ON playground_results(run_id);
CREATE INDEX IF NOT EXISTS idx_playground_results_dataset_record_id ON playground_results(dataset_record_id);
