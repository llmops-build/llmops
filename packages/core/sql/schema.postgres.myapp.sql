-- LLMOps Database Schema (PostgreSQL)
-- This SQL is fully idempotent and safe to run on every server restart.

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS "myapp";

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- STEP 1: Create tables (if not exist)
CREATE TABLE IF NOT EXISTS "myapp".configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".variant_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".environment_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".config_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".dataset_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".dataset_version_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".guardrail_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".provider_guardrail_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".llm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".playgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".playground_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS "myapp".playground_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- STEP 2: Add columns (if not exist)
ALTER TABLE "myapp".configs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE "myapp".configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".variants ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS version INTEGER;
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS json_data JSONB;
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".variant_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".environments ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".environments ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE "myapp".environments ADD COLUMN IF NOT EXISTS is_prod BOOLEAN DEFAULT FALSE;
ALTER TABLE "myapp".environments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".environments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".environment_secrets ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE "myapp".environment_secrets ADD COLUMN IF NOT EXISTS key_name TEXT;
ALTER TABLE "myapp".environment_secrets ADD COLUMN IF NOT EXISTS key_value TEXT;
ALTER TABLE "myapp".environment_secrets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".environment_secrets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".config_variants ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE "myapp".config_variants ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE "myapp".config_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".config_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS config_variant_id UUID;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS variant_version_id UUID;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 10000;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".targeting_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".workspace_settings ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".workspace_settings ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE "myapp".workspace_settings ADD COLUMN IF NOT EXISTS super_admin_id TEXT;
ALTER TABLE "myapp".workspace_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".workspace_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".provider_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS record_count INTEGER DEFAULT 0;
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS latest_version_number INTEGER DEFAULT 1;
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".datasets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS version_number INTEGER;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS record_count INTEGER DEFAULT 0;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS snapshot_hash TEXT;
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS input JSONB;
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS expected JSONB;
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_version_records ADD COLUMN IF NOT EXISTS dataset_version_id UUID;
ALTER TABLE "myapp".dataset_version_records ADD COLUMN IF NOT EXISTS dataset_record_id UUID;
ALTER TABLE "myapp".dataset_version_records ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE "myapp".dataset_version_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".dataset_version_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS plugin_id TEXT;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS function_id TEXT;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS hook_type TEXT;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS on_fail TEXT DEFAULT 'block';
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".guardrail_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS provider_config_id UUID;
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS guardrail_config_id UUID;
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS parameters JSONB;
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".provider_guardrail_overrides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS provider_config_id UUID;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS cached_tokens INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS input_cost INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS output_cost INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS endpoint TEXT;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS status_code INTEGER;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT FALSE;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS guardrail_results JSONB;
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".llm_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playgrounds ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE "myapp".playgrounds ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE "myapp".playgrounds ADD COLUMN IF NOT EXISTS columns JSONB;
ALTER TABLE "myapp".playgrounds ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playgrounds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS playground_id UUID;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS dataset_version_id UUID;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS total_records INTEGER DEFAULT 0;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS completed_records INTEGER DEFAULT 0;
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playground_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS run_id UUID;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS column_id UUID;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS dataset_record_id UUID;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS input_variables JSONB DEFAULT '{}'::jsonb;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS output_content TEXT;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS total_tokens INTEGER;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS cost INTEGER;
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE "myapp".playground_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 3: Add unique constraints (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_configs_slug'
  ) THEN
    ALTER TABLE "myapp".configs ADD CONSTRAINT uq_configs_slug UNIQUE (slug);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_variant_versions_variant_id_version'
  ) THEN
    ALTER TABLE "myapp".variant_versions ADD CONSTRAINT uq_variant_versions_variant_id_version UNIQUE (variant_id, version);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_environments_slug'
  ) THEN
    ALTER TABLE "myapp".environments ADD CONSTRAINT uq_environments_slug UNIQUE (slug);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_dataset_versions_dataset_id_version_number'
  ) THEN
    ALTER TABLE "myapp".dataset_versions ADD CONSTRAINT uq_dataset_versions_dataset_id_version_number UNIQUE (dataset_id, version_number);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_dataset_version_records_dataset_version_id_dataset_record_id'
  ) THEN
    ALTER TABLE "myapp".dataset_version_records ADD CONSTRAINT uq_dataset_version_records_dataset_version_id_dataset_record_id UNIQUE (dataset_version_id, dataset_record_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_provider_guardrail_overrides_provider_config_id_guardrail_config_id'
  ) THEN
    ALTER TABLE "myapp".provider_guardrail_overrides ADD CONSTRAINT uq_provider_guardrail_overrides_provider_config_id_guardrail_config_id UNIQUE (provider_config_id, guardrail_config_id);
  END IF;
