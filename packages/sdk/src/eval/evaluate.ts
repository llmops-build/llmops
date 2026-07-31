import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { type EvaluationDataset, InlineDataset } from './dataset';
import type {
  DatapointResult,
  EvaluateOptions,
  EvaluateResult,
  Evaluator,
  Executor,
  ScoreStats,
  VariantEvaluateResult,
} from './types';

// ─── ANSI codes ─────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';

// ─── Concurrency pool ───────────────────────────────────────────────────────

async function pool<T>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<void>,
) {
  const executing: Promise<void>[] = [];
  for (const [index, item] of items.entries()) {
    const p = fn(item, index).then(() => {
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
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];

  return {
    mean: sum / sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median,
    count: sorted.length,
  };
}

// ─── Live output ────────────────────────────────────────────────────────────

const isSilent = process.env.LLMOPS_EVAL_OUTPUT === 'json';
const w = process.stderr;

function printHeader(name: string, total: number) {
  if (isSilent) return;
  w.write('\n');
  w.write(`  ${BOLD}${name}${RESET}  ${DIM}(${total} datapoints)${RESET}\n`);
  w.write(`  ${DIM}${'─'.repeat(50)}${RESET}\n`);
}

function printDatapointResult(idx: number, total: number, dp: DatapointResult) {
  if (isSilent) return;

  const label =
    typeof dp.data === 'object' && dp.data !== null
      ? JSON.stringify(dp.data).slice(0, 50)
      : String(dp.data).slice(0, 50);

  if (dp.error) {
    w.write(
      `  ${RED}✗${RESET} ${DIM}[${idx + 1}/${total}]${RESET} ${label}  ${RED}ERROR${RESET} ${DIM}${dp.error.slice(0, 60)}${RESET}\n`,
    );
    return;
  }

  const scoreStr = Object.entries(dp.scores)
    .map(([name, val]) => {
      if (Number.isNaN(val)) return `${DIM}${name}=NaN${RESET}`;
      const color = val >= 0.8 ? GREEN : val >= 0.5 ? YELLOW : RED;
      return `${color}${name}=${val.toFixed(2)}${RESET}`;
    })
    .join('  ');

  w.write(
    `  ${GREEN}✓${RESET} ${DIM}[${idx + 1}/${total}]${RESET} ${label}  ${scoreStr}  ${DIM}${dp.durationMs}ms${RESET}\n`,
  );
}

function scoreBar(score: number, width = 20): string {
  const filled = Math.round(score * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function scoreColor(score: number): string {
  if (score >= 0.8) return GREEN;
  if (score >= 0.5) return YELLOW;
  return RED;
}

function printSummary(result: EvaluateResult) {
  if (isSilent) return;

  w.write('\n');

  const entries = Object.entries(result.scores);
  if (entries.length > 0) {
    const maxNameLen = Math.max(...entries.map(([n]) => n.length), 10);

    w.write(
      `  ${DIM}${'Evaluator'.padEnd(maxNameLen)}  ${'Mean'.padStart(6)}  ${'Bar'.padEnd(20)}  ${'Min'.padStart(5)}  ${'Max'.padStart(5)}  ${'Med'.padStart(5)}${RESET}\n`,
    );
    w.write(`  ${DIM}${'─'.repeat(maxNameLen + 50)}${RESET}\n`);

    for (const [name, stats] of entries) {
      const color = scoreColor(stats.mean);
      const bar = scoreBar(stats.mean);
      w.write(
        `  ${name.padEnd(maxNameLen)}  ${color}${stats.mean.toFixed(2).padStart(6)}${RESET}  ${DIM}${bar}${RESET}  ${stats.min.toFixed(2).padStart(5)}  ${stats.max.toFixed(2).padStart(5)}  ${stats.median.toFixed(2).padStart(5)}\n`,
      );
    }
  }

  const completed = result.count - result.errors;
  w.write('\n');
  w.write(`  ${DIM}Duration${RESET} ${(result.durationMs / 1000).toFixed(1)}s`);
  w.write(`    ${DIM}Passed${RESET} ${completed}/${result.count}`);
  if (result.errors > 0) {
    w.write(`    ${RED}Failed ${result.errors}${RESET}`);
  }
  w.write(`    ${DIM}Run${RESET} ${CYAN}${result.runId.slice(0, 8)}${RESET}`);
  w.write('\n\n');
}

// ─── Save ───────────────────────────────────────────────────────────────────

function saveResult(result: EvaluateResult, outputDir: string) {
  const dir = join(outputDir, result.name);
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, `${Date.now()}.json`);
  writeFileSync(filePath, JSON.stringify(result, null, 2));
}

// ─── Single executor flow ───────────────────────────────────────────────────

async function runSingleExecutor<D, T, O>(
  name: string,
  dataset: EvaluationDataset<D, T>,
  executor: Executor<D, O>,
  evaluators: Record<string, Evaluator<O, T>>,
  concurrency: number,
): Promise<{ results: DatapointResult<D, O>[]; durationMs: number }> {
  const size = await dataset.size();
  const datapoints = await dataset.slice(0, size);
  const results: DatapointResult<D, O>[] = new Array(datapoints.length);
  const startTime = Date.now();

  printHeader(name, datapoints.length);

  await pool(datapoints, concurrency, async (dp, idx) => {
    const dpStart = Date.now();
    let output: O | undefined;
    let error: string | undefined;
    let executed = false;
    const evaluatorErrors: string[] = [];
    const scores: Record<string, number> = {};

    try {
      output = await executor(dp.data);
      executed = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    if (!error && executed) {
      for (const [evalName, evaluator] of Object.entries(evaluators)) {
        try {
          const result = await evaluator(output as O, dp.target, dp.data);
          if (typeof result === 'number') {
            scores[evalName] = result;
          } else {
            for (const [subKey, subScore] of Object.entries(result)) {
              scores[`${evalName}.${subKey}`] = subScore;
            }
          }
        } catch (evalErr) {
          scores[evalName] = NaN;
          const msg =
            evalErr instanceof Error ? evalErr.message : String(evalErr);
          evaluatorErrors.push(`evaluator "${evalName}": ${msg}`);
          if (!isSilent) {
            w.write(
              `  ${YELLOW}⚠${RESET} ${DIM}evaluator "${evalName}":${RESET} ${msg.slice(0, 80)}\n`,
            );
          }
        }
      }
    }

    if (!error && evaluatorErrors.length > 0) {
      error = evaluatorErrors.join('; ');
    }

    const dpResult: DatapointResult<D, O> = {
      data: dp.data,
      target: dp.target,
      metadata: dp.metadata,
      output: output as O,
      scores,
      durationMs: Date.now() - dpStart,
      error,
    };

    results[idx] = dpResult;
    printDatapointResult(idx, datapoints.length, dpResult as DatapointResult);
  });

  return { results, durationMs: Date.now() - startTime };
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

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error('evaluate(): concurrency must be a positive integer');
  }

  if (executor && variants) {
    throw new Error(
      'evaluate(): provide either executor or variants, not both',
    );
  }
  if (!executor && !variants) {
    throw new Error('evaluate(): provide either executor or variants');
  }

  const dataset = Array.isArray(data) ? new InlineDataset(data) : data;

  // ── Single executor ───────────────────────────────────────────────────
  if (executor) {
    const { results, durationMs } = await runSingleExecutor(
      name,
      dataset,
      executor,
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

    if (isSilent) {
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
      `${name}/${variantName}`,
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

    if (!isSilent) {
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

  if (isSilent) {
    process.stdout.write(JSON.stringify(variantEvalResult, null, 2));
  }

  return variantEvalResult;
}
