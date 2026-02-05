-- LLMOps Database Schema (MySQL)
-- Generated: 2026-02-05T15:34:50.951Z
-- NOTE: MySQL doesn't support ADD COLUMN IF NOT EXISTS in standard SQL.
-- This schema creates tables if they don't exist.

-- Table: configs
CREATE TABLE IF NOT EXISTS configs (
  id CHAR(36) PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_configs_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: variants
CREATE TABLE IF NOT EXISTS variants (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: variant_versions
CREATE TABLE IF NOT EXISTS variant_versions (
  id CHAR(36) PRIMARY KEY,
  variant_id CHAR(36) NOT NULL,
  version INT NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  json_data JSON NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_variant_versions_variant_id FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
  UNIQUE KEY uq_variant_versions_variant_id_version (variant_id, version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: environments
CREATE TABLE IF NOT EXISTS environments (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_prod TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_environments_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: environment_secrets
CREATE TABLE IF NOT EXISTS environment_secrets (
  id CHAR(36) PRIMARY KEY,
  environment_id CHAR(36) NOT NULL,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_environment_secrets_environment_id FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: config_variants
CREATE TABLE IF NOT EXISTS config_variants (
  id CHAR(36) PRIMARY KEY,
  config_id CHAR(36) NOT NULL,
  variant_id CHAR(36) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_config_variants_config_id FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_config_variants_variant_id FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: targeting_rules
CREATE TABLE IF NOT EXISTS targeting_rules (
  id CHAR(36) PRIMARY KEY,
  environment_id CHAR(36) NOT NULL,
  config_id CHAR(36) NOT NULL,
  config_variant_id CHAR(36) NOT NULL,
  variant_version_id CHAR(36),
  weight INT NOT NULL DEFAULT 10000,
  priority INT NOT NULL DEFAULT 0,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  conditions JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_targeting_rules_environment_id FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
  CONSTRAINT fk_targeting_rules_config_id FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_targeting_rules_config_variant_id FOREIGN KEY (config_variant_id) REFERENCES config_variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_targeting_rules_variant_version_id FOREIGN KEY (variant_version_id) REFERENCES variant_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: workspace_settings
CREATE TABLE IF NOT EXISTS workspace_settings (
  id CHAR(36) PRIMARY KEY,
  name TEXT,
  setup_complete TINYINT(1) NOT NULL DEFAULT 0,
  super_admin_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: provider_configs
CREATE TABLE IF NOT EXISTS provider_configs (
  id CHAR(36) PRIMARY KEY,
  provider_id TEXT NOT NULL,
  slug TEXT,
  name TEXT,
  config JSON NOT NULL DEFAULT (JSON_OBJECT()),
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: datasets
CREATE TABLE IF NOT EXISTS datasets (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  record_count INT NOT NULL DEFAULT 0,
  latest_version_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dataset_versions
CREATE TABLE IF NOT EXISTS dataset_versions (
  id CHAR(36) PRIMARY KEY,
  dataset_id CHAR(36) NOT NULL,
  version_number INT NOT NULL,
  name TEXT,
  description TEXT,
  record_count INT NOT NULL DEFAULT 0,
  snapshot_hash TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dataset_versions_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  UNIQUE KEY uq_dataset_versions_dataset_id_version_number (dataset_id, version_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dataset_records
CREATE TABLE IF NOT EXISTS dataset_records (
  id CHAR(36) PRIMARY KEY,
  dataset_id CHAR(36) NOT NULL,
  input JSON NOT NULL,
  expected JSON,
  metadata JSON NOT NULL DEFAULT (JSON_OBJECT()),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dataset_records_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: dataset_version_records
CREATE TABLE IF NOT EXISTS dataset_version_records (
  id CHAR(36) PRIMARY KEY,
  dataset_version_id CHAR(36) NOT NULL,
  dataset_record_id CHAR(36) NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dataset_version_records_dataset_version_id FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE,
  CONSTRAINT fk_dataset_version_records_dataset_record_id FOREIGN KEY (dataset_record_id) REFERENCES dataset_records(id) ON DELETE CASCADE,
  UNIQUE KEY uq_dataset_version_records_dataset_version_id_dataset_record_id (dataset_version_id, dataset_record_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: guardrail_configs
CREATE TABLE IF NOT EXISTS guardrail_configs (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  plugin_id TEXT NOT NULL,
  function_id TEXT NOT NULL,
  hook_type TEXT NOT NULL,
  parameters JSON NOT NULL DEFAULT (JSON_OBJECT()),
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  priority INT NOT NULL DEFAULT 0,
  on_fail TEXT NOT NULL DEFAULT 'block',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: provider_guardrail_overrides
CREATE TABLE IF NOT EXISTS provider_guardrail_overrides (
  id CHAR(36) PRIMARY KEY,
  provider_config_id CHAR(36) NOT NULL,
  guardrail_config_id CHAR(36) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  parameters JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_provider_guardrail_overrides_provider_config_id FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_provider_guardrail_overrides_guardrail_config_id FOREIGN KEY (guardrail_config_id) REFERENCES guardrail_configs(id) ON DELETE CASCADE,
  UNIQUE KEY uq_provider_guardrail_overrides_provider_config_id_guardrail_config_id (provider_config_id, guardrail_config_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: llm_requests
CREATE TABLE IF NOT EXISTS llm_requests (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  config_id CHAR(36),
  variant_id CHAR(36),
  environment_id CHAR(36),
  provider_config_id CHAR(36),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_tokens INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT NOT NULL DEFAULT 0,
  cached_tokens INT NOT NULL DEFAULT 0,
  cost INT NOT NULL DEFAULT 0,
  input_cost INT NOT NULL DEFAULT 0,
  output_cost INT NOT NULL DEFAULT 0,
  endpoint TEXT NOT NULL,
  status_code INT NOT NULL,
  latency_ms INT NOT NULL DEFAULT 0,
  is_streaming TINYINT(1) NOT NULL DEFAULT 0,
  user_id TEXT,
  tags JSON NOT NULL DEFAULT (JSON_OBJECT()),
  guardrail_results JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_llm_requests_config_id FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE,
  CONSTRAINT fk_llm_requests_variant_id FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE,
  CONSTRAINT fk_llm_requests_environment_id FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE,
  CONSTRAINT fk_llm_requests_provider_config_id FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: playgrounds
CREATE TABLE IF NOT EXISTS playgrounds (
  id CHAR(36) PRIMARY KEY,
  name TEXT NOT NULL,
  dataset_id CHAR(36),
  columns JSON,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_playgrounds_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: playground_runs
CREATE TABLE IF NOT EXISTS playground_runs (
  id CHAR(36) PRIMARY KEY,
  playground_id CHAR(36) NOT NULL,
  dataset_id CHAR(36),
  dataset_version_id CHAR(36),
  status TEXT NOT NULL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  total_records INT NOT NULL DEFAULT 0,
  completed_records INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_playground_runs_playground_id FOREIGN KEY (playground_id) REFERENCES playgrounds(id) ON DELETE CASCADE,
  CONSTRAINT fk_playground_runs_dataset_id FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  CONSTRAINT fk_playground_runs_dataset_version_id FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: playground_results
CREATE TABLE IF NOT EXISTS playground_results (
  id CHAR(36) PRIMARY KEY,
  run_id CHAR(36) NOT NULL,
  column_id CHAR(36) NOT NULL,
  dataset_record_id CHAR(36),
  input_variables JSON NOT NULL DEFAULT (JSON_OBJECT()),
  output_content TEXT,
  status TEXT NOT NULL,
  error TEXT,
  latency_ms INT,
  prompt_tokens INT,
  completion_tokens INT,
  total_tokens INT,
  cost INT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_playground_results_run_id FOREIGN KEY (run_id) REFERENCES playground_runs(id) ON DELETE CASCADE,
  CONSTRAINT fk_playground_results_dataset_record_id FOREIGN KEY (dataset_record_id) REFERENCES dataset_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
