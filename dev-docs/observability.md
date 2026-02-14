# Observability: Request Logging, Cost Tracking & Distributed Tracing

Internal documentation for how request logging, cost tracking, distributed tracing, and guardrail telemetry work end-to-end.

---

## Architecture Overview

```
CLIENT REQUEST (with optional traceparent / x-llmops-trace-id headers)
    │
    ▼
costTracking middleware (resolves trace context, generates requestId + spanId)
    │
    ▼
gatewayAdapter middleware (resolves config → provider credentials → Portkey config)
    │
    ▼
Gateway / LLM Provider execution
    │
    ▼
POST-RESPONSE: extract usage + guardrail results
    │
    ▼
Calculate cost via models.dev pricing
    │
    ▼
Enqueue to BatchWriter (llm_requests) + TraceBatchWriter (traces/spans/span_events)
    │
    ▼
Periodic flush → DB tables
```

**OTLP Ingestion (separate path):**
```
OTLP Client (Vercel AI SDK, OpenLLMetry, etc.)
    │
    ▼
POST /api/otlp/v1/traces (OTLP JSON format)
    │
    ▼
Parse spans, extract attributes, enqueue to TraceBatchWriter
    │
    ▼
Periodic flush → traces/spans/span_events tables
```

---

## Key Files

| File | Purpose |
|------|---------|
| `packages/app/src/server/middlewares/costTracking.ts` | Main middleware: request tracking + trace context |
| `packages/app/src/server/handlers/genai/gatewayAdapter.ts` | Resolves config/provider and sets gateway headers |
| `packages/app/src/server/services/batchWriter.ts` | Batches `llm_requests` DB writes |
| `packages/app/src/server/services/traceBatchWriter.ts` | Batches `traces`/`spans`/`span_events` DB writes |
| `packages/app/src/server/lib/traceContext.ts` | Resolves trace context from W3C/custom headers |
| `packages/app/src/server/lib/streamingCostExtractor.ts` | Extracts usage from SSE streaming responses |
| `packages/app/src/server/handlers/otlp/index.ts` | OTLP ingestion endpoint |
| `packages/app/src/server/handlers/traces/index.ts` | Traces query API (list, detail, stats) |
| `packages/core/src/constants/headers.ts` | Shared header name constants |
| `packages/core/src/datalayer/traces.ts` | Database operations for traces/spans/span_events |
| `packages/core/src/datalayer/llmRequests.ts` | Database operations for `llm_requests` table |
| `packages/sdk/src/client/index.ts` | SDK client with `provider()` trace context support |
| `packages/sdk/src/telemetry/exporter.ts` | OTel SpanExporter for OTLP ingestion |

---

## Distributed Tracing

### Trace Context Propagation

The gateway resolves trace context from incoming request headers (in `traceContext.ts`):

1. **W3C `traceparent`** header (highest priority) — extracts traceId + parentSpanId
2. **`x-llmops-trace-id`** header — custom 32-hex trace ID
3. **Auto-generate** — if neither header is present, a new traceId is created

Additional headers read:
- `x-llmops-trace-name` — human-readable trace name
- `x-llmops-span-name` — span name (e.g., agent name)
- `x-llmops-session-id` — session grouping
- `x-llmops-user-id` — user attribution

All header names are defined as constants in `packages/core/src/constants/headers.ts`.

Response headers set by the gateway:
- `x-llmops-trace-id` — resolved trace ID
- `x-llmops-span-id` — generated span ID for this hop
- `traceparent` — W3C format for downstream propagation

### Database Tables

**`traces`** — One row per trace, with denormalized aggregates:
- `traceId` (unique, 32-hex), `name`, `sessionId`, `userId`
- `status` (unset/ok/error), `startTime`, `endTime`, `durationMs`
- `spanCount`, `totalInputTokens`, `totalOutputTokens`, `totalTokens`, `totalCost`
- `tags` (JSONB), `metadata` (JSONB)

