# CLAUDE.md

## What This Is

LLMOps is an open-source, pluggable LLMOps toolkit for TypeScript. One SDK that gives you an AI gateway, observability, and evals for every LLM call. UNIX philosophy — each piece does one thing well and composes via typed interfaces.

Website: https://llmops.build
License: Apache 2.0

## Monorepo Structure

```
packages/
├── sdk/              → @llmops/sdk — Public API. Entry point for everything.
│   └── src/
│       ├── index.ts          → llmops() client, provider config, telemetry bus
│       ├── store/
│       │   ├── pg.ts         → pgStore() — Postgres adapter. Implements Store.
│       │   └── sqlite.ts     → [Planned] sqliteStore() — SQLite adapter. Implements Store.
│       ├── sink/
│       │   └── otel.ts       → [Planned] otelSink() — OTel exporter. Implements Sink.
│       ├── eval/             → [Planned] scorer, dataset, experiment primitives
│       │   ├── index.ts      → [Planned] exports: scorer, dataset, experiment
│       │   └── judge.ts      → [Planned] exports: judgeScorer (LLM-as-judge)
│       ├── types/            → [Planned] Store, Sink, TelemetryEvent interfaces
│       │   └── index.ts
│       └── middleware/
│           ├── hono.ts       → createLLMOpsMiddleware for Hono
│           └── express.ts    → [Planned] Express middleware
│
├── core/             → @llmops/core — Shared types, Zod schemas, provider registry.
│   └── src/
│       ├── datalayer/        → ⚠️ BEING DECOMPOSED — Postgres-specific, moving to sdk/store/pg
│       └── ...
│
├── gateway/          → @llmops/gateway — AI Gateway. OpenAI-compatible proxy.
│                       Routes to 70+ providers. Emits TelemetryEvents.
│
├── app/              → @llmops/app — Dashboard UI (React + Hono).
│                       Reads from Store interface. Served at /llmops.
│
├── cli/              → @llmops/cli — CLI for migrations and utilities.

docs/                 → Fumadocs site (https://llmops.build/docs)
examples/             → Example apps
```

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js
- **Package manager:** pnpm (workspace monorepo)
- **Build:** tsconfig with project references
- **Framework compatibility:** Hono (primary), Express (planned)
- **Dashboard:** React
- **Docs:** Fumadocs
- **Linting:** ESLint (see eslint.config.js)
- **Formatting:** Prettier (see .prettierrc)
- **Versioning:** bump.config.ts

## How to Work on This Project

```bash
pnpm install                    # Install all workspace dependencies
pnpm build                      # Build all packages
pnpm dev                        # Dev mode
pnpm lint                       # Lint
pnpm format                     # Format with Prettier
```

Test changes by running the examples in `examples/`.

## Architecture Principles

1. **UNIX philosophy.** Each package does one thing. Compose via interfaces, not inheritance.
2. **Adoption-first.** `llmops()` with zero args must work. Every feature is opt-in.
3. **TypeScript-first.** Strict generics. Compile-time enforcement. No `any`.
4. **Store vs Sink.** A `Store` reads and writes (powers the dashboard). A `Sink` only writes (ships telemetry elsewhere). Both implement `emit()`.
5. **Framework-agnostic.** The SDK doesn't depend on Hono or Express. Middleware adapters are subpath exports.
6. **No Postgres in core.** All SQL lives in `sdk/src/store/`. `@llmops/core` has zero database imports.
7. **One SDK, many entrypoints.** Stores, sinks, evals, and middleware are subpath exports of `@llmops/sdk`, not separate packages. Heavy deps (pg, better-sqlite3, @opentelemetry) are peerDependencies.

---

## Primitives

### AI Gateway

**Status:** Shipped
**Package:** `@llmops/gateway`

OpenAI-compatible API that routes to 70+ LLM providers. Drop-in replacement — change the base URL and it works with any OpenAI SDK client.

```ts
import { llmops } from '@llmops/sdk'
import { createOpenAI } from '@ai-sdk/openai'

const ops = llmops()
const openai = createOpenAI(ops.provider())

// Routes to any provider: @google/gemini-2.5-flash, anthropic/claude-sonnet, etc.
const result = await streamText({
  model: openai.chat('@google/gemini-2.5-flash'),
  prompt: 'Hello',
})
```

Provider config with custom slugs:

```ts
const ops = llmops({
  providers: {
    'openai-prod': { type: 'openai', apiKey: process.env.OPENAI_API_KEY },
    'anthropic-dev': { type: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY },
  },
})
```

### Dashboard

**Status:** Shipped
**Package:** `@llmops/app`

Auto-served React dashboard at `/llmops`. Shows request logs, cost tracking (per-model breakdown), latency, token usage. Currently reads from the datalayer in `@llmops/core` — being refactored to read from the `Store` interface.

