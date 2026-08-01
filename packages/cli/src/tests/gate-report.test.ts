import type { GateCheck, GateResult } from '@llmops/sdk/eval';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { describeCheck, printGateReport } from '../lib/gate-report';

const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

// Strips ANSI escape codes so assertions read the same in any terminal.
function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '');
}

describe('describeCheck', () => {
  it('renders a passing min-score check', () => {
    const check: GateCheck = {
      eval: 'support-bot',
      evaluator: 'accuracy',
      type: 'min-score',
      score: 0.92,
      threshold: 0.8,
      passed: true,
    };
    expect(describeCheck(check)).toBe('score=0.92 min=0.8');
  });

  it('renders a regression check with a negative delta', () => {
    const check: GateCheck = {
      eval: 'support-bot',
      evaluator: 'accuracy',
      type: 'regression',
      baseline: 0.9,
      candidate: 0.7,
      delta: -0.2,
      maxRegression: 0,
      passed: false,
    };
    expect(describeCheck(check)).toBe(
      '0.90 → 0.70 (delta -0.20, max regression 0)',
    );
  });

  it('renders a regression check with a positive delta with an explicit sign', () => {
    const check: GateCheck = {
      eval: 'support-bot',
      evaluator: 'accuracy',
      type: 'regression',
      baseline: 0.7,
      candidate: 0.9,
      delta: 0.2,
      maxRegression: 0,
      passed: true,
    };
    expect(describeCheck(check)).toBe(
      '0.70 → 0.90 (delta +0.20, max regression 0)',
    );
  });

  it('prefers the check message over type-specific formatting when present', () => {
    const check: GateCheck = {
      eval: 'support-bot',
      evaluator: 'typo',
      type: 'min-score',
      threshold: 0.8,
      passed: false,
      message: 'evaluator "typo" was not found in any eval result',
    };
    expect(describeCheck(check)).toBe(
      'evaluator "typo" was not found in any eval result',
    );
  });
});

describe('printGateReport', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  function loggedLines(): string[] {
    return logSpy.mock.calls.map((args: unknown[]) =>
      stripAnsi(String(args[0])),
    );
  }

  it('reports a whole-eval check without an evaluator label', () => {
    const gate: GateResult = {
      passed: false,
      checks: [
        {
          eval: 'support-bot',
          type: 'baseline-missing',
          passed: false,
          message:
            'baseline eval "support-bot" has no matching result in this run',
        },
      ],
    };

    printGateReport(gate);

    const lines = loggedLines();
    expect(lines[1]).toBe(
      '  ✗ support-bot  baseline eval "support-bot" has no matching result in this run',
    );
  });

  it('reports an evaluator-level check with the "eval › evaluator" label', () => {
    const gate: GateResult = {
      passed: true,
      checks: [
        {
          eval: 'support-bot',
          evaluator: 'accuracy',
          type: 'min-score',
          score: 0.9,
          threshold: 0.8,
          passed: true,
        },
      ],
    };

    printGateReport(gate);

    expect(loggedLines()[1]).toBe(
      '  ✓ support-bot › accuracy  score=0.90 min=0.8',
    );
  });

  it('prints a placeholder line when the gate performed no checks', () => {
    printGateReport({ passed: false, checks: [] });
    expect(loggedLines()).toContain('  ✗ no checks ran');
  });

  it('summarizes a pass with no per-check failure count', () => {
    printGateReport({ passed: true, checks: [] });
    expect(loggedLines().at(-1)).toBe('Gate passed');
  });

  it('summarizes a failure with the count of failing vs total checks', () => {
    const gate: GateResult = {
      passed: false,
      checks: [
        { eval: 'a', evaluator: 'x', type: 'min-score', passed: true },
        { eval: 'a', evaluator: 'y', type: 'min-score', passed: false },
        { eval: 'a', evaluator: 'z', type: 'min-score', passed: false },
      ],
    };

    printGateReport(gate);

    expect(loggedLines().at(-1)).toBe(
      'Gate failed — 2 of 3 check(s) did not pass',
    );
  });
});
