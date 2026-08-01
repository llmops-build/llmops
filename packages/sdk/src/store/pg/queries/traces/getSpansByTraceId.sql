SELECT * FROM "spans"
WHERE "traceId" = $trace_id
ORDER BY "startTime" ASC;
