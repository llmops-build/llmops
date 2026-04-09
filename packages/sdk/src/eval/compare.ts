import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CompareOptions,
  CompareResult,
  EvaluateResult,
  ScoreDelta,
} from './types';

/**
 * Load an eval run from the filesystem.
 */
function loadRun(
  outputDir: string,
  name: string,
  runId: string,
): EvaluateResult {
  const dir = join(outputDir, name);
  const filePath = join(dir, `${runId}.json`);

  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as EvaluateResult;
  } catch {
    // Try to find by prefix match (partial runId)
    try {
      const files = readdirSync(dir);
      const match = files.find((f) => f.startsWith(runId) && f.endsWith('.json'));
      if (match) {
        const content = readFileSync(join(dir, match), 'utf-8');
        return JSON.parse(content) as EvaluateResult;
      }
    } catch {
      // dir doesn't exist
    }
    throw new Error(
      `Eval run "${runId}" not found for "${name}" in ${outputDir}. ` +
        `Expected file: ${filePath}`,
    );
  }
}

/**
 * Compare two eval runs. First run ID is the baseline.
 *
 * Usage:
 * ```ts
 * const diff = await compare({
 *   name: 'support-bot',
 *   runs: [run1.runId, run2.runId],
 * })
 * ```
 */
export async function compare(options: CompareOptions): Promise<CompareResult> {
  const { runs, name, outputDir = './llmops-evals' } = options;

  if (runs.length < 2) {
    throw new Error('compare() requires at least 2 run IDs');
  }

  const baselineRun = loadRun(outputDir, name, runs[0]);
  const candidateRun = loadRun(outputDir, name, runs[1]);

  // Compute per-evaluator deltas
  const allScoreNames = new Set([
    ...Object.keys(baselineRun.scores),
    ...Object.keys(candidateRun.scores),
  ]);

  const scores: Record<string, ScoreDelta> = {};
  for (const scoreName of allScoreNames) {
    const baselineMean = baselineRun.scores[scoreName]?.mean ?? 0;
    const candidateMean = candidateRun.scores[scoreName]?.mean ?? 0;
    scores[scoreName] = {
      baseline: baselineMean,
      candidate: candidateMean,
      delta: candidateMean - baselineMean,
    };
  }

  // Identify regressions and improvements per datapoint
  const regressions: CompareResult['regressions'] = [];
  const improvements: CompareResult['improvements'] = [];

  const minLen = Math.min(
    baselineRun.results.length,
    candidateRun.results.length,
  );

  for (let i = 0; i < minLen; i++) {
    const baselineResult = baselineRun.results[i];
    const candidateResult = candidateRun.results[i];

    for (const scoreName of allScoreNames) {
      const baselineScore = baselineResult.scores[scoreName] ?? NaN;
      const candidateScore = candidateResult.scores[scoreName] ?? NaN;

      if (Number.isNaN(baselineScore) || Number.isNaN(candidateScore)) continue;

      if (candidateScore < baselineScore) {
        regressions.push({
          data: baselineResult.data,
          evaluator: scoreName,
          baselineScore,
          candidateScore,
        });
      } else if (candidateScore > baselineScore) {
        improvements.push({
          data: baselineResult.data,
          evaluator: scoreName,
          baselineScore,
          candidateScore,
        });
      }
    }
  }

  const result: CompareResult = {
    baseline: runs[0],
    candidate: runs[1],
    scores,
    regressions,
    improvements,
  };

  // Print summary to stderr
  const lines: string[] = [];
  lines.push('');
  lines.push(` compare: ${runs[0].slice(0, 8)} → ${runs[1].slice(0, 8)}`);
  lines.push('');
  lines.push(' Scores:');

  for (const [scoreName, delta] of Object.entries(scores)) {
    const sign = delta.delta >= 0 ? '+' : '';
    const marker = delta.delta >= 0 ? '✓' : '✗';
    lines.push(
      `   ${scoreName.padEnd(16)} ${delta.baseline.toFixed(2)} → ${delta.candidate.toFixed(2)}  (${sign}${delta.delta.toFixed(2)}) ${marker}`,
    );
  }

  if (regressions.length > 0) {
    lines.push('');
    lines.push(` Regressions (${regressions.length}):`);
    for (const r of regressions.slice(0, 5)) {
      const dataStr =
        typeof r.data === 'string'
          ? r.data
          : JSON.stringify(r.data).slice(0, 60);
      lines.push(
        `   "${dataStr}"  ${r.evaluator}: ${r.baselineScore.toFixed(2)} → ${r.candidateScore.toFixed(2)}`,
      );
    }
    if (regressions.length > 5) {
      lines.push(`   ... and ${regressions.length - 5} more`);
    }
  }

  if (improvements.length > 0) {
    lines.push('');
    lines.push(` Improvements (${improvements.length}):`);
    for (const imp of improvements.slice(0, 5)) {
      const dataStr =
        typeof imp.data === 'string'
          ? imp.data
          : JSON.stringify(imp.data).slice(0, 60);
      lines.push(
        `   "${dataStr}"  ${imp.evaluator}: ${imp.baselineScore.toFixed(2)} → ${imp.candidateScore.toFixed(2)}`,
      );
    }
    if (improvements.length > 5) {
      lines.push(`   ... and ${improvements.length - 5} more`);
    }
  }

  lines.push('');
  process.stderr.write(lines.join('\n'));

  return result;
}
