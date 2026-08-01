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
 *
 * Field-by-field construction rather than `{ ...variant, name }`: listing
 * each field makes the copied contract visible at the call site instead of
 * hiding it behind a spread. It has no meaningful performance advantage over
 * a spread here — both are a one-level shallow copy of a handful of fields —
 * and it never mutates `variant`, which spread would not have either. The
 * tradeoff is that this list must be kept in sync by hand: unlike a spread,
 * it will not automatically pick up a field later added to `EvaluateResult`.
 */
export function flattenEvaluateResult<D = unknown, O = unknown>(
  result: EvaluateResult<D, O> | VariantEvaluateResult<D, O>,
): EvaluateResult<D, O>[] {
  if (!('variants' in result)) {
    return [result];
  }

  const flattened: EvaluateResult<D, O>[] = [];
  for (const [variantName, variant] of Object.entries(result.variants)) {
    flattened.push({
      name: `${result.name}/${variantName}`,
      runId: variant.runId,
      group: variant.group,
      scores: variant.scores,
      durationMs: variant.durationMs,
      count: variant.count,
      errors: variant.errors,
      metadata: variant.metadata,
      results: variant.results,
    });
  }
  return flattened;
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
 * verify (an evaluator that never ran, a baseline eval with no candidate, a
 * baseline evaluator the candidate dropped, an eval that recorded errors) is
 * a failing check, not a skipped one. Evaluators only the candidate has are
 * treated as new coverage and pass silently.
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
        // Evaluators only the candidate has are new coverage, not a regression.
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

      // An evaluator the baseline had and the candidate does not is lost
      // coverage: comparing only what survived would let a deleted safety
      // check read as "no regression".
      for (const [evaluator, baselineStats] of Object.entries(
        baselineResult.scores,
      )) {
        if (result.scores[evaluator]) continue;
        checks.push({
          eval: result.name,
          evaluator,
          type: 'evaluator-missing',
          baseline: baselineStats.mean,
          passed: false,
          message: `evaluator "${evaluator}" is in the baseline for "${result.name}" but produced no score in this run`,
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
