-- @name GetCostSummaryByModel :many
SELECT
  "provider" || '/' || "model"             AS "groupKey",
  COALESCE(SUM("cost"), 0)::int           AS "totalCost",
  COUNT(*)::int                           AS "requestCount"
FROM "llm_requests"
WHERE "createdAt" >= $start_date::timestamp
  AND "createdAt" <= $end_date::timestamp
  AND ($config_id::uuid IS NULL OR "configId" = $config_id)
  AND ($variant_id::uuid IS NULL OR "variantId" = $variant_id)
  AND ($environment_id::uuid IS NULL OR "environmentId" = $environment_id)
GROUP BY "provider", "model"
ORDER BY SUM("cost") DESC;
