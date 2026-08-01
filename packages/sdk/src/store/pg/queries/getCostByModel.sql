SELECT
  "provider",
  "model",
  COALESCE(SUM("cost"), 0)::int           AS "totalCost",
  COALESCE(SUM("inputCost"), 0)::int      AS "totalInputCost",
  COALESCE(SUM("outputCost"), 0)::int     AS "totalOutputCost",
  COALESCE(SUM("totalTokens"), 0)::int    AS "totalTokens",
  COUNT(*)::int                           AS "requestCount",
  AVG("latencyMs")                        AS "avgLatencyMs"
FROM "llm_requests"
WHERE "createdAt" >= $start_date::timestamp
  AND "createdAt" <= $end_date::timestamp
GROUP BY "provider", "model"
ORDER BY SUM("cost") DESC;