**`spans`** — Individual spans (gateway or OTLP):
- `traceId`, `spanId` (unique), `parentSpanId` (enables waterfall)
- `name`, `kind` (OTel SpanKind), `status` (OTel StatusCode), `statusMessage`
- `provider`, `model`, `promptTokens`, `completionTokens`, `totalTokens`, `cost`
- `source` ('gateway' or 'otlp'), `input`/`output` (JSONB), `attributes` (JSONB)

**`span_events`** — OTel span events:
- `traceId`, `spanId`, `name`, `timestamp`, `attributes` (JSONB)

### TraceBatchWriter (`traceBatchWriter.ts`)

Same pattern as `batchWriter.ts`. On flush:
1. Groups queued spans by traceId
2. Upserts each trace with aggregated stats (ON CONFLICT merge)
3. Batch inserts all spans
4. Batch inserts all span events

### OTLP Ingestion (`POST /api/otlp/v1/traces`)

Accepts standard OTLP JSON (`ExportTraceServiceRequest` format). Processing:
1. Parse `resourceSpans → scopeSpans → spans`
2. Extract typed fields from attributes (provider, model, tokens, input/output)
3. Convert nanosecond timestamps to Date objects
4. Set `source: 'otlp'` to distinguish from gateway spans
5. Enqueue to TraceBatchWriter

Attribute extraction supports both OTel GenAI conventions (`gen_ai.*`) and Vercel AI SDK conventions (`ai.*`).

### Traces Query API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/traces` | GET | List traces with filters (sessionId, userId, status, dateRange, tags) |
| `/v1/traces/:traceId` | GET | Single trace with all spans + span events (waterfall data) |

### SDK Integration

The `provider()` method accepts a `traceContext` callback for automatic header injection:

```typescript
import { llmops } from '@llmops/sdk';

const client = llmops();
const provider = client.provider({
  traceContext: () => ({
    traceId: '...32-hex...',
    traceName: 'My workflow',
    spanName: 'AgentName',
  }),
});
// Pass to OpenAI client: new OpenAI(provider)
```

For standard OTel clients, use the OTLP exporter:

```typescript
import { createLLMOpsSpanExporter } from '@llmops/sdk';

const exporter = createLLMOpsSpanExporter({
  baseURL: 'http://localhost:5177',
  apiKey: 'env-secret',
});
// Use with NodeTracerProvider + SimpleSpanProcessor
```

---

## Cost Tracking Middleware (`costTracking.ts`)

### Tracked Endpoints

```
/chat/completions, /completions, /responses, /embeddings,
/images/generations, /images/edits, /audio/speech,
/audio/transcriptions, /audio/translations, /messages
```

### Flow

1. **Request interception**: Generates a UUID `requestId`, sets `x-llmops-request-id` header
2. **Streaming detection**: Parses body, checks `body.stream === true`
3. **For streaming**: Calls `ensureStreamUsageEnabled()` to inject `stream_options.include_usage: true` into the request body so the provider returns token usage in the final SSE chunk
4. **Executes handler** via `await next()`
5. **Post-response processing** (differs by streaming vs non-streaming, see below)
6. **Cost calculation**: Fetches pricing from `models.dev/api.json` (cached 5 min), calculates in micro-dollars
7. **Enqueues** `LLMRequestData` to the global `BatchWriter`

### Non-Streaming Response Processing

- Clones the response, parses JSON body
- Extracts `usage` object (supports both OpenAI `prompt_tokens`/`completion_tokens` and Responses API `input_tokens`/`output_tokens` formats)
- Extracts `hook_results` for guardrail telemetry
- Calculates cost synchronously

### Streaming Response Processing

- Wraps response body through a `TransformStream` via `wrapStreamingResponse()`
- The transform stream passes data through unchanged to the client while extracting usage from SSE events
- Returns a `usagePromise` that resolves when the stream ends
- Cost calculation happens asynchronously after stream completion (does not block client)

### Custom Tags

OpenAI SDK's `metadata` field (up to 16 key-value string pairs) is extracted from the request body and stored in the `tags` JSONB column:

```typescript
// Request body
{ "model": "gpt-4o", "metadata": { "team": "search", "env": "staging" }, ... }
```

### Provider Detection

