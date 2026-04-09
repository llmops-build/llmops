import { randomUUID } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { InlineDataset, type EvaluationDataset } from './dataset';
import type {
  Datapoint,
  DatapointResult,
  EvaluateOptions,
  EvaluateResult,
  Evaluator,
  Executor,
  ScoreStats,
  VariantEvaluateResult,
} from './types';

// ─── Concurrency pool ───────────────────────────────────────────────────────

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>,
) {
  const executing: Promise<void>[] = [];
  for (const item of items) {
    const p = fn(item).then(() => {
      executing.splice(executing.indexOf(p), 1);
    });
    executing.push(p);
    if (executing.length >= concurrency) await Promise.race(executing);
  }
  await Promise.all(executing);
}

// ─── Stats ──────────────────────────────────────────────────────────────────

function computeStats(values: number[]): ScoreStats {
  const valid = values.filter((v) => !Number.isNaN(v));
  if (valid.length === 0) {
    return { mean: 0, min: 0, max: 0, median: 0, count: 0 };
  }
  const sorted = [...valid].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

  return {
    mean: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    count: sorted.length,
  };
}

// ─── Single executor flow ───────────────────────────────────────────────────

async function runSingleExecutor<D, T, O>(
  dataset: EvaluationDataset<D, T>,
  executor: Executor<D, O>,
  evaluators: Record<string, Evaluator<O, T>>,
  concurrency: number,
): Promise<{ results: DatapointResult<D, O>[]; durationMs: number }> {
  const size = await dataset.size();
  const datapoints = await dataset.slice(0, size);
  const results: DatapointResult<D, O>[] = new Array(datapoints.length);
  const startTime = Date.now();

  await pool(datapoints, concurrency, async (dp) => {
    const idx = datapoints.indexOf(dp);
    const dpStart = Date.now();
    let output: O | null = null;
    let error: string | undefined;
    const scores: Record<string, number> = {};

    try {
      output = await executor(dp.data);
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    if (!error && output !== null) {
      for (const [name, evaluator] of Object.entries(evaluators)) {
        try {
          const result = await evaluator(output, dp.target, dp.data);
          if (typeof result === 'number') {
            scores[name] = result;
          } else {
            for (const [subKey, subScore] of Object.entries(result)) {
              scores[`${name}.${subKey}`] = subScore;
            }
          }
        } catch {
          scores[name] = NaN;
        }
      }
    }

    results[idx] = {
      data: dp.data,
      target: dp.target,
      metadata: dp.metadata,
      output: output as O,
      scores,
      durationMs: Date.now() - dpStart,
      error,
    };
  });

  return { results, durationMs: Date.now() - startTime };
}

// ─── Output ─────────────────────────────────────────────────────────────────

function printSummary(result: EvaluateResult) {
  const lines: string[] = [];
  lines.push('');
  lines.push(` ${result.name}`);
  lines.push('');

  const completed = result.count - result.errors;
  lines.push(
    ` ✓ ${completed}/${result.count} completed${result.errors > 0 ? `  ✗ ${result.errors} errors` : ''}`,
  );
  lines.push('');
  lines.push(' Scores:');

  for (const [name, stats] of Object.entries(result.scores)) {
    lines.push(
      `   ${name.padEnd(16)} mean=${stats.mean.toFixed(2)}  min=${stats.min.toFixed(2)}  max=${stats.max.toFixed(2)}  median=${stats.median.toFixed(2)}`,
    );
  }

  lines.push('');
  lines.push(` Duration: ${(result.durationMs / 1000).toFixed(1)}s`);
  lines.push(` Run ID:   ${result.runId}`);
  lines.push('');

  process.stderr.write(lines.join('\n'));
}

function saveResult(result: EvaluateResult, outputDir: string) {
  const dir = join(outputDir, result.name);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${result.runId}.json`);
  writeFileSync(filePath, JSON.stringify(result, null, 2));
}

// ─── evaluate() ─────────────────────────────────────────────────────────────

export async function evaluate<
  D = Record<string, unknown>,
  T = Record<string, unknown>,
  O = unknown,
>(
  options: EvaluateOptions<D, T, O>,
): Promise<EvaluateResult<D, O> | VariantEvaluateResult<D, O>> {
  const {
    name,
    data,
    executor,
    variants,
    evaluators,
    concurrency = 5,
    group,
    metadata,
    outputDir = process.env.LLMOPS_EVAL_OUTPUT_DIR || './llmops-evals',
  } = options;

  const runId = randomUUID();

  if (executor && variants) {
    throw new Error(
      'evaluate(): provide either executor or variants, not both',
    );
  }
  if (!executor && !variants) {
    throw new Error(
      'evaluate(): provide either executor or variants',
    );
  }

  const dataset = Array.isArray(data) ? new InlineDataset(data) : data;

  // ── Single executor ───────────────────────────────────────────────────
  if (executor) {
    const { results, durationMs } = await runSingleExecutor(
      dataset,
      executor,
      evaluators,
      concurrency,
    );

    // Aggregate scores
    const scoreNames = new Set<string>();
    for (const r of results) {
      for (const key of Object.keys(r.scores)) scoreNames.add(key);
    }

    const scores: Record<string, ScoreStats> = {};
    for (const scoreName of scoreNames) {
      scores[scoreName] = computeStats(
        results.map((r) => r.scores[scoreName] ?? NaN),
      );
    }

    const result: EvaluateResult<D, O> = {
      name,
      runId,
      group,
      scores,
      durationMs,
      count: results.length,
      errors: results.filter((r) => r.error).length,
      metadata,
      results,
    };

    if (process.env.LLMOPS_EVAL_OUTPUT === 'json') {
      process.stdout.write(JSON.stringify(result, null, 2));
    } else {
      printSummary(result);
    }

    saveResult(result, outputDir);
    return result;
  }

  // ── Variants ──────────────────────────────────────────────────────────
  const variantResults: Record<string, EvaluateResult<D, O>> = {};
  const totalStart = Date.now();

  for (const [variantName, variantExecutor] of Object.entries(variants!)) {
    const { results, durationMs } = await runSingleExecutor(
      dataset,
      variantExecutor,
      evaluators,
      concurrency,
    );

    const scoreNames = new Set<string>();
    for (const r of results) {
      for (const key of Object.keys(r.scores)) scoreNames.add(key);
    }

    const scores: Record<string, ScoreStats> = {};
    for (const scoreName of scoreNames) {
      scores[scoreName] = computeStats(
        results.map((r) => r.scores[scoreName] ?? NaN),
      );
    }

    const variantResult: EvaluateResult<D, O> = {
      name: `${name}/${variantName}`,
      runId,
      group,
      scores,
      durationMs,
      count: results.length,
      errors: results.filter((r) => r.error).length,
      metadata,
      results,
    };

    variantResults[variantName] = variantResult;

    if (process.env.LLMOPS_EVAL_OUTPUT !== 'json') {
      printSummary(variantResult);
    }

    saveResult(variantResult, outputDir);
  }

  const variantEvalResult: VariantEvaluateResult<D, O> = {
    name,
    runId,
    group,
    durationMs: Date.now() - totalStart,
    metadata,
    variants: variantResults,
  };

  if (process.env.LLMOPS_EVAL_OUTPUT === 'json') {
    process.stdout.write(JSON.stringify(variantEvalResult, null, 2));
  }

  return variantEvalResult;
}
