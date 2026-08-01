SELECT
  COUNT(*)::int                                                              AS "totalTraces",
  COALESCE(AVG("durationMs"), 0)                                            AS "avgDurationMs",
  COUNT(CASE WHEN "status" = 'error' THEN 1 END)::int                       AS "errorCount",
  COALESCE(SUM("totalCost"), 0)::int                                        AS "totalCost",
  COALESCE(SUM("totalTokens"), 0)::int                                      AS "totalTokens",
  COALESCE(SUM("spanCount"), 0)::int                                        AS "totalSpans"
FROM "traces"
WHERE "startTime" >= $start_date::timestamp
  AND "startTime" <= $end_date::timestamp
  AND ($session_id::varchar IS NULL OR "sessionId" = $session_id)
  AND ($user_id::varchar IS NULL OR "userId" = $user_id);
