-- LLMOps Database Schema (PostgreSQL)
-- This SQL is fully idempotent and safe to run on every server restart.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA public;

-- STEP 1: Create tables (if not exist)
CREATE TABLE IF NOT EXISTS configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS variant_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS environment_secrets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS config_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS targeting_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS workspace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS dataset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS dataset_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS dataset_version_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS guardrail_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS provider_guardrail_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS llm_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS playgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS playground_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
CREATE TABLE IF NOT EXISTS playground_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);

-- STEP 2: Add columns (if not exist)
ALTER TABLE configs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE variants ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS version INTEGER;
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS json_data JSONB;
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE variant_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE environments ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS is_prod BOOLEAN DEFAULT FALSE;
ALTER TABLE environments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE environments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE environment_secrets ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE environment_secrets ADD COLUMN IF NOT EXISTS key_name TEXT;
ALTER TABLE environment_secrets ADD COLUMN IF NOT EXISTS key_value TEXT;
ALTER TABLE environment_secrets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE environment_secrets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE config_variants ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE config_variants ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE config_variants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE config_variants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS config_variant_id UUID;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS variant_version_id UUID;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 10000;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS conditions JSONB DEFAULT '{}'::jsonb;
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE targeting_rules ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS super_admin_id TEXT;
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE workspace_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb;
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE provider_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS record_count INTEGER DEFAULT 0;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS latest_version_number INTEGER DEFAULT 1;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS version_number INTEGER;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS record_count INTEGER DEFAULT 0;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS snapshot_hash TEXT;
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_versions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS input JSONB;
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS expected JSONB;
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_version_records ADD COLUMN IF NOT EXISTS dataset_version_id UUID;
ALTER TABLE dataset_version_records ADD COLUMN IF NOT EXISTS dataset_record_id UUID;
ALTER TABLE dataset_version_records ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
ALTER TABLE dataset_version_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE dataset_version_records ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS plugin_id TEXT;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS function_id TEXT;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS hook_type TEXT;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS parameters JSONB DEFAULT '{}'::jsonb;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS on_fail TEXT DEFAULT 'block';
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE guardrail_configs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS provider_config_id UUID;
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS guardrail_config_id UUID;
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS parameters JSONB;
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE provider_guardrail_overrides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS request_id UUID;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS config_id UUID;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS environment_id UUID;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS provider_config_id UUID;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS provider TEXT;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS model TEXT;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS completion_tokens INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS total_tokens INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS cached_tokens INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS cost INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS input_cost INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS output_cost INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS endpoint TEXT;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS status_code INTEGER;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS latency_ms INTEGER DEFAULT 0;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS is_streaming BOOLEAN DEFAULT FALSE;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '{}'::jsonb;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS guardrail_results JSONB;
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE llm_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playgrounds ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE playgrounds ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE playgrounds ADD COLUMN IF NOT EXISTS columns JSONB;
ALTER TABLE playgrounds ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playgrounds ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS playground_id UUID;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS dataset_id UUID;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS dataset_version_id UUID;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS total_records INTEGER DEFAULT 0;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS completed_records INTEGER DEFAULT 0;
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playground_runs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS run_id UUID;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS column_id UUID;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS dataset_record_id UUID;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS input_variables JSONB DEFAULT '{}'::jsonb;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS output_content TEXT;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS error TEXT;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS latency_ms INTEGER;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS prompt_tokens INTEGER;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS completion_tokens INTEGER;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS total_tokens INTEGER;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS cost INTEGER;
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE playground_results ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- STEP 3: Add unique constraints (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_configs_slug'
  ) THEN
    ALTER TABLE configs ADD CONSTRAINT uq_configs_slug UNIQUE (slug);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_variant_versions_variant_id_version'
  ) THEN
    ALTER TABLE variant_versions ADD CONSTRAINT uq_variant_versions_variant_id_version UNIQUE (variant_id, version);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_environments_slug'
  ) THEN
    ALTER TABLE environments ADD CONSTRAINT uq_environments_slug UNIQUE (slug);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_dataset_versions_dataset_id_version_number'
  ) THEN
    ALTER TABLE dataset_versions ADD CONSTRAINT uq_dataset_versions_dataset_id_version_number UNIQUE (dataset_id, version_number);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_dataset_version_records_dataset_version_id_dataset_record_id'
  ) THEN
    ALTER TABLE dataset_version_records ADD CONSTRAINT uq_dataset_version_records_dataset_version_id_dataset_record_id UNIQUE (dataset_version_id, dataset_record_id);
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_provider_guardrail_overrides_provider_config_id_guardrail_config_id'
  ) THEN
    ALTER TABLE provider_guardrail_overrides ADD CONSTRAINT uq_provider_guardrail_overrides_provider_config_id_guardrail_config_id UNIQUE (provider_config_id, guardrail_config_id);
  END IF;
