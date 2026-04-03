-- @name GetRequestByRequestId :one
SELECT * FROM "llm_requests"
WHERE "requestId" = $request_id;
