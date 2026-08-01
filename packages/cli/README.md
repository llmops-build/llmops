<p align="center">
    <picture>
        <source srcset="https://github.com/llmops-build/llmops/raw/main/llmops-header-dark.png" media="(prefers-color-scheme: dark)">
        <source srcset="https://github.com/llmops-build/llmops/raw/main/llmops-header.png" media="(prefers-color-scheme: light)">
        <img src="https://github.com/llmops-build/llmops/raw/main/llmops-header.png" alt="LLMOps Header">
    </picture>
    <h2 align="center">
        LLMOps
    </h2>
</p>

## `llmops eval`

Runs `*.eval.ts` / `*.eval.js` files (see `@llmops/sdk/eval`) and saves results as JSON.

```bash
npx @llmops/cli eval [flags]
```

| Flag | Alias | Description |
| --- | --- | --- |
| `--target` | `-t` | File or directory to run. Default: `./evals` |
| `--outputDir` | `-o` | Output directory for results. Default: `./llmops-evals` |
| `--json` | `-j` | Output results as JSON to stdout |
| `--minScore` | `-m` | Fail if an evaluator's mean score is below a threshold. Format: `"evaluator=threshold[,evaluator=threshold...]"` |
| `--baseline` | `-b` | Directory of baseline eval results (e.g. a previous run's `--outputDir`) to check for score regressions |
| `--maxRegression` | `-r` | Max allowed drop in an evaluator's mean score vs `--baseline` before failing. Requires `--baseline`. Default: `0` (no regression allowed) |

### CI gates

`--minScore` and `--baseline` turn `eval` into a regression gate for CI:

```bash
# Fail if the accuracy evaluator's mean score drops below 0.8
npx @llmops/cli eval --minScore "accuracy=0.8"

# Fail if any evaluator regresses vs a baseline results directory
npx @llmops/cli eval --baseline ./llmops-evals-baseline

# Combine both, allowing a small tolerance on regressions
npx @llmops/cli eval --minScore "accuracy=0.8" --baseline ./llmops-evals-baseline --maxRegression 0.02
```

Exit codes are deterministic, so a CI step can gate on them directly:

- `0` — every eval ran and every gate check passed
- `1` — an eval file failed to run (bundle/execution error), or the flags were misconfigured (e.g. a bad `--minScore` spec, a missing `--baseline` directory)
- `2` — every eval ran, but a `--minScore` threshold or `--baseline` regression check failed

With `--json`, stdout stays a single parseable JSON document. Without any gate flags it's the eval result(s), unchanged. With `--minScore` and/or `--baseline` set, it's wrapped as `{ "results": ..., "gate": { "passed": boolean, "checks": [...] } }` — safe to pipe to `jq` either way.

The gate itself is also available as a plain function for use outside the CLI — see `applyGate()` in `@llmops/sdk/eval`.
