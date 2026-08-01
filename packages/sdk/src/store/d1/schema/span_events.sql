CREATE TABLE span_events (
  "id" TEXT PRIMARY KEY,
  "traceId" TEXT NOT NULL,
  "spanId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "timestamp" TEXT NOT NULL,
  "attributes" TEXT NOT NULL DEFAULT '{}',
  "createdAt" TEXT NOT NULL DEFAULT (datetime('now'))
);