```ts
import { createLLMOpsMiddleware } from '@llmops/sdk/hono'
// or
import { createLLMOpsMiddleware } from '@llmops/sdk/express'

const middleware = createLLMOpsMiddleware(llmopsClient)
app.use('/llmops', middleware)
```

The middleware receives the `llmopsClient` instance, which carries the telemetry config. The dashboard reads from whatever `Store` is configured in `telemetry` — it calls `store.queryRequests()`, `store.queryCosts()`, `store.queryTimeseries()`. It does NOT import any database driver directly.

### Telemetry Bus [Planned]

**Status:** Planned — Stage 3 of decoupling
**Package:** `@llmops/sdk` (internal)

Fan-out emitter. When `telemetry` is an array, every event is sent to all destinations via `Promise.allSettled`. One sink failing does not block others.

```ts
import { pgStore } from '@llmops/sdk/store/pg'
import { otelSink } from '@llmops/sdk/sink/otel'

const ops = llmops({
  telemetry: [
    pgStore(process.env.DATABASE_URL),
    otelSink({ endpoint: 'http://collector:4318' }),
  ]
})
```

The bus exposes `getStore()` which returns the first `Store` in the array — this is what the dashboard reads from.

### Store Interface [Planned]

**Status:** Planned — Stage 1 of decoupling
**Package:** `@llmops/sdk/types`

Read + write contract. Implementations power the dashboard.

```ts
interface Sink {
  emit(event: TelemetryEvent): Promise<void>
  flush?(): Promise<void>
  shutdown?(): Promise<void>
}

interface Store extends Sink {
  queryRequests(filters: RequestFilters): Promise<RequestLog[]>
  queryCosts(filters: CostFilters): Promise<CostSummary>
  queryTimeseries(filters: TimeseriesFilters): Promise<TimeseriesPoint[]>
  migrate(): Promise<void>
}
```

Type guard:

```ts
function isStore(dest: Store | Sink): dest is Store {
  return 'queryRequests' in dest
}
```

Config type:

```ts
type TelemetryConfig = Store | Sink | Array<Store | Sink>
```

### Postgres Store

**Status:** Shipped (extracted from `@llmops/core/datalayer`)
**Import:** `@llmops/sdk/store/pg`
**Peer dep:** `pg`

All Postgres-specific SQL lives here. Implements `Store`. Handles migrations.

```ts
import { pgStore } from '@llmops/sdk/store/pg'

const ops = llmops({
  telemetry: pgStore(process.env.DATABASE_URL)
})
```

### SQLite Store [Planned]

**Status:** Planned
**Import:** `@llmops/sdk/store/sqlite`
**Peer dep:** `better-sqlite3`

Local dev story. Zero external infrastructure. Same `Store` interface, SQLite dialect.

```ts
import { sqliteStore } from '@llmops/sdk/store/sqlite'

const ops = llmops({
  telemetry: sqliteStore('./llmops.db')
})
```

### OTel Sink [Planned]

**Status:** Planned
**Import:** `@llmops/sdk/sink/otel`
**Peer dep:** `@opentelemetry/*`

Write-only. Ships telemetry to any OpenTelemetry collector. Buffers and batch-exports via OTLP/HTTP. Maps `TelemetryEvent` to OTel spans following GenAI semantic conventions.

```ts
import { pgStore } from '@llmops/sdk/store/pg'
import { otelSink } from '@llmops/sdk/sink/otel'

const ops = llmops({
  telemetry: [
    pgStore(process.env.DATABASE_URL),
    otelSink({ endpoint: 'http://collector:4318' }),
  ]
})
```

### Scorer [Planned]

**Status:** Planned
**Package:** `@llmops/sdk/eval`

A scorer is a pure function that takes an input/output pair and returns a numeric score. No framework coupling. No side effects beyond the score.

```ts
import { scorer } from '@llmops/sdk/eval'

const tone = scorer({
  name: 'tone-check',
  score: async (input, output) => {
    return output.includes('sorry') ? 0.2 : 0.9
  }
})
```

Scorers are typed with generics. The `input` and `output` types are inferred from the dataset/task they're used with. Each scorer invocation emits a telemetry event (spans flow through the telemetry bus).

### Judge Scorer [Planned]

**Status:** Planned
**Package:** `@llmops/sdk/eval/judge`

LLM-as-judge. Uses the llmops gateway to call an LLM that scores the output. The judge call itself is traced through the same telemetry pipeline.

```ts
import { judgeScorer } from '@llmops/sdk/eval/judge'

const accuracy = judgeScorer({
  name: 'factual-accuracy',
  model: 'openai/gpt-4o',
  prompt: `Rate factual accuracy of this response: {{output}}
           Given this input: {{input}}
           Score 0-1.`,
  ops  // llmops instance — judge call is routed through the gateway and traced
})
```

### Dataset [Planned]

**Status:** Planned
**Package:** `@llmops/sdk/eval`

A typed collection of test cases. Just data — no behavior.

