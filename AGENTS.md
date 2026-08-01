# AGENTS.md

## What This Is

LLMOps is an open-source, pluggable LLMOps toolkit for TypeScript. One SDK that gives you an AI gateway, observability, and evals for every LLM call. UNIX philosophy — each piece does one thing well and composes via typed interfaces.

Website: https://llmops.build
License: Apache 2.0

## Monorepo Structure

```
packages/
├── sdk/              → @llmops/sdk — Public API. Entry point for everything.
│   ├── telemetry/    → TelemetryStore interface + Postgres store (raw pg, no ORM)
│   ├── store/        → pg, d1, sqlite store implementations + migrations
│   ├── eval/         → evaluate(), judgeScorer(), compare()
│   ├── types/        → TelemetryStore type export
│   └── lib/          → Hono, Express, Next.js middleware adapters
├── core/             → @llmops/core — Shared types, Zod schemas, provider registry. Zero database code.
├── gateway/          → @llmops/gateway — AI Gateway. OpenAI-compatible in-process plug.
├── app/              → @llmops/app — Dashboard UI (React + Hono). Workers-compatible.
└── cli/              → @llmops/cli — CLI for migrations and evals.

docs/                 → Fumadocs site (https://llmops.build/docs)
examples/             → Example apps (eval, express, hono, langchain, nextjs)
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
3. **TypeScript-first.** Strict generics. Compile-time enforcement. Prefer `unknown` over `any` in new code; avoid introducing `any` unless an existing package convention requires it.
4. **Code-first.** Everything configurable from code. No database-managed configs.
5. **Framework-agnostic.** The SDK doesn't depend on Hono or Express. Middleware adapters are subpath exports.
6. **No database code in core.** All SQL lives in `sdk/src/telemetry/` and `sdk/src/store/`. `@llmops/core` has zero database imports. Zero Kysely.
7. **One SDK, many entrypoints.** Stores, evals, and middleware are subpath exports of `@llmops/sdk`, not separate packages. Heavy deps (pg, better-sqlite3) are peerDependencies.
8. **Edge-compatible.** The main SDK bundle has no `require()`, no `fileURLToPath`, no `node:fs`. Store subpaths are isolated — Workers never load the pg store.

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

## Code Conventions

- Strict TypeScript. Prefer `unknown` over `any` in new code; avoid introducing `any` unless an existing package convention requires it. Use generics and inference.
- Functions over classes. Factory functions that return typed objects.
- Prefer `interface` for contracts, `type` for unions and intersections.
- Prefer named exports. Avoid introducing default exports unless an existing package convention (e.g., Hono app modules, tsqx config files) requires them.
- Error handling: use `Promise.allSettled` for fan-out. Never let one sink crash the gateway.
- No `require()` in any bundle that may run on edge. Use dynamic `import()` for Node-only modules.
- No `fileURLToPath` or `node:fs` at module level in app/SDK. Use lazy loading for dev-only paths.
- `.sql` files inlined at build time via rolldown plugin. No runtime file I/O.
