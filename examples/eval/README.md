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
npx @llmops/cli eval evals/support-bot.eval.ts
```

## JSON output (for CI)

```bash
pnpm eval:json
```

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
