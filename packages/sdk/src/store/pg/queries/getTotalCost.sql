-- @name GetTotalCost :one
SELECT
  COALESCE(SUM("cost"), 0)::int                AS "totalCost",
  COALESCE(SUM("inputCost"), 0)::int           AS "totalInputCost",
  COALESCE(SUM("outputCost"), 0)::int          AS "totalOutputCost",
  COALESCE(SUM("promptTokens"), 0)::int        AS "totalPromptTokens",
  COALESCE(SUM("completionTokens"), 0)::int    AS "totalCompletionTokens",
  COALESCE(SUM("totalTokens"), 0)::int         AS "totalTokens",
  COALESCE(SUM("cachedTokens"), 0)::int        AS "totalCachedTokens",
  COALESCE(SUM("cacheSavings"), 0)::int        AS "totalCacheSavings",
  COUNT(*)::int                                AS "requestCount"
FROM "llm_requests"
WHERE "createdAt" >= $start_date::timestamp
  AND "createdAt" <= $end_date::timestamp;
