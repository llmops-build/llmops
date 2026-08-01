import { describe, expect, it } from 'vitest';
import { applyGate, flattenEvaluateResult } from './gate';
import type { EvaluateResult, VariantEvaluateResult } from './types';

function makeResult(
  name: string,
  scores: Record<string, number>,
  overrides: Partial<EvaluateResult> = {},
): EvaluateResult {
  const stats = Object.fromEntries(
    Object.entries(scores).map(([key, mean]) => [
      key,
      { mean, min: mean, max: mean, median: mean, count: 1 },
    ]),
  );
  return {
    name,
    runId: `run-${name}`,
    scores: stats,
    durationMs: 1,
    count: 1,
    errors: 0,
    results: [],
    ...overrides,
  };
}

describe('applyGate', () => {
  it('passes when every evaluator meets its minimum score', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.9 })], {
      minScore: { accuracy: 0.8 },
    });

    expect(gate.passed).toBe(true);
    expect(gate.checks).toEqual([
      {
        eval: 'support-bot',
        evaluator: 'accuracy',
        type: 'min-score',
        score: 0.9,
        threshold: 0.8,
        passed: true,
      },
    ]);
  });

  it('fails when an evaluator falls below its minimum score', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.5 })], {
      minScore: { accuracy: 0.8 },
    });

    expect(gate.passed).toBe(false);
    expect(gate.checks[0]).toMatchObject({ passed: false, score: 0.5 });
  });

  it('fails loudly when a threshold names an evaluator that never ran', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.9 })], {
      minScore: { accuracy: 0.8, typo_evaluator: 0.5 },
    });

    expect(gate.passed).toBe(false);
    const missing = gate.checks.find((c) => c.evaluator === 'typo_evaluator');
    expect(missing?.passed).toBe(false);
    expect(missing?.message).toMatch(/not found/);
  });

  it('passes a regression check when the candidate matches the baseline exactly (default maxRegression: 0)', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.8 })], {
      baseline: { 'support-bot': makeResult('support-bot', { accuracy: 0.8 }) },
    });

    expect(gate.passed).toBe(true);
    expect(gate.checks[0]).toMatchObject({
      type: 'regression',
      baseline: 0.8,
      candidate: 0.8,
      delta: 0,
    });
  });

  it('fails a regression check when the candidate drops below the baseline', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.7 })], {
      baseline: { 'support-bot': makeResult('support-bot', { accuracy: 0.9 }) },
    });

    expect(gate.passed).toBe(false);
    expect(gate.checks[0]).toMatchObject({
      passed: false,
      baseline: 0.9,
      candidate: 0.7,
      delta: expect.closeTo(-0.2, 5),
    });
  });

  it('tolerates a drop within maxRegression', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.86 })], {
      baseline: { 'support-bot': makeResult('support-bot', { accuracy: 0.9 }) },
      maxRegression: 0.05,
    });

    expect(gate.passed).toBe(true);
  });

  it('allows a candidate-only evaluator as new coverage', () => {
    const gate = applyGate(
      [makeResult('new-eval', { accuracy: 0.9, extra: 1 })],
      { baseline: { 'new-eval': makeResult('new-eval', { accuracy: 0.9 }) } },
    );

    expect(gate.passed).toBe(true);
    expect(gate.checks).toHaveLength(1);
    expect(gate.checks[0]).toMatchObject({
      evaluator: 'accuracy',
      type: 'regression',
    });
  });

  it('fails when a matched baseline eval loses an evaluator', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.9 })], {
      baseline: {
        'support-bot': makeResult('support-bot', {
          accuracy: 0.9,
          safety: 1,
        }),
      },
    });

    expect(gate.passed).toBe(false);
    const missing = gate.checks.find((c) => c.type === 'evaluator-missing');
    expect(missing).toMatchObject({
      eval: 'support-bot',
      evaluator: 'safety',
      baseline: 1,
      passed: false,
    });
    expect(missing?.message).toMatch(/produced no score in this run/);
  });

  it('still compares the surviving evaluator when another disappears', () => {
    const gate = applyGate([makeResult('support-bot', { accuracy: 0.95 })], {
      baseline: {
        'support-bot': makeResult('support-bot', {
          accuracy: 0.9,
          safety: 1,
        }),
      },
    });

    // accuracy improved, so on its own the gate would have passed.
    const regression = gate.checks.find((c) => c.type === 'regression');
    expect(regression).toMatchObject({ evaluator: 'accuracy', passed: true });
    expect(gate.checks.filter((c) => !c.passed)).toHaveLength(1);
    expect(gate.passed).toBe(false);
  });

  it('reports every dropped evaluator, and only the dropped ones', () => {
    const gate = applyGate(
      [makeResult('support-bot', { accuracy: 0.9, added: 1 })],
      {
        baseline: {
          'support-bot': makeResult('support-bot', {
            accuracy: 0.9,
            safety: 1,
            tone: 0.5,
          }),
        },
      },
    );

    expect(
      gate.checks
        .filter((c) => c.type === 'evaluator-missing')
        .map((c) => c.evaluator)
        .sort(),
    ).toEqual(['safety', 'tone']);
    expect(gate.passed).toBe(false);
  });

  it('does not report dropped evaluators for an unmatched baseline eval', () => {
    // The whole eval is already reported as baseline-missing; listing each of
    // its evaluators too would just be noise.
    const gate = applyGate([makeResult('renamed', { accuracy: 0.9 })], {
      baseline: {
        'support-bot': makeResult('support-bot', { accuracy: 0.9, safety: 1 }),
      },
    });

    expect(
      gate.checks.filter((c) => c.type === 'evaluator-missing'),
    ).toHaveLength(0);
    expect(
      gate.checks.filter((c) => c.type === 'baseline-missing'),
    ).toHaveLength(1);
  });

  it('combines min-score and regression checks across multiple results', () => {
    const gate = applyGate(
      [
        makeResult('support-bot', { accuracy: 0.9 }),
        makeResult('sql-gen', { accuracy: 0.4 }),
      ],
      {
        minScore: { accuracy: 0.8 },
        baseline: {
          'support-bot': makeResult('support-bot', { accuracy: 0.85 }),
        },
      },
    );

    expect(gate.passed).toBe(false);
    expect(gate.checks.find((c) => c.eval === 'sql-gen')?.passed).toBe(false);
  });

  // ── Fail-closed behaviour ─────────────────────────────────────────────

  it('fails when there are no candidate results to check at all', () => {
    const gate = applyGate([], {
      baseline: { 'support-bot': makeResult('support-bot', { accuracy: 0.9 }) },
    });

    expect(gate.passed).toBe(false);
    expect(gate.checks).toContainEqual(
      expect.objectContaining({
        eval: 'support-bot',
        type: 'baseline-missing',
        passed: false,
      }),
    );
  });

  it('fails when no candidate eval name matches the baseline', () => {
    const gate = applyGate([makeResult('renamed-bot', { accuracy: 0.1 })], {
      baseline: { 'support-bot': makeResult('support-bot', { accuracy: 0.9 }) },
    });

    expect(gate.passed).toBe(false);
    expect(
      gate.checks.find((c) => c.type === 'baseline-missing')?.message,
    ).toMatch(/no matching result/);
  });

  it('surfaces a dropped eval while still checking the ones that remain', () => {
    const gate = applyGate([makeResult('kept', { accuracy: 0.9 })], {
      baseline: {
        kept: makeResult('kept', { accuracy: 0.9 }),
        dropped: makeResult('dropped', { accuracy: 0.9 }),
      },
    });

    expect(gate.passed).toBe(false);
    expect(gate.checks.filter((c) => c.passed)).toHaveLength(1);
    expect(
      gate.checks.filter((c) => c.type === 'baseline-missing'),
    ).toHaveLength(1);
  });

  it('never reports a pass when it performed no checks', () => {
    // Both sides match by name and neither recorded any evaluator, so nothing
    // is comparable and no check is produced.
    const gate = applyGate([makeResult('empty', {})], {
      baseline: { empty: makeResult('empty', {}) },
    });

    expect(gate.checks).toHaveLength(0);
    expect(gate.passed).toBe(false);
  });

  it('reports a dropped evaluator rather than falling back to the zero-check guard', () => {
    const gate = applyGate([makeResult('unrelated', { other: 1 })], {
      baseline: { unrelated: makeResult('unrelated', { missing: 1 }) },
    });

    expect(gate.passed).toBe(false);
    expect(gate.checks).toHaveLength(1);
    expect(gate.checks[0]).toMatchObject({
      type: 'evaluator-missing',
      evaluator: 'missing',
    });
  });

  it('fails when a candidate eval recorded datapoint errors, even if means look fine', () => {
    const gate = applyGate(
      [makeResult('support-bot', { accuracy: 1 }, { count: 4, errors: 2 })],
      { minScore: { accuracy: 0.8 } },
    );

    expect(gate.passed).toBe(false);
    const errorCheck = gate.checks.find((c) => c.type === 'errors');
    expect(errorCheck).toMatchObject({ passed: false, errors: 2 });
    expect(errorCheck?.message).toMatch(/failed to produce a score/);
  });

  // ── Misconfiguration ──────────────────────────────────────────────────

  it('throws when a baseline is supplied with nothing to compare against', () => {
    expect(() =>
      applyGate([makeResult('a', { s: 1 })], { baseline: {} }),
    ).toThrow(/contains no eval results/);
  });

  it('throws when neither minScore nor baseline is supplied', () => {
    expect(() => applyGate([makeResult('a', { s: 1 })], {})).toThrow(
      /provide minScore, baseline, or both/,
    );
  });

  it.each([
    ['below zero', -0.1],
    ['above one', 1.5],
    ['not finite', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('throws for a minScore threshold %s', (_label, threshold) => {
    expect(() =>
      applyGate([makeResult('a', { s: 1 })], { minScore: { s: threshold } }),
    ).toThrow(/minScore\["s"\]/);
  });

  it.each([
    ['below zero', -0.1],
    ['above one', 2],
    ['not finite', Number.NaN],
  ])('throws for a maxRegression %s', (_label, maxRegression) => {
    expect(() =>
      applyGate([makeResult('a', { s: 1 })], {
        baseline: { a: makeResult('a', { s: 1 }) },
        maxRegression,
      }),
    ).toThrow(/maxRegression/);
  });

  it('accepts the inclusive bounds 0 and 1', () => {
    expect(() =>
      applyGate([makeResult('a', { s: 1 })], {
        minScore: { s: 0 },
        baseline: { a: makeResult('a', { s: 1 }) },
        maxRegression: 1,
      }),
    ).not.toThrow();
  });
});

describe('flattenEvaluateResult', () => {
  it('returns a single-executor result unchanged', () => {
    const result = makeResult('support-bot', { accuracy: 0.9 });
    expect(flattenEvaluateResult(result)).toEqual([result]);
  });

  it('expands variants into name-qualified results', () => {
    const variantResult: VariantEvaluateResult = {
      name: 'model-comparison',
      runId: 'run-1',
      durationMs: 1,
      variants: {
        concise: makeResult('model-comparison/concise', { accuracy: 0.9 }),
        verbose: makeResult('model-comparison/verbose', { accuracy: 0.7 }),
      },
    };

    const flattened = flattenEvaluateResult(variantResult);
    expect(flattened.map((r) => r.name)).toEqual([
      'model-comparison/concise',
      'model-comparison/verbose',
    ]);
  });

  it('copies every EvaluateResult field onto the flattened entry without mutating the source variant', () => {
    // Deliberately named differently from what flattening will produce, so a
    // passing assertion on the source's `name` actually proves it was not
    // written to in place.
    const concise = makeResult(
      'unflattened-name',
      { accuracy: 0.9 },
      { group: 'nightly', metadata: { model: 'gpt-mini' }, errors: 1 },
    );
    const variantResult: VariantEvaluateResult = {
      name: 'model-comparison',
      runId: 'run-1',
      durationMs: 1,
      variants: { concise },
    };

    const [flattened] = flattenEvaluateResult(variantResult);

    // Every field carried over correctly, renamed to the qualified form.
    // Spelled out explicitly (not `{ ...concise, name: ... }`) so this test
    // does not depend on the same construct the fix moved away from.
    expect(flattened).toEqual({
      name: 'model-comparison/concise',
      runId: concise.runId,
      group: concise.group,
      scores: concise.scores,
      durationMs: concise.durationMs,
      count: concise.count,
      errors: concise.errors,
      metadata: concise.metadata,
      results: concise.results,
    });
    // A fresh object, not the same reference as the source variant.
    expect(flattened).not.toBe(concise);
    // The source variant itself was never written to.
    expect(concise.name).toBe('unflattened-name');
    expect(concise.group).toBe('nightly');
  });

  it('produces names that match the baseline keys a variants gate compares on', () => {
    const variantResult: VariantEvaluateResult = {
      name: 'model-comparison',
      runId: 'run-2',
      durationMs: 1,
      variants: { concise: makeResult('ignored', { accuracy: 0.5 }) },
    };

    const gate = applyGate(flattenEvaluateResult(variantResult), {
      baseline: {
        'model-comparison/concise': makeResult('model-comparison/concise', {
          accuracy: 0.9,
        }),
      },
    });

    expect(gate.checks).toHaveLength(1);
    expect(gate.checks[0]).toMatchObject({
      type: 'regression',
      passed: false,
    });
  });
});
