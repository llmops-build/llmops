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
