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
│       ├── index.ts          → llmops() client, provider config
│       ├── telemetry/
│       │   ├── interface.ts  → TelemetryStore interface
│       │   ├── pg-store.ts   → pgStore() — Postgres store (raw pg, no ORM)
│       │   ├── types.ts      → Zod schemas for inserts (LLMRequestInsert, TraceUpsert, etc.)
│       │   └── constants.ts  → COST_SUMMARY_GROUP_BY
│       ├── store/
│       │   ├── pg.ts         → pgStore() barrel export + migration runner
│       │   ├── pg/           → Postgres schema files (.sql), tsqx config, migrations
│       │   ├── d1.ts         → d1Store() barrel export — Cloudflare D1
│       │   ├── d1/           → D1 store implementation, SQLite schema, migrations
│       │   ├── sqlite.ts     → sqliteStore() barrel export — local SQLite
│       │   └── sqlite/       → SQLite store implementation, migrations
│       ├── eval/
│       │   ├── index.ts      → exports: evaluate, compare, judgeScorer
│       │   ├── evaluate.ts   → evaluate() — run evaluators against datasets
│       │   ├── judge.ts      → judgeScorer() — LLM-as-judge evaluator factory
│       │   ├── compare.ts    → compare() — diff two eval runs
│       │   ├── dataset.ts    → EvaluationDataset interface + InlineDataset
│       │   └── types.ts      → Datapoint, Evaluator, Executor, EvaluateResult types
│       ├── types/
│       │   └── index.ts      → TelemetryStore type export
│       └── lib/
│           ├── hono/         → createLLMOpsMiddleware for Hono
│           ├── express/      → createLLMOpsMiddleware for Express
│           └── nextjs/       → toNextJsHandler adapter
│
├── core/             → @llmops/core — Shared types, Zod schemas, provider registry.
│                       Zero database code. Zero SQL. 223KB bundle.
│
├── gateway/          → @llmops/gateway — AI Gateway. OpenAI-compatible proxy.
│                       Routes to 70+ providers. Workers-compatible (no createRequire).
│
├── app/              → @llmops/app — Dashboard UI (React + Hono).
│                       Workers-compatible (no top-level Node.js imports).
│                       Reads from TelemetryStore. Served at /llmops.
│
├── cli/              → @llmops/cli — CLI for migrations and evals.
│                       `npx @llmops/cli eval` / `npx @llmops/cli migrate`