END $$;

-- STEP 4: Add foreign keys (if not exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_variant_versions_variant_id'
  ) THEN
    ALTER TABLE variant_versions ADD CONSTRAINT fk_variant_versions_variant_id
      FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_environment_secrets_environment_id'
  ) THEN
    ALTER TABLE environment_secrets ADD CONSTRAINT fk_environment_secrets_environment_id
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_config_variants_config_id'
  ) THEN
    ALTER TABLE config_variants ADD CONSTRAINT fk_config_variants_config_id
      FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_config_variants_variant_id'
  ) THEN
    ALTER TABLE config_variants ADD CONSTRAINT fk_config_variants_variant_id
      FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_environment_id'
  ) THEN
    ALTER TABLE targeting_rules ADD CONSTRAINT fk_targeting_rules_environment_id
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_config_id'
  ) THEN
    ALTER TABLE targeting_rules ADD CONSTRAINT fk_targeting_rules_config_id
      FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_config_variant_id'
  ) THEN
    ALTER TABLE targeting_rules ADD CONSTRAINT fk_targeting_rules_config_variant_id
      FOREIGN KEY (config_variant_id) REFERENCES config_variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_targeting_rules_variant_version_id'
  ) THEN
    ALTER TABLE targeting_rules ADD CONSTRAINT fk_targeting_rules_variant_version_id
      FOREIGN KEY (variant_version_id) REFERENCES variant_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_versions_dataset_id'
  ) THEN
    ALTER TABLE dataset_versions ADD CONSTRAINT fk_dataset_versions_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_records_dataset_id'
  ) THEN
    ALTER TABLE dataset_records ADD CONSTRAINT fk_dataset_records_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_version_records_dataset_version_id'
  ) THEN
    ALTER TABLE dataset_version_records ADD CONSTRAINT fk_dataset_version_records_dataset_version_id
      FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_dataset_version_records_dataset_record_id'
  ) THEN
    ALTER TABLE dataset_version_records ADD CONSTRAINT fk_dataset_version_records_dataset_record_id
      FOREIGN KEY (dataset_record_id) REFERENCES dataset_records(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_provider_guardrail_overrides_provider_config_id'
  ) THEN
    ALTER TABLE provider_guardrail_overrides ADD CONSTRAINT fk_provider_guardrail_overrides_provider_config_id
      FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_provider_guardrail_overrides_guardrail_config_id'
  ) THEN
    ALTER TABLE provider_guardrail_overrides ADD CONSTRAINT fk_provider_guardrail_overrides_guardrail_config_id
      FOREIGN KEY (guardrail_config_id) REFERENCES guardrail_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_config_id'
  ) THEN
    ALTER TABLE llm_requests ADD CONSTRAINT fk_llm_requests_config_id
      FOREIGN KEY (config_id) REFERENCES configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_variant_id'
  ) THEN
    ALTER TABLE llm_requests ADD CONSTRAINT fk_llm_requests_variant_id
      FOREIGN KEY (variant_id) REFERENCES variants(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_environment_id'
  ) THEN
    ALTER TABLE llm_requests ADD CONSTRAINT fk_llm_requests_environment_id
      FOREIGN KEY (environment_id) REFERENCES environments(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_llm_requests_provider_config_id'
  ) THEN
    ALTER TABLE llm_requests ADD CONSTRAINT fk_llm_requests_provider_config_id
      FOREIGN KEY (provider_config_id) REFERENCES provider_configs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playgrounds_dataset_id'
  ) THEN
    ALTER TABLE playgrounds ADD CONSTRAINT fk_playgrounds_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_playground_id'
  ) THEN
    ALTER TABLE playground_runs ADD CONSTRAINT fk_playground_runs_playground_id
      FOREIGN KEY (playground_id) REFERENCES playgrounds(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_dataset_id'
  ) THEN
    ALTER TABLE playground_runs ADD CONSTRAINT fk_playground_runs_dataset_id
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_runs_dataset_version_id'
  ) THEN
    ALTER TABLE playground_runs ADD CONSTRAINT fk_playground_runs_dataset_version_id
      FOREIGN KEY (dataset_version_id) REFERENCES dataset_versions(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_results_run_id'
  ) THEN
    ALTER TABLE playground_results ADD CONSTRAINT fk_playground_results_run_id
      FOREIGN KEY (run_id) REFERENCES playground_runs(id) ON DELETE CASCADE;
  END IF;
