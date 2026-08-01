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
  const w = process.stderr;
  const RESET = '\x1b[0m';
  const DIM = '\x1b[2m';
  const BOLD = '\x1b[1m';
  const GREEN = '\x1b[32m';
  const RED = '\x1b[31m';
  const CYAN = '\x1b[36m';

  w.write('\n');
  w.write(`  ${BOLD}Compare${RESET}  ${DIM}${baselineRun.name} → ${candidateRun.name}${RESET}\n`);
  w.write(`  ${DIM}${'─'.repeat(50)}${RESET}\n\n`);

  const scoreEntries = Object.entries(scores);
  if (scoreEntries.length > 0) {
    const maxNameLen = Math.max(...scoreEntries.map(([n]) => n.length), 10);

    w.write(`  ${DIM}${'Evaluator'.padEnd(maxNameLen)}  ${'Base'.padStart(6)}    ${'New'.padStart(6)}  ${'Delta'.padStart(7)}${RESET}\n`);
    w.write(`  ${DIM}${'─'.repeat(maxNameLen + 30)}${RESET}\n`);

    for (const [scoreName, delta] of scoreEntries) {
      const sign = delta.delta >= 0 ? '+' : '';
      const color = delta.delta >= 0 ? GREEN : RED;
      const icon = delta.delta > 0 ? '▲' : delta.delta < 0 ? '▼' : '=';
      w.write(
        `  ${scoreName.padEnd(maxNameLen)}  ${delta.baseline.toFixed(2).padStart(6)}  ${DIM}→${RESET}  ${delta.candidate.toFixed(2).padStart(6)}  ${color}${sign}${delta.delta.toFixed(2).padStart(5)} ${icon}${RESET}\n`,
      );
    }
    w.write('\n');
  }

  if (regressions.length > 0) {
    w.write(`  ${RED}▼ ${regressions.length} regression${regressions.length > 1 ? 's' : ''}${RESET}\n`);
    for (const r of regressions.slice(0, 5)) {
      const dataStr = typeof r.data === 'string' ? r.data : JSON.stringify(r.data).slice(0, 50);
      w.write(`    ${DIM}${dataStr}${RESET}  ${r.evaluator}: ${r.baselineScore.toFixed(2)} → ${RED}${r.candidateScore.toFixed(2)}${RESET}\n`);
    }
    if (regressions.length > 5) {
      w.write(`    ${DIM}... and ${regressions.length - 5} more${RESET}\n`);
    }
    w.write('\n');
  }

  if (improvements.length > 0) {
    w.write(`  ${GREEN}▲ ${improvements.length} improvement${improvements.length > 1 ? 's' : ''}${RESET}\n`);
    for (const imp of improvements.slice(0, 5)) {
      const dataStr = typeof imp.data === 'string' ? imp.data : JSON.stringify(imp.data).slice(0, 50);
      w.write(`    ${DIM}${dataStr}${RESET}  ${imp.evaluator}: ${imp.baselineScore.toFixed(2)} → ${GREEN}${imp.candidateScore.toFixed(2)}${RESET}\n`);
    }
    if (improvements.length > 5) {
      w.write(`    ${DIM}... and ${improvements.length - 5} more${RESET}\n`);
    }
    w.write('\n');
  }

  if (regressions.length === 0 && improvements.length === 0) {
    w.write(`  ${CYAN}No changes between runs${RESET}\n\n`);
  }

  return result;
}