docs/                 → Fumadocs site (https://llmops.build/docs)
examples/             → Example apps (hono, express, nextjs, langchain, eval, cloudflare-worker)
```

## Tech Stack

- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js + Cloudflare Workers
- **Package manager:** pnpm (workspace monorepo)
- **Build:** tsdown (rolldown-based bundler)
- **Linting/Formatting:** Biome
- **Framework compatibility:** Hono, Express, Next.js
- **Dashboard:** React + Vanilla Extract CSS
- **Docs:** Fumadocs
- **SQL:** Raw pg/SQLite (no ORM). Schema managed by tsqx.
- **Versioning:** bump.config.ts

## How to Work on This Project

```bash
pnpm install                    # Install all workspace dependencies
pnpm build                      # Build all packages
pnpm dev                        # Dev mode
```

Test changes by running the examples in `examples/`.

Run evals: `cd examples/eval && npx @llmops/cli eval`

## Architecture Principles

1. **UNIX philosophy.** Each package does one thing. Compose via interfaces, not inheritance.
2. **Adoption-first.** `llmops()` with zero args must work. Every feature is opt-in.
3. **TypeScript-first.** Strict generics. Compile-time enforcement. No `any`.
4. **Code-first.** Everything configurable from code. No database-managed configs.
5. **Framework-agnostic.** The SDK doesn't depend on Hono or Express. Middleware adapters are subpath exports.
6. **No database code in core.** All SQL lives in `sdk/src/telemetry/` and `sdk/src/store/`. `@llmops/core` has zero database imports. Zero Kysely.
7. **One SDK, many entrypoints.** Stores, evals, and middleware are subpath exports of `@llmops/sdk`, not separate packages. Heavy deps (pg, better-sqlite3) are peerDependencies.
8. **Edge-compatible.** The main SDK bundle has no `require()`, no `fileURLToPath`, no `node:fs`. Store subpaths are isolated — Workers never load the pg store.

---

## Primitives

### AI Gateway

**Status:** Shipped
**Package:** `@llmops/gateway`

OpenAI-compatible API that routes to 70+ LLM providers. Drop-in replacement — change the base URL and it works with any OpenAI SDK client. Providers auto-detected from environment variables.

```ts
import { llmops } from '@llmops/sdk'
import OpenAI from 'openai'

const client = llmops()
const openai = new OpenAI(client.provider())

// Routes to any provider: @openai/gpt-4o, @anthropic/claude-sonnet, @google/gemini-2.5-flash
const response = await openai.chat.completions.create({
  model: '@openai/gpt-4o',
  messages: [{ role: 'user', content: 'Hello' }],
})
```

### Dashboard

**Status:** Shipped
**Package:** `@llmops/app`

Auto-served React dashboard at `/llmops`. Shows request logs, cost tracking (per-model breakdown), latency, token usage, and traces. Workers-compatible — no top-level Node.js imports. Uses embedded assets in production (no filesystem I/O).

```ts
import { createLLMOpsMiddleware } from '@llmops/sdk/hono'

const middleware = createLLMOpsMiddleware(client)
app.use('/llmops/*', middleware)
```

### Telemetry Store

**Status:** Shipped
**Package:** `@llmops/sdk/telemetry`

The `TelemetryStore` interface defines read + write methods for telemetry data. Every LLM call through the gateway automatically creates a trace with a single span.

```ts
interface TelemetryStore {
  batchInsertRequests(requests: LLMRequestInsert[]): Promise<{ count: number }>
  listRequests(params?: ...): Promise<{ data; total; limit; offset }>
  getTotalCost(params: ...): Promise<...>
  getCostSummary(params: ...): Promise<...>
  upsertTrace(data: TraceUpsert): Promise<void>
  batchInsertSpans(spans: SpanInsert[]): Promise<{ count: number }>
  listTraces(params?: ...): Promise<{ data; total; limit; offset }>
  getTraceWithSpans(traceId: string): Promise<...>
  // ... and more
}
```

### Postgres Store

**Status:** Shipped
**Import:** `@llmops/sdk/store/pg`
**Peer dep:** `pg`

Raw SQL with `pg.Pool` — no Kysely, no ORM. Schema managed by tsqx. Connection string validated with Zod. Migrations run automatically or via CLI.

```ts
import { pgStore } from '@llmops/sdk/store/pg'

const client = llmops({
  telemetry: pgStore(process.env.DATABASE_URL),
})
```

### SQLite Store

**Status:** Shipped
**Import:** `@llmops/sdk/store/sqlite`
**Peer dep:** `better-sqlite3` (optional, falls back to `node:sqlite` on Node 22+)

Zero-config local dev. Same SQL dialect as D1. WAL mode enabled automatically.

```ts
import { sqliteStore } from '@llmops/sdk/store/sqlite'

const client = llmops({
  telemetry: sqliteStore('./llmops.db'),
})
```

### Cloudflare D1 Store

**Status:** Shipped
**Import:** `@llmops/sdk/store/d1`

For Cloudflare Workers. Uses D1 binding API. Batch operations chunked at 100 statements. JSON columns parsed on read.

```ts
import { d1Store } from '@llmops/sdk/store/d1'

export default {
  async fetch(request, env, ctx) {
    const client = llmops({
      telemetry: d1Store(env.DB),
      waitUntil: ctx.waitUntil.bind(ctx),
    })
  }
}
```

### Edge Runtime Support

**Status:** Shipped

The `waitUntil` config option enables background telemetry flushing on edge runtimes (Cloudflare Workers, Vercel Edge). Without it, `setInterval`-based batching is used (Node.js default).

```ts
const client = llmops({
  telemetry: d1Store(env.DB),
  waitUntil: ctx.waitUntil.bind(ctx),  // Workers: flush after response
})
```

### Evals

**Status:** Shipped
**Import:** `@llmops/sdk/eval`

Code-first evals. Three primitives: `evaluate()`, `judgeScorer()`, `compare()`. Results stored as JSON files in the project — version-controllable, diffable.

```ts
import { evaluate, judgeScorer } from '@llmops/sdk/eval'

const result = await evaluate({
  name: 'support-bot',
  data: [
    { data: { question: 'Reset password?' }, target: { answer: 'Go to settings...' } },
  ],
  executor: async (data) => { /* your LLM call */ },
  evaluators: {
    exact: (output, target) => output === target?.answer ? 1 : 0,
    accuracy: judgeScorer({
      model: '@openai/gpt-4o',
      prompt: 'Rate accuracy. Expected: {{target.answer}} Actual: {{output}}',
      client,
    }),
  },
})
```

**CLI runner:** `npx @llmops/cli eval` finds and runs `*.eval.ts` files. Bundles with esbuild, streams results as each datapoint completes.

**judgeScorer features:**
- System/user message separation (default system message instructs JSON scoring)
- Temperature 0 by default for deterministic scoring
- Retry on parse failure (`maxRetries` option)
- Score clamping to [0, 1]
- `{{output}}`, `{{target.*}}`, `{{data.*}}` template interpolation

**compare()** diffs two eval result JSON files:
```ts
const diff = await compare({
  files: ['./llmops-evals/v1.json', './llmops-evals/v2.json'],
})
```

### OTel Sink [Planned]

**Status:** Planned
**Import:** `@llmops/sdk/sink/otel`

Write-only. Ships telemetry to any OpenTelemetry collector.

---

## SQL & Migrations

All SQL is raw — no ORM, no query builder. Schema files managed by tsqx for migration diffing.

**Postgres:** Raw `pg.Pool.query()` with inline SQL in `sdk/src/telemetry/pg-store.ts`.

**SQLite/D1:** Same SQL dialect. `.sql` query files in `sdk/src/store/pg/queries/` inlined at build time by a rolldown plugin.

**tsqx:** Dev-only tool (`@tsqx/kit`, `@tsqx/cli`) for schema diffing and migration generation. Schema files in `store/*/schema/*.sql`, migrations in `store/*/migrations/`. Generated files (types, query functions) are gitignored — only schema and migrations are committed.

**Migration runner:** Each store has its own: `runMigrations(pool, schema)` for Postgres, `runD1Migrations(db)` for D1, `runSQLiteMigrations(db)` for SQLite. Tracks applied migrations in `_llmops_migrations` table.

---

## Subpath Exports

Everything ships from `@llmops/sdk`. One package, multiple entrypoints:

```
@llmops/sdk              → Main entry: llmops(), provider config, telemetry types
@llmops/sdk/store/pg     → pgStore() — peer dep: pg
@llmops/sdk/store/sqlite → sqliteStore() — peer dep: better-sqlite3
@llmops/sdk/store/d1     → d1Store() — Cloudflare D1 (no peer dep)
@llmops/sdk/eval         → evaluate(), judgeScorer(), compare()
@llmops/sdk/types        → TelemetryStore type
@llmops/sdk/hono         → Hono middleware
@llmops/sdk/express      → Express middleware
@llmops/sdk/nextjs       → Next.js route handler adapter
@llmops/sdk/agents       → OpenAI Agents SDK tracing exporter
```

Stores use `peerDependencies` for heavy deps. The main SDK entry has zero Node.js built-ins — safe for Workers bundling.

---

## Code Conventions

- Strict TypeScript. No `any`. Use generics and inference.
- Functions over classes. Factory functions that return typed objects.
- Prefer `interface` for contracts, `type` for unions and intersections.
- Named exports only. No default exports.
- Error handling: use `Promise.allSettled` for fan-out. Never let one sink crash the gateway.
- No `require()` in any bundle that may run on edge. Use dynamic `import()` for Node-only modules.
- No `fileURLToPath` or `node:fs` at module level in app/SDK. Use lazy loading for dev-only paths.
- `.sql` files inlined at build time via rolldown plugin. No runtime file I/O.
