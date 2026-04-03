-- @name GetTraceByTraceId :one
SELECT * FROM "traces" WHERE "traceId" = $trace_id;
