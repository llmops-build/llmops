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

function assertUnitInterval(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(
      `applyGate(): ${label} must be a finite number, got ${value}`,
    );
  }
  if (value < 0 || value > 1) {
    throw new Error(
      `applyGate(): ${label} must be between 0 and 1, got ${value}`,
    );
  }
}

/**
 * Checks eval results against score thresholds and/or a baseline, for use
 * as a CI regression gate. Pure and synchronous — safe to call from a CI
 * script or the `llmops eval` CLI.
 *
 * The gate fails closed. It reports `passed: true` only when it actually
 * performed checks and every one of them passed; anything it could not
 * verify (an evaluator that never ran, a baseline eval with no candidate,
 * an eval that recorded errors) is a failing check, not a skipped one.
 *
 * Throws on misconfiguration — out-of-range thresholds, or a baseline that
 * contains no runs to compare against. Callers should treat a throw as a
 * setup error, distinct from a failed gate.
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

  if (minScore) {
    if (Object.keys(minScore).length === 0) {
      throw new Error('applyGate(): minScore was provided but is empty');
    }
    for (const [evaluator, threshold] of Object.entries(minScore)) {
      assertUnitInterval(threshold, `minScore["${evaluator}"]`);
    }
  }

  assertUnitInterval(maxRegression, 'maxRegression');

  if (baseline && Object.keys(baseline).length === 0) {
    throw new Error(
      'applyGate(): baseline was provided but contains no eval results to compare against',
    );
  }

  if (!minScore && !baseline) {
    throw new Error('applyGate(): provide minScore, baseline, or both');
  }

  const checks: GateCheck[] = [];
  const matchedThresholds = new Set<string>();
  const candidateNames = new Set(results.map((r) => r.name));

  for (const result of results) {
    // An eval that recorded errors cannot vouch for its own scores: a failed
    // datapoint contributes 0, which can look like a passing mean elsewhere.
    if (result.errors > 0) {
      checks.push({
        eval: result.name,
        type: 'errors',
        errors: result.errors,
        passed: false,
        message: `${result.errors} of ${result.count} datapoint(s) failed to produce a score`,
      });
    }

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

  // A baseline eval with no candidate means the comparison silently lost
  // coverage — a renamed or dropped eval must not read as "no regression".
  if (baseline) {
    for (const baselineName of Object.keys(baseline)) {
      if (candidateNames.has(baselineName)) continue;
      checks.push({
        eval: baselineName,
        type: 'baseline-missing',
        passed: false,
        message: `baseline eval "${baselineName}" has no matching result in this run`,
      });
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
    // No checks means nothing was verified, which is not a pass.
    passed: checks.length > 0 && checks.every((check) => check.passed),
    checks,
  };
}
