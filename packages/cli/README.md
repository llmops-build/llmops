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
| `--minScore` | `-m` | Fail if an evaluator's mean score is below a threshold. Format: `"evaluator=threshold[,evaluator=threshold...]"`. Thresholds must be finite and in `[0, 1]` |
| `--baseline` | `-b` | Directory of baseline eval results (e.g. a previous run's `--outputDir`) to check for score regressions |
| `--maxRegression` | `-r` | Max allowed drop in an evaluator's mean score vs `--baseline` before failing. Requires `--baseline`. Must be finite and in `[0, 1]`. Default: `0` (no regression allowed) |

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

- `0` — every eval ran, the gate performed at least one check, and every check passed
- `1` — the run could not be gated: an eval file failed to run, or the configuration was invalid (bad `--minScore` spec, out-of-range threshold, `--baseline` missing, unreadable, or containing no results)
- `2` — every eval ran, but a gate check failed

#### The gate fails closed

A gate reports success only when it actually verified something. These all **fail** rather than passing quietly:

- an evaluator named in `--minScore` that appears in no result (typo, renamed evaluator)
- a baseline eval with no matching eval in the current run (renamed or deleted eval)
- an eval that recorded datapoint or evaluator errors — a failed datapoint scores 0 and can otherwise drag a mean into looking fine, or be excluded and make it look better than it is
- a gate that ended up performing zero checks

Invalid configuration is deliberately separated from a failed gate: `1` means "this gate could not be trusted to run", `2` means "it ran and something regressed". Configuration is validated up front, before any eval executes, so a typo does not cost a full (and possibly paid) eval run.

#### JSON output

With `--json`, stdout stays a single parseable JSON document. Without any gate flags it's the eval result(s), unchanged. With `--minScore` and/or `--baseline` set, it's wrapped as `{ "results": ..., "gate": { "passed": boolean, "checks": [...] } }` — safe to pipe to `jq` either way. Each entry in `checks` carries its `type` (`min-score`, `regression`, `baseline-missing`, `errors`), the numbers behind the verdict, and a `message` when it failed closed.

The gate itself is also available as a plain function for use outside the CLI — see `applyGate()` in `@llmops/sdk/eval`, which throws on invalid configuration and returns the same `checks` array.
