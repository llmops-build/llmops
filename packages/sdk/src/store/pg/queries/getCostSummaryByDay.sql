-- @name GetCostSummaryByDay :many
SELECT
  DATE("createdAt")::text                  AS "groupKey",
  COALESCE(SUM("cost"), 0)::int           AS "totalCost",
  COUNT(*)::int                           AS "requestCount",
  COALESCE(SUM("totalTokens"), 0)::int    AS "totalTokens"
FROM "llm_requests"
WHERE "createdAt" >= $start_date::timestamp
  AND "createdAt" <= $end_date::timestamp
  AND ($config_id::uuid IS NULL OR "configId" = $config_id)
  AND ($variant_id::uuid IS NULL OR "variantId" = $variant_id)
  AND ($environment_id::uuid IS NULL OR "environmentId" = $environment_id)
GROUP BY DATE("createdAt")
ORDER BY DATE("createdAt") ASC;