END $$;

-- STEP 4: Add foreign keys (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_variant_versions_variant_id'
  ) THEN
    ALTER TABLE "myapp".variant_versions ADD CONSTRAINT fk_variant_versions_variant_id
      FOREIGN KEY (variant_id) REFERENCES "myapp".variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_environment_secrets_environment_id'
  ) THEN
    ALTER TABLE "myapp".environment_secrets ADD CONSTRAINT fk_environment_secrets_environment_id
      FOREIGN KEY (environment_id) REFERENCES "myapp".environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_config_variants_config_id'
  ) THEN
    ALTER TABLE "myapp".config_variants ADD CONSTRAINT fk_config_variants_config_id
      FOREIGN KEY (config_id) REFERENCES "myapp".configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_config_variants_variant_id'
  ) THEN
    ALTER TABLE "myapp".config_variants ADD CONSTRAINT fk_config_variants_variant_id
      FOREIGN KEY (variant_id) REFERENCES "myapp".variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_environment_id'
  ) THEN
    ALTER TABLE "myapp".targeting_rules ADD CONSTRAINT fk_targeting_rules_environment_id
      FOREIGN KEY (environment_id) REFERENCES "myapp".environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_config_id'
  ) THEN
    ALTER TABLE "myapp".targeting_rules ADD CONSTRAINT fk_targeting_rules_config_id
      FOREIGN KEY (config_id) REFERENCES "myapp".configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_config_variant_id'
  ) THEN
    ALTER TABLE "myapp".targeting_rules ADD CONSTRAINT fk_targeting_rules_config_variant_id
      FOREIGN KEY (config_variant_id) REFERENCES "myapp".config_variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_variant_version_id'
  ) THEN
    ALTER TABLE "myapp".targeting_rules ADD CONSTRAINT fk_targeting_rules_variant_version_id
      FOREIGN KEY (variant_version_id) REFERENCES "myapp".variant_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_versions_dataset_id'
  ) THEN
    ALTER TABLE "myapp".dataset_versions ADD CONSTRAINT fk_dataset_versions_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES "myapp".datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_records_dataset_id'
  ) THEN
    ALTER TABLE "myapp".dataset_records ADD CONSTRAINT fk_dataset_records_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES "myapp".datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_version_records_dataset_version_id'
  ) THEN
    ALTER TABLE "myapp".dataset_version_records ADD CONSTRAINT fk_dataset_version_records_dataset_version_id
      FOREIGN KEY (dataset_version_id) REFERENCES "myapp".dataset_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_version_records_dataset_record_id'
  ) THEN
    ALTER TABLE "myapp".dataset_version_records ADD CONSTRAINT fk_dataset_version_records_dataset_record_id
      FOREIGN KEY (dataset_record_id) REFERENCES "myapp".dataset_records(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_provider_guardrail_overrides_provider_config_id'
  ) THEN
    ALTER TABLE "myapp".provider_guardrail_overrides ADD CONSTRAINT fk_provider_guardrail_overrides_provider_config_id
      FOREIGN KEY (provider_config_id) REFERENCES "myapp".provider_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_provider_guardrail_overrides_guardrail_config_id'
  ) THEN
    ALTER TABLE "myapp".provider_guardrail_overrides ADD CONSTRAINT fk_provider_guardrail_overrides_guardrail_config_id
      FOREIGN KEY (guardrail_config_id) REFERENCES "myapp".guardrail_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_config_id'
  ) THEN
    ALTER TABLE "myapp".llm_requests ADD CONSTRAINT fk_llm_requests_config_id
      FOREIGN KEY (config_id) REFERENCES "myapp".configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_variant_id'
  ) THEN
    ALTER TABLE "myapp".llm_requests ADD CONSTRAINT fk_llm_requests_variant_id
      FOREIGN KEY (variant_id) REFERENCES "myapp".variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_environment_id'
  ) THEN
    ALTER TABLE "myapp".llm_requests ADD CONSTRAINT fk_llm_requests_environment_id
      FOREIGN KEY (environment_id) REFERENCES "myapp".environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_provider_config_id'
  ) THEN
    ALTER TABLE "myapp".llm_requests ADD CONSTRAINT fk_llm_requests_provider_config_id
      FOREIGN KEY (provider_config_id) REFERENCES "myapp".provider_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playgrounds_dataset_id'
  ) THEN
    ALTER TABLE "myapp".playgrounds ADD CONSTRAINT fk_playgrounds_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES "myapp".datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_playground_id'
  ) THEN
    ALTER TABLE "myapp".playground_runs ADD CONSTRAINT fk_playground_runs_playground_id
      FOREIGN KEY (playground_id) REFERENCES "myapp".playgrounds(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_dataset_id'
  ) THEN
    ALTER TABLE "myapp".playground_runs ADD CONSTRAINT fk_playground_runs_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES "myapp".datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_dataset_version_id'
  ) THEN
    ALTER TABLE "myapp".playground_runs ADD CONSTRAINT fk_playground_runs_dataset_version_id
      FOREIGN KEY (dataset_version_id) REFERENCES "myapp".dataset_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_results_run_id'
  ) THEN
    ALTER TABLE "myapp".playground_results ADD CONSTRAINT fk_playground_results_run_id
      FOREIGN KEY (run_id) REFERENCES "myapp".playground_runs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_results_dataset_record_id'
  ) THEN
    ALTER TABLE "myapp".playground_results ADD CONSTRAINT fk_playground_results_dataset_record_id
      FOREIGN KEY (dataset_record_id) REFERENCES "myapp".dataset_records(id) ON DELETE CASCADE;
  END IF;
