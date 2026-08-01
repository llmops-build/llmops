SELECT * FROM "span_events"
WHERE "traceId" = $trace_id
ORDER BY "timestamp" ASC;
