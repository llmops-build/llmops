# Eval Example

Run evaluations using the LLMOps CLI.

## Setup

```bash
pnpm install
```

## Run all evals

```bash
pnpm eval
```

## Run a specific eval

```bash
npx @llmops/cli eval -t evals/support-bot.eval.ts
```

## JSON output (for CI)

```bash
pnpm eval:json
```

The command writes only valid JSON to stdout in this mode, so it can be piped
directly to tools such as `jq`.

## CI regression gates

Use `--minScore` and `--baseline` to turn a run into a pass/fail gate for pull-request CI —
no LLM API keys required if your evaluators are deterministic (see `support-bot.eval.ts`).

```bash
# Fail if an evaluator's mean score drops below a threshold
npx @llmops/cli eval --minScore "exactMatch=0.8"

# Fail if any evaluator regresses vs a checked-in (or artifact-downloaded) baseline
npx @llmops/cli eval --baseline ./llmops-evals-baseline

# Allow a small tolerance on regressions instead of an exact match
npx @llmops/cli eval --baseline ./llmops-evals-baseline --maxRegression 0.02
```

Exit code `0` means the gate ran and every check passed, `2` means a check failed, and `1`
means the run could not be gated at all — an eval failed to run, or the configuration was
invalid. A CI step can branch on the exit code directly:

```yaml
- name: Run eval gate
  run: npx @llmops/cli eval --minScore "exactMatch=0.8" --baseline ./llmops-evals-baseline
```

The gate fails closed: a threshold naming an evaluator that never ran, a baseline eval with
no counterpart in this run, an evaluator the baseline scored that this run dropped, an eval
that recorded errors, or a gate that checked nothing all fail rather than passing quietly.
Evaluators that only exist in the current run count as new coverage and pass. Thresholds and
`--maxRegression` must be finite values in `[0, 1]`, and are validated before any eval executes.

With `--json`, the gate result is embedded alongside the eval results as
`{ "results": ..., "gate": { "passed": true, "checks": [...] } }`, so an agent or script can
inspect exactly which evaluator failed and by how much instead of only seeing the exit code.

## Evaluate production traffic

Every telemetry store can turn persisted requests into the same dataset shape
accepted by `evaluate()`:

```ts
import { evaluate } from '@llmops/sdk/eval';
import { pgStore } from '@llmops/sdk/store/pg';

const store = pgStore(process.env.POSTGRES_URL!);
const data = store.dataset({
  provider: 'openai',
  since: '7d',
  limit: 100,
  map: (request) => ({
    data: request.input,
    target: request.output,
    metadata: {
      requestId: request.requestId,
      model: request.model,
      cost: request.cost,
    },
  }),
});

await evaluate({
  name: 'production-regression',
  data,
  executor: async (input) => runCandidate(input),
  evaluators: {
    // Add deterministic or judge-based scorers here.
  },
});
```

Relative `since` values support minutes, hours, days, and weeks (`30m`, `24h`,
`7d`, `2w`). An absolute ISO timestamp also works.

## Results

Results are saved as JSON files in `./llmops-evals/`:

```
llmops-evals/
├── support-bot/
│   └── <run-id>.json
└── model-comparison/
    ├── model-comparison/concise-model/<run-id>.json
    └── model-comparison/verbose-model/<run-id>.json
```
