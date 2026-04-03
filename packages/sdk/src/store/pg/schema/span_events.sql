CREATE TABLE span_events (
  "id" UUID PRIMARY KEY,
  "traceId" VARCHAR(255) NOT NULL,
  "spanId" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255) NOT NULL,
  "timestamp" TIMESTAMP NOT NULL,
  "attributes" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
