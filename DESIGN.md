# LLMOps — Architecture Spine

> How three primitives — **gateway**, **telemetry**, **evals** — stay *individually useful* and *compatible* at the same time.

## The thesis

Each primitive must pass two tests:

1. **Individually useful** — `npm install`, use just this one, derive real value, zero config from the others.
2. **Compatible** — when you combine them, each makes the others better, with no glue code.

These pull in opposite directions ("useful alone" wants decoupling; "compatible" wants shared glue). The resolution is a single rule:

> **Primitives never import each other's implementations. They compose through (1) typed interfaces in `@llmops/core` and (2) standard wire formats (OTLP, the OpenAI API, gen_ai semconv).**

If primitive A needs B, A depends on an *interface* that B satisfies — never B itself. The `llmops()` client is the one **composition root** that injects a concrete implementation (a store) wherever an interface is required.

## The dependency graph

```
                         @llmops/core   (packages/core/src/{telemetry,eval})
       TelemetrySink · TelemetryReader · TelemetryStore · TelemetryEvent
                        Datapoint · EvaluationDataset
            ▲                      ▲                          ▲
            │                      │                          │
         gateway                 evals                store impls (pg · sqlite · d1)
      imports Sink         imports Sink + Dataset      implement Sink + Reader
```

Nothing on the bottom row imports a sibling. Arrows point *up*, into `core` only.

## The DX it buys (write the code you wish existed)

**Standalone — each primitive knows nothing of the others:**

```ts
// gateway only — multi-provider proxy
const ops = llmops();
new OpenAI(ops.provider());

// telemetry only — HEADLESS: no dashboard process, no gateway
const ops = llmops({ telemetry: pgStore(url) });
const openai = ops.observe(new OpenAI());                    // every call auto-traced
await ops.trace('job', async (s) => s.record({ model, input, output, usage }));

// evals only — JSON files, zero deps
await evaluate({ name, data: [...], executor, evaluators });
```

**Composed — the payoff:**

```ts
// gateway + telemetry — automatic, no extra code
const ops = llmops({ telemetry: pgStore(url) });
new OpenAI(ops.provider());                                  // every call → a trace

// telemetry → evals — production traffic IS the eval set
await evaluate({
  name: 'prod-regression',
  data: ops.telemetry.dataset({ model: '@openai/gpt-4o', since: '7d', map }),
  executor,
  evaluators,
});

// evals → telemetry — eval runs show up next to prod traffic
await evaluate({ name, data, executor, evaluators, telemetry: ops.telemetry });
```

## The contracts

Two verbs — **emit** (write) and **query** (read) — everything composes from those.

| Contract | File | Who depends on it |
|---|---|---|
| `TelemetryEvent`, `*Record`, `TokenUsage` | `telemetry/events.ts` | the wire format — producers build, sinks consume |
| `TelemetrySink` | `telemetry/sink.ts` | gateway, evals, `ops.observe/trace` (**write only**) |
| `TelemetryReader` | `telemetry/reader.ts` | dashboard, dataset-bridge (**read only**) |
| `TelemetryStore = Sink & Reader` | `telemetry/store.ts` | pg / sqlite / d1 implement |
| `Datapoint`, `EvaluationDataset` | `eval/dataset.ts` | evals consume; telemetry produces via `reader.dataset()` |

### The two bridges that make it a *system*

- **traces → datasets:** `TelemetryReader.dataset(query)` returns an `EvaluationDataset` — production traffic becomes an eval set. `evaluate()` needs no special case because inline arrays already implement the same interface.
- **eval runs → traces:** `evaluate({ telemetry: sink })` emits a run + per-datapoint spans to a `TelemetrySink`, so eval runs land in the dashboard next to production, and `compare()` can diff them.

## Status & rollout

This commit lands the **contracts only** — interfaces, no implementations. It compiles in `core`; nothing imports it yet.

| Step | What |
|---|---|
| ✅ **1. Contracts** | `packages/core/src/{telemetry,eval}` + this doc |
| 2. Wire SDK | `@llmops/sdk` re-exports these; the existing `TelemetryStore` + insert schemas in the SDK are unified to derive from the core records |
| 3. Headless telemetry | move OTLP **ingestion** out of `@llmops/app` into the telemetry primitive behind a `TelemetrySink`; add `ops.observe()` / `ops.trace()` |
| 4. Gateway rewrite | new `executeRequest(req, { sink?: TelemetrySink })` — a pure proxy when `sink` is absent, emits `TelemetryEvent`s when present. **Never imports a store.** |
| 5. Eval bridges | implement `reader.dataset()` and `evaluate({ telemetry })` |

## What already exists (so this isn't from zero)

- `EvaluationDataset` / `Datapoint` already exist in `@llmops/sdk/eval` with the exact shape defined here — the original's own doc comment anticipates non-inline sources ("Future: CSVDataset, JSONLDataset, S3Dataset"). The telemetry dataset is just one more source.
- `TelemetryStore` already exists in `@llmops/sdk/telemetry`, already split by `// writes` / `// reads` comment blocks — step 2 turns that seam into a type.
- The current gateway already emits OTLP with **zero** imports of the store — the exemplar this whole spine generalizes.