Provider is extracted from the `x-llmops-config` header (set by gatewayAdapter):

```typescript
const llmopsConfig = JSON.parse(c.req.header('x-llmops-config'));
provider = llmopsConfig.provider; // e.g., "openai", "anthropic"
```

---

## Gateway Adapter Middleware (`gatewayAdapter.ts`)

Runs before the gateway. Two modes of operation:

### Mode 1: Direct Provider (`@provider-slug/model`)

When no `configId` header is present and the model field uses `@slug/model` format:

1. Parses `@provider-slug/model-name` from `body.model`
2. Looks up credentials via `getProviderCredentialsWithFallback(slug, inlineProviders, db)`
   - Inline config (code-defined) takes precedence over database
3. Builds `PortkeyConfig` with provider credentials
4. Fetches guardrails from manifest (if db available)
5. Sets `x-llmops-config` header with the serialized config
6. Sets `x-portkey-default-input-guardrails` / `x-portkey-default-output-guardrails` headers
7. Stores `variantModel` and `providerId` in Hono context

### Mode 2: Config-Based Routing (with `configId`)

1. Loads manifest via `getManifestService(kyselyDb).getManifest()`
2. Resolves environment from `envSec` header or defaults to production
3. Routes to a variant via `ManifestRouter.routeWithWeights(configId, environmentId, routingContext)`
4. Parses variant config with `variantJsonDataSchema`
5. Fetches provider credentials from cache
6. Builds `PortkeyConfig` and attaches guardrails
7. **Merges variant config into request body**:
   - Chat completions: `mergeChatCompletionBody()` — prepends variant messages, overrides model/temperature/etc.
   - Responses API: `mergeResponsesBody()` — converts system messages to `instructions` param
8. Renders Nunjucks templates in messages using `input_variables` from request body
9. Stores `variantConfig`, `variantModel`, `configId`, `variantId`, `environmentId` in Hono context

---

## BatchWriter (`batchWriter.ts`)

### Dual-Trigger Batching

- **Time-based**: Flushes every `flushIntervalMs` (default: 2000ms)
- **Size-based**: Flushes immediately when queue reaches `maxBatchSize` (default: 100)

### Global Singleton

```typescript
const batchWriter = getGlobalBatchWriter(
  { batchInsertRequests: (requests) => db.batchInsertRequests(requests) },
  { flushIntervalMs: 2000, debug: false }
);
```

Lazily initialized on first access. Single instance across the entire app.

### Error Recovery

Failed batches are re-queued at the front of the queue for retry on the next flush cycle.

### Graceful Shutdown

`stop()` method performs a final flush before termination.

---

## Database: `llm_requests` Table

### Schema

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `requestId` | UUID | External tracing ID, set as `x-llmops-request-id` header |
| `configId` | UUID FK nullable | → `configs.id` |
| `variantId` | UUID FK nullable | → `variants.id` |
| `environmentId` | UUID FK nullable | → `environments.id` |
| `providerConfigId` | UUID FK nullable | → `provider_configs.id` |
| `provider` | TEXT | e.g., `"openai"`, `"anthropic"` |
| `model` | TEXT | e.g., `"gpt-4o"`, `"claude-3-sonnet"` |
| `promptTokens` | INT | Input tokens (default 0) |
| `completionTokens` | INT | Output tokens (default 0) |
| `totalTokens` | INT | prompt + completion (default 0) |
| `cachedTokens` | INT | Cached tokens for pricing (default 0) |
| `cost` | INT | Total cost in **micro-dollars** (default 0) |
| `inputCost` | INT | Input cost in micro-dollars (default 0) |
| `outputCost` | INT | Output cost in micro-dollars (default 0) |
| `endpoint` | TEXT | API path, e.g., `/chat/completions` |
| `statusCode` | INT | HTTP status code |
| `latencyMs` | INT | Request latency in ms (default 0) |
| `isStreaming` | BOOLEAN | Whether request used SSE streaming |
| `userId` | TEXT nullable | For future budget tracking |
| `tags` | JSONB | Custom metadata from `body.metadata` |
| `guardrailResults` | JSONB nullable | Guardrail execution telemetry |
| `createdAt` | TIMESTAMP | Row creation time |
| `updatedAt` | TIMESTAMP | Row update time |

