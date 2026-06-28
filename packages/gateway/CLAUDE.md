# @llmops/gateway

A tiny, in-process AI gateway — **a plug, not a proxy**. A pure `(req: Request) => Promise<Response>` handler that runs inside your process (Node / Workers / Deno / Bun). Pass-through by default; **zero runtime dependencies** in the core.

**Status: rewrite in progress.** The old Portkey fork was deleted. Step 1 (current) is the zero-dependency **foundation**: a hand-rolled `Result`, the `ProviderConfig` / `RequestType` types, the `ProviderAdapter` / `EndpointConfig` contract, header utilities, and OpenAI-compatible error responses. `createGateway()` is a placeholder (501) until routing, provider resolution, pass-through execution, and telemetry land in the next steps.

## Conventions
- Pure functions, composition, **no classes**.
- **Web APIs only** — `Request`/`Response`/`fetch`/`ReadableStream`. No Hono, no server.
- `import type` from `@llmops/core` only (never a runtime edge).
- Pass-through is the absence of a transform on an `EndpointConfig`.
- Hard providers (Bedrock SigV4, Vertex OAuth) will be **opt-in subpaths** with optional peer deps, so the core stays zero-dep.

Design adopted from the `gateway-v2` branch. Full plan: `~/.claude/plans/for-the-gateway-i-snappy-cherny.md`.
