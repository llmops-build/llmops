BEGIN;

CREATE TABLE IF NOT EXISTS llm_requests (
  id UUID PRIMARY KEY,
  "requestId" UUID NOT NULL,
  "configId" UUID,
  "variantId" UUID,
  "environmentId" UUID,
  "providerConfigId" UUID,
  provider VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "cachedTokens" INTEGER NOT NULL DEFAULT 0,
  "cacheCreationTokens" INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  "cacheSavings" INTEGER NOT NULL DEFAULT 0,
  "inputCost" INTEGER NOT NULL DEFAULT 0,
  "outputCost" INTEGER NOT NULL DEFAULT 0,
  endpoint VARCHAR(255) NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "latencyMs" INTEGER NOT NULL DEFAULT 0,
  "isStreaming" BOOLEAN NOT NULL DEFAULT false,
  "userId" VARCHAR(255),
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  "guardrailResults" JSONB,
  "traceId" VARCHAR(255),
  "spanId" VARCHAR(255),
  "parentSpanId" VARCHAR(255),
  "sessionId" VARCHAR(255),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS span_events (
  id UUID PRIMARY KEY,
  "traceId" VARCHAR(255) NOT NULL,
  "spanId" VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spans (
  id UUID PRIMARY KEY,
  "traceId" VARCHAR(255) NOT NULL,
  "spanId" VARCHAR(255) NOT NULL UNIQUE,
  "parentSpanId" VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  kind INTEGER NOT NULL DEFAULT 1,
  status INTEGER NOT NULL DEFAULT 0,
  "statusMessage" TEXT,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "durationMs" INTEGER,
  provider VARCHAR(255),
  model VARCHAR(255),
  "promptTokens" INTEGER NOT NULL DEFAULT 0,
  "completionTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  cost INTEGER NOT NULL DEFAULT 0,
  "configId" UUID,
  "variantId" UUID,
  "environmentId" UUID,
  "providerConfigId" UUID,
  "requestId" UUID,
  source VARCHAR(50) NOT NULL DEFAULT 'gateway',
  input JSONB,
  output JSONB,
  attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traces (
  id UUID PRIMARY KEY,
  "traceId" VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  "sessionId" VARCHAR(255),
  "userId" VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'unset',
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP,
  "durationMs" INTEGER,
  "spanCount" INTEGER NOT NULL DEFAULT 0,
  "totalInputTokens" INTEGER NOT NULL DEFAULT 0,
  "totalOutputTokens" INTEGER NOT NULL DEFAULT 0,
  "totalTokens" INTEGER NOT NULL DEFAULT 0,
  "totalCost" INTEGER NOT NULL DEFAULT 0,
  tags JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