### Batch Insert (`batchInsertRequests`)

Located in `packages/core/src/datalayer/llmRequests.ts`:

1. Validates each request against a Zod schema (`insertLLMRequestSchema`)
2. Transforms to DB row format (JSON.stringify for `tags` and `guardrailResults`)
3. Executes single `INSERT INTO llm_requests VALUES (...)` with all rows via Kysely
4. Returns `{ count: number }`

### Analytics Queries (same file)

- `listRequests()` — paginated listing with tag/date/config filters
- `getTotalCost()` — aggregate cost over time range
- `getCostSummary()` — flexible grouping (by day, hour, model, provider, config, endpoint, tags)
- `getCostByModel()`, `getCostByProvider()`, `getCostByConfig()`
- `getDailyCosts()` — time-series for charts
- `getRequestStats()` — counts, success rates, latency percentiles
- `getDistinctTags()` — tag enumeration for UI dropdowns

---

## Cost Calculation

### Pricing Source

External API: `https://models.dev/api.json` — cached in-memory for 5 minutes by `PricingProvider` class.

### Formula

All costs stored in **micro-dollars** (1 dollar = 1,000,000 micro-dollars) to avoid floating-point issues:

```
inputCost  = round(promptTokens * inputCostPer1M)
outputCost = round(completionTokens * outputCostPer1M)
totalCost  = inputCost + outputCost
```

Where `inputCostPer1M` and `outputCostPer1M` come from models.dev pricing data (cost per 1M tokens).

### Provider ID Mapping

Some providers use different IDs between models.dev and the Portkey gateway:

```
reka → reka-ai
azure-cognitive-services → azure-ai
azure → azure-openai
```

---

## Guardrail Telemetry

### Gateway Format (in response)

```json
{
  "hook_results": {
    "before_request_hooks": [{ "id": "...", "verdict": true, "execution_time": 42, "checks": [...], "deny": false }],
    "after_request_hooks": [...]
  }
}
```

### Stored Format (in `guardrailResults` JSONB column)

```json
{
  "results": [
    {
      "checkId": "default.regexMatch",
      "functionId": "regexMatch",
      "hookType": "beforeRequestHook",
      "verdict": true,
      "latencyMs": 42
    }
  ],
  "action": "allowed",   // "allowed" | "blocked" | "logged"
  "totalLatencyMs": 42
}
```

- `action: "blocked"` — HTTP 446 status code (guardrail failure)
- `action: "logged"` — guardrail failed but `on_fail` was not `block`
- `action: "allowed"` — all guardrails passed

### Streaming Guardrails

For streaming responses, guardrail results are sent as SSE events and extracted by the `streamingCostExtractor` TransformStream alongside usage data.

---

## Caching Layers

| What | TTL | Backend | Namespace |
|------|-----|---------|-----------|
| Gateway manifest | 5 min | In-memory (`CacheService`) | `gateway` |
| Provider credentials | 5 min | In-memory (`CacheService`) | `provider-credentials` |
| Model pricing | 5 min | In-memory (`PricingProvider`) | — |

All caches use lazy initialization and support manual invalidation.

---

## Hono Context Variables

Set by the middleware chain and consumed by cost tracking:

| Variable | Set By | Purpose |
|----------|--------|---------|
| `configId` | gatewayAdapter | Config ID for the request |
| `variantId` | gatewayAdapter | Resolved variant ID |
| `environmentId` | gatewayAdapter | Resolved environment ID |
| `variantModel` | gatewayAdapter | Resolved model name |
| `variantConfig` | gatewayAdapter | Full variant JSON config |
| `providerConfigId` | gatewayAdapter | Provider config FK |
| `envSec` | upstream middleware | Environment secret from header |
| `__costTrackingContext` | costTracking | Internal request context |
| `__traceContext` | costTracking | Resolved trace context (traceId, spanId, parentSpanId, etc.) |
