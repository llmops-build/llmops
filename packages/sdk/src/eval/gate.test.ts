import { describe, expect, it } from 'vitest';
import { applyGate, flattenEvaluateResult } from './gate';
import type { EvaluateResult, VariantEvaluateResult } from './types';

function makeResult(
  name: string,
  scores: Record<string, number>,
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

  it('skips evals and evaluators absent from the baseline instead of failing', () => {
    const gate = applyGate(
      [makeResult('new-eval', { accuracy: 0.9, extra: 1 })],
      {
        baseline: {
          'new-eval': makeResult('new-eval', { accuracy: 0.9 }),
        },
      },
    );

    expect(gate.passed).toBe(true);
    expect(gate.checks).toHaveLength(1);
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
    expect(gate.checks).toHaveLength(3);
    expect(gate.checks.find((c) => c.eval === 'sql-gen')?.passed).toBe(false);
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
});
