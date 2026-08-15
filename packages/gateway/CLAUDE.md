# @llmops/gateway

A tiny, in-process AI gateway — **a plug, not a proxy**. A pure `(req: Request) => Promise<Response>` handler that runs inside your process (Node / Workers / Deno / Bun). Pass-through by default; **zero runtime dependencies** in the core.

**Status: active.** The zero-dependency core is complete: routing (`resolveTarget`), pass-through execution, telemetry instrumentation, and OpenAI-compatible error responses are all implemented. Built-in adapters are added incrementally; divergent providers require an explicit adapter via `config.adapters` until a dedicated one lands.

## Conventions
- Pure functions, composition, **no classes**.
- **Web APIs only** — `Request`/`Response`/`fetch`/`ReadableStream`. No Hono, no server.
- `import type` from `@llmops/core` only (never a runtime edge).
- Pass-through is the absence of a transform on an `EndpointConfig`.
- Hard providers (Bedrock SigV4, Vertex OAuth) will be **opt-in subpaths** with optional peer deps, so the core stays zero-dep.

Design adopted from the `gateway-v2` branch. Full plan: `~/.claude/plans/for-the-gateway-i-snappy-cherny.md`.