END $$;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_playground_results_dataset_record_id'
  ) THEN
    ALTER TABLE playground_results ADD CONSTRAINT fk_playground_results_dataset_record_id
      FOREIGN KEY (dataset_record_id) REFERENCES dataset_records(id) ON DELETE CASCADE;
  END IF;
END $$;

-- STEP 5: Create indexes (if not exist)
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

-- STEP 6: Create updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';
DROP TRIGGER IF EXISTS update_configs_updated_at ON configs;
CREATE TRIGGER update_configs_updated_at BEFORE UPDATE ON configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_variants_updated_at ON variants;
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_variant_versions_updated_at ON variant_versions;
CREATE TRIGGER update_variant_versions_updated_at BEFORE UPDATE ON variant_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_environments_updated_at ON environments;
CREATE TRIGGER update_environments_updated_at BEFORE UPDATE ON environments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_environment_secrets_updated_at ON environment_secrets;
CREATE TRIGGER update_environment_secrets_updated_at BEFORE UPDATE ON environment_secrets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_config_variants_updated_at ON config_variants;
CREATE TRIGGER update_config_variants_updated_at BEFORE UPDATE ON config_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_targeting_rules_updated_at ON targeting_rules;
CREATE TRIGGER update_targeting_rules_updated_at BEFORE UPDATE ON targeting_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_workspace_settings_updated_at ON workspace_settings;
CREATE TRIGGER update_workspace_settings_updated_at BEFORE UPDATE ON workspace_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_provider_configs_updated_at ON provider_configs;
CREATE TRIGGER update_provider_configs_updated_at BEFORE UPDATE ON provider_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_datasets_updated_at ON datasets;
CREATE TRIGGER update_datasets_updated_at BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_versions_updated_at ON dataset_versions;
CREATE TRIGGER update_dataset_versions_updated_at BEFORE UPDATE ON dataset_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_records_updated_at ON dataset_records;
CREATE TRIGGER update_dataset_records_updated_at BEFORE UPDATE ON dataset_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_dataset_version_records_updated_at ON dataset_version_records;
CREATE TRIGGER update_dataset_version_records_updated_at BEFORE UPDATE ON dataset_version_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_guardrail_configs_updated_at ON guardrail_configs;
CREATE TRIGGER update_guardrail_configs_updated_at BEFORE UPDATE ON guardrail_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_provider_guardrail_overrides_updated_at ON provider_guardrail_overrides;
CREATE TRIGGER update_provider_guardrail_overrides_updated_at BEFORE UPDATE ON provider_guardrail_overrides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_llm_requests_updated_at ON llm_requests;
CREATE TRIGGER update_llm_requests_updated_at BEFORE UPDATE ON llm_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_playgrounds_updated_at ON playgrounds;
CREATE TRIGGER update_playgrounds_updated_at BEFORE UPDATE ON playgrounds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_playground_runs_updated_at ON playground_runs;
CREATE TRIGGER update_playground_runs_updated_at BEFORE UPDATE ON playground_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
DROP TRIGGER IF EXISTS update_playground_results_updated_at ON playground_results;
CREATE TRIGGER update_playground_results_updated_at BEFORE UPDATE ON playground_results FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
