SELECT
  COALESCE(SUM(cost), 0)::int                AS "totalCost",
  COALESCE(SUM(input_cost), 0)::int          AS "totalInputCost",
  COALESCE(SUM(output_cost), 0)::int         AS "totalOutputCost",
  COALESCE(SUM(prompt_tokens), 0)::int       AS "totalPromptTokens",
  COALESCE(SUM(completion_tokens), 0)::int   AS "totalCompletionTokens",
  COALESCE(SUM(total_tokens), 0)::int        AS "totalTokens",
  COALESCE(SUM(cached_tokens), 0)::int       AS "totalCachedTokens",
  COALESCE(SUM(cache_savings), 0)::int       AS "totalCacheSavings",
  COUNT(*)::int                              AS "requestCount"
FROM llm_requests
WHERE created_at >= $1
  AND created_at <= $2
