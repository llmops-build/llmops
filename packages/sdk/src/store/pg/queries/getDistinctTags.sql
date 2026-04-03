-- @name GetDistinctTags :many
SELECT DISTINCT key, value
FROM "llm_requests", jsonb_each_text("tags") AS t(key, value)
WHERE "tags" != '{}'::jsonb
ORDER BY key, value;