```ts
import { dataset } from '@llmops/sdk/eval'

const ds = dataset({
  name: 'support-bot-v2',
  items: [
    { input: 'How do I reset my password?', expected: 'Go to settings...' },
    { input: 'What are your hours?', expected: 'We are open 9-5...' },
  ]
})
```

Datasets can also be loaded from CSV, JSONL, or fetched from a Store.

### Experiment [Planned]

**Status:** Planned
**Package:** `@llmops/sdk/eval`

Runs scorers against a dataset using a task function. Results flow through the telemetry bus to whatever stores/sinks are configured. The dashboard visualizes experiment results.

```ts
import { experiment } from '@llmops/sdk/eval'

const results = await experiment({
  name: 'support-bot-march',
  dataset: ds,
  scorers: [tone, accuracy],
  task: async (item) => {
    const res = await generateText({ model: openai.chat('gpt-4o'), prompt: item.input })
    return res.text
  },
  telemetry: ops.telemetry
})
```

Supports `variants` for side-by-side model/prompt comparison:

```ts
await experiment({
  name: 'model-comparison',
  dataset: ds,
  scorers: [latency, cost, accuracy],
  variants: [
    { name: 'gpt-4o', task: (item) => generateText({ model: openai('gpt-4o'), prompt: item.input }) },
    { name: 'claude-sonnet', task: (item) => generateText({ model: anthropic('claude-sonnet'), prompt: item.input }) },
  ],
  telemetry: ops.telemetry
})
```

This is the code-first replacement for the playground UI. The playground becomes a visual experiment builder on top of these same primitives.

---

## Deprecations

### Prompt Management — Deprecated

The prompt versioning system (`x-llmops-prompt` header, prompt tables, prompt UI in dashboard) is being removed. Prompts belong in code, not in a database.

Do NOT build new features on top of prompt management. Do NOT add new prompt-related tables or queries. The playground UI will be refactored into an experiment runner once `@llmops/sdk/eval` ships.

---

## Active Refactor: Datalayer Decomposition

The `packages/core/src/datalayer/` directory contains Postgres-specific SQL that handles both writes (gateway logging) and reads (dashboard queries). This is being decomposed:

1. **All INSERT/write logic** → moves to `sdk/src/store/pg.ts` `emit()` method
2. **All SELECT/read logic** → moves to `sdk/src/store/pg.ts` query methods (queryRequests, queryCosts, queryTimeseries)
3. **Migration DDL** → moves to `sdk/src/store/pg.ts` `migrate()` method
4. **`@llmops/core`** retains only types, Zod schemas, and provider registry. Zero SQL. Zero `pg` imports.

The `database` config option in `llmops()` is deprecated. Use `telemetry: pgStore(...)` instead.

When working on the datalayer:
- Do NOT add new SQL to `@llmops/core`
- Do NOT add new direct database imports to `@llmops/gateway` or `@llmops/app`
- Every database interaction goes through the `Store` or `Sink` interface

---

## Subpath Exports

Everything ships from `@llmops/sdk`. One package, multiple entrypoints via package.json `exports` map:

```json
{
  "exports": {
    ".":            "./dist/index.js",
    "./store/pg":   "./dist/store/pg.js",
    "./store/sqlite": "./dist/store/sqlite.js",
    "./sink/otel":  "./dist/sink/otel.js",
    "./eval":       "./dist/eval/index.js",
    "./eval/judge": "./dist/eval/judge.js",
    "./types":      "./dist/types/index.js",
    "./hono":       "./dist/middleware/hono.js",
    "./express":    "./dist/middleware/express.js"
  }
}
```

```
@llmops/sdk              → Main entry: llmops(), provider config
@llmops/sdk/store/pg     → pgStore() — peer dep: pg
@llmops/sdk/store/sqlite → [Planned] sqliteStore() — peer dep: better-sqlite3
@llmops/sdk/sink/otel    → [Planned] otelSink() — peer dep: @opentelemetry/*
@llmops/sdk/eval         → [Planned] scorer, dataset, experiment
@llmops/sdk/eval/judge   → [Planned] judgeScorer
@llmops/sdk/types        → [Planned] Store, Sink, TelemetryEvent
@llmops/sdk/hono         → Hono middleware
@llmops/sdk/express      → [Planned] Express middleware
```

Stores and sinks use `peerDependencies` for their heavy deps (`pg`, `better-sqlite3`, `@opentelemetry/*`). This way importing `@llmops/sdk/store/pg` requires the user to have `pg` installed, but `@llmops/sdk` alone pulls in nothing extra.

---

## Code Conventions

- Strict TypeScript. No `any`. Use generics and inference.
- Functions over classes. Factory functions that return typed objects.
- Prefer `interface` for contracts, `type` for unions and intersections.
- Named exports only. No default exports.
- Error handling: use `Promise.allSettled` for fan-out. Never let one sink crash the gateway.
- Tests: colocate test files as `*.test.ts` next to source.