END $$;

-- STEP 5: Create indexes (if not exist)
CREATE INDEX IF NOT EXISTS idx_variant_versions_variant_id ON "myapp".variant_versions(variant_id);
CREATE INDEX IF NOT EXISTS idx_environment_secrets_environment_id ON "myapp".environment_secrets(environment_id);
CREATE INDEX IF NOT EXISTS idx_config_variants_config_id ON "myapp".config_variants(config_id);
CREATE INDEX IF NOT EXISTS idx_config_variants_variant_id ON "myapp".config_variants(variant_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_environment_id ON "myapp".targeting_rules(environment_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_config_id ON "myapp".targeting_rules(config_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_config_variant_id ON "myapp".targeting_rules(config_variant_id);
CREATE INDEX IF NOT EXISTS idx_targeting_rules_variant_version_id ON "myapp".targeting_rules(variant_version_id);
CREATE INDEX IF NOT EXISTS idx_dataset_versions_dataset_id ON "myapp".dataset_versions(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_records_dataset_id ON "myapp".dataset_records(dataset_id);
CREATE INDEX IF NOT EXISTS idx_dataset_version_records_dataset_version_id ON "myapp".dataset_version_records(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_dataset_version_records_dataset_record_id ON "myapp".dataset_version_records(dataset_record_id);
CREATE INDEX IF NOT EXISTS idx_provider_guardrail_overrides_provider_config_id ON "myapp".provider_guardrail_overrides(provider_config_id);
CREATE INDEX IF NOT EXISTS idx_provider_guardrail_overrides_guardrail_config_id ON "myapp".provider_guardrail_overrides(guardrail_config_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_config_id ON "myapp".llm_requests(config_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_variant_id ON "myapp".llm_requests(variant_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_environment_id ON "myapp".llm_requests(environment_id);
CREATE INDEX IF NOT EXISTS idx_llm_requests_provider_config_id ON "myapp".llm_requests(provider_config_id);
CREATE INDEX IF NOT EXISTS idx_playgrounds_dataset_id ON "myapp".playgrounds(dataset_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_playground_id ON "myapp".playground_runs(playground_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_dataset_id ON "myapp".playground_runs(dataset_id);
CREATE INDEX IF NOT EXISTS idx_playground_runs_dataset_version_id ON "myapp".playground_runs(dataset_version_id);
CREATE INDEX IF NOT EXISTS idx_playground_results_run_id ON "myapp".playground_results(run_id);
CREATE INDEX IF NOT EXISTS idx_playground_results_dataset_record_id ON "myapp".playground_results(dataset_record_id);

-- STEP 6: Create updated_at triggers
CREATE OR REPLACE FUNCTION "myapp".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_configs_updated_at ON "myapp".configs;
CREATE TRIGGER update_configs_updated_at BEFORE UPDATE ON "myapp".configs FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_variants_updated_at ON "myapp".variants;
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON "myapp".variants FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_variant_versions_updated_at ON "myapp".variant_versions;
CREATE TRIGGER update_variant_versions_updated_at BEFORE UPDATE ON "myapp".variant_versions FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_environments_updated_at ON "myapp".environments;
CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON "myapp".environments FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_environment_secrets_updated_at ON "myapp".environment_secrets;
CREATE TRIGGER update_environment_secrets_updated_at BEFORE UPDATE ON "myapp".environment_secrets FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_config_variants_updated_at ON "myapp".config_variants;
CREATE TRIGGER update_config_variants_updated_at BEFORE UPDATE ON "myapp".config_variants FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_targeting_rules_updated_at ON "myapp".targeting_rules;
CREATE TRIGGER update_targeting_rules_updated_at BEFORE UPDATE ON "myapp".targeting_rules FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON "myapp".workspace_settings;
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON "myapp".workspace_settings FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_provider_configs_updated_at ON "myapp".provider_configs;
CREATE TRIGGER update_provider_configs_updated_at BEFORE UPDATE ON "myapp".provider_configs FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_datasets_updated_at ON "myapp".datasets;
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON "myapp".datasets FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_versions_updated_at ON "myapp".dataset_versions;
CREATE TRIGGER update_dataset_versions_updated_at BEFORE UPDATE ON "myapp".dataset_versions FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_records_updated_at ON "myapp".dataset_records;
CREATE TRIGGER update_dataset_records_updated_at BEFORE UPDATE ON "myapp".dataset_records FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_version_records_updated_at ON "myapp".dataset_version_records;
CREATE TRIGGER update_dataset_version_records_updated_at BEFORE UPDATE ON "myapp".dataset_version_records FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_guardrail_configs_updated_at ON "myapp".guardrail_configs;
CREATE TRIGGER update_guardrail_configs_updated_at BEFORE UPDATE ON "myapp".guardrail_configs FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_provider_guardrail_overrides_updated_at ON "myapp".provider_guardrail_overrides;
CREATE TRIGGER update_provider_guardrail_overrides_updated_at BEFORE UPDATE ON "myapp".provider_guardrail_overrides FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_llm_requests_updated_at ON "myapp".llm_requests;
CREATE TRIGGER update_llm_requests_updated_at BEFORE UPDATE ON "myapp".llm_requests FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_playgrounds_updated_at ON "myapp".playgrounds;
CREATE TRIGGER update_playgrounds_updated_at BEFORE UPDATE ON "myapp".playgrounds FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_playground_runs_updated_at ON "myapp".playground_runs;
CREATE TRIGGER update_playground_runs_updated_at BEFORE UPDATE ON "myapp".playground_runs FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
DROP TRIGGER IF EXISTS update_playground_results_updated_at ON "myapp".playground_results;
CREATE TRIGGER update_playground_results_updated_at BEFORE UPDATE ON "myapp".playground_results FOR EACH ROW EXECUTE FUNCTION "myapp".update_updated_at_column();
