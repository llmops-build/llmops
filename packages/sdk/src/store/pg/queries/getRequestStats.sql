SELECT
  COUNT(*)::int                                                                      AS "totalRequests",
  COUNT(CASE WHEN "statusCode" >= 200 AND "statusCode" < 300 THEN 1 END)::int       AS "successfulRequests",
  COUNT(CASE WHEN "statusCode" >= 400 THEN 1 END)::int                              AS "failedRequests",
  COUNT(CASE WHEN "isStreaming" = true THEN 1 END)::int                              AS "streamingRequests",
  AVG("latencyMs")                                                                   AS "avgLatencyMs",
  MAX("latencyMs")::int                                                              AS "maxLatencyMs",
  MIN("latencyMs")::int                                                              AS "minLatencyMs"
FROM "llm_requests"
WHERE "createdAt" >= $start_date::timestamp
  AND "createdAt" <= $end_date::timestamp
  AND ($config_id::uuid IS NULL OR "configId" = $config_id)
  AND ($variant_id::uuid IS NULL OR "variantId" = $variant_id)
  AND ($environment_id::uuid IS NULL OR "environmentId" = $environment_id);
