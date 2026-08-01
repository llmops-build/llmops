import type {
  EvaluateResult,
  GateCheck,
  GateOptions,
  GateResult,
  VariantEvaluateResult,
} from './types';

/**
 * Flattens the result of evaluate() into a list of `EvaluateResult`s.
 * A single-executor run is returned as-is; a variants run is expanded to
 * one entry per variant, named `${name}/${variantName}` to match how
 * evaluate() persists variant results to disk.
 */
export function flattenEvaluateResult<D = unknown, O = unknown>(
  result: EvaluateResult<D, O> | VariantEvaluateResult<D, O>,
): EvaluateResult<D, O>[] {
  if ('variants' in result) {
    return Object.entries(result.variants).map(([variantName, variant]) => ({
      ...variant,
      name: `${result.name}/${variantName}`,
    }));
  }
  return [result];
}

/**
 * Checks eval results against score thresholds and/or a baseline, for use
 * as a CI regression gate. Pure and synchronous — safe to call from a CI
 * script or the `llmops eval` CLI.
 *
 * ```ts
 * const result = await evaluate({ ... });
 * const gate = applyGate(flattenEvaluateResult(result), {
 *   minScore: { accuracy: 0.8 },
 * });
 * if (!gate.passed) process.exit(1);
 * ```
 */
export function applyGate(
  results: EvaluateResult[],
  options: GateOptions,
): GateResult {
  const { minScore, baseline, maxRegression = 0 } = options;
  const checks: GateCheck[] = [];
  const matchedThresholds = new Set<string>();

  for (const result of results) {
    if (minScore) {
      for (const [evaluator, threshold] of Object.entries(minScore)) {
        const stats = result.scores[evaluator];
        if (!stats) continue;
        matchedThresholds.add(evaluator);
        checks.push({
          eval: result.name,
          evaluator,
          type: 'min-score',
          score: stats.mean,
          threshold,
          passed: stats.mean >= threshold,
        });
      }
    }

    if (baseline) {
      const baselineResult = baseline[result.name];
      if (!baselineResult) continue;

      for (const [evaluator, candidateStats] of Object.entries(result.scores)) {
        const baselineStats = baselineResult.scores[evaluator];
        if (!baselineStats) continue;

        const delta = candidateStats.mean - baselineStats.mean;
        checks.push({
          eval: result.name,
          evaluator,
          type: 'regression',
          baseline: baselineStats.mean,
          candidate: candidateStats.mean,
          delta,
          maxRegression,
          passed: delta >= -maxRegression,
        });
      }
    }
  }

  if (minScore) {
    for (const evaluator of Object.keys(minScore)) {
      if (matchedThresholds.has(evaluator)) continue;
      checks.push({
        eval: results.map((r) => r.name).join(', ') || '(no results)',
        evaluator,
        type: 'min-score',
        threshold: minScore[evaluator],
        passed: false,
        message: `evaluator "${evaluator}" was not found in any eval result`,
      });
    }
  }

  return {
    passed: checks.every((check) => check.passed),
    checks,
  };
}
