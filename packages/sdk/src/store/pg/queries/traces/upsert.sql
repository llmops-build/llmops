INSERT INTO "traces" (
  "id", "traceId", "name", "sessionId", "userId", "status",
  "startTime", "endTime", "durationMs", "spanCount",
  "totalInputTokens", "totalOutputTokens", "totalTokens", "totalCost",
  "tags", "metadata", "createdAt", "updatedAt"
) VALUES (
  $id, $trace_id, $name, $session_id, $user_id, $status,
  $start_time::timestamp, $end_time::timestamp, $duration_ms::integer, $span_count::integer,
  $total_input_tokens::integer, $total_output_tokens::integer, $total_tokens::integer, $total_cost::integer,
  $tags::jsonb, $metadata::jsonb, $now::timestamp, $now
)
ON CONFLICT ("traceId") DO UPDATE SET
  "name" = COALESCE(EXCLUDED."name", "traces"."name"),
  "sessionId" = COALESCE(EXCLUDED."sessionId", "traces"."sessionId"),
  "userId" = COALESCE(EXCLUDED."userId", "traces"."userId"),
  "status" = CASE
    WHEN EXCLUDED."status" = 'error' THEN 'error'
    WHEN EXCLUDED."status" = 'ok' AND "traces"."status" != 'error' THEN 'ok'
    ELSE "traces"."status"
  END,
  "startTime" = LEAST("traces"."startTime", EXCLUDED."startTime"),
  "endTime" = GREATEST(
    COALESCE("traces"."endTime", EXCLUDED."endTime"),
    COALESCE(EXCLUDED."endTime", "traces"."endTime")
  ),
  "durationMs" = EXTRACT(EPOCH FROM (
    GREATEST(
      COALESCE("traces"."endTime", EXCLUDED."endTime"),
      COALESCE(EXCLUDED."endTime", "traces"."endTime")
    ) -
    LEAST("traces"."startTime", EXCLUDED."startTime")
  ))::integer * 1000,
  "spanCount" = "traces"."spanCount" + EXCLUDED."spanCount",
  "totalInputTokens" = "traces"."totalInputTokens" + EXCLUDED."totalInputTokens",
  "totalOutputTokens" = "traces"."totalOutputTokens" + EXCLUDED."totalOutputTokens",
  "totalTokens" = "traces"."totalTokens" + EXCLUDED."totalTokens",
  "totalCost" = "traces"."totalCost" + EXCLUDED."totalCost",
  "tags" = "traces"."tags" || EXCLUDED."tags",
  "metadata" = "traces"."metadata" || EXCLUDED."metadata",
  "updatedAt" = $now;
