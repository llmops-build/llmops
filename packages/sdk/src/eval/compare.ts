import { readFileSync } from 'node:fs';
import type {
  CompareOptions,
  CompareResult,
  EvaluateResult,
  ScoreDelta,
} from './types';

/**
 * Load an eval result from a JSON file.
 */
function loadResult(filePath: string): EvaluateResult {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as EvaluateResult;
  } catch {
    throw new Error(`Could not read eval result: ${filePath}`);
  }
}

/**
 * Compare two eval result files. First file is the baseline.
 *
 * Usage with version control:
 * 1. Run eval → results saved to ./llmops-evals/my-eval.eval.json
 * 2. Commit the file
 * 3. Make changes, re-run eval
 * 4. Compare: git stash the new result, compare old vs new
 *
 * Or compare two named eval files:
 * ```ts
 * const diff = await compare({
 *   files: ['./llmops-evals/baseline.eval.json', './llmops-evals/candidate.eval.json'],
 * })
 * ```
 */
export async function compare(options: CompareOptions): Promise<CompareResult> {
  const { files } = options;

  const baselineRun = loadResult(files[0]);
  const candidateRun = loadResult(files[1]);

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
    baseline: baselineRun.runId,
    candidate: candidateRun.runId,
    scores,
    regressions,
    improvements,
  };

  // Print summary to stderr
  const lines: string[] = [];
  lines.push('');
  lines.push(` compare: ${baselineRun.name} → ${candidateRun.name}`);
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
