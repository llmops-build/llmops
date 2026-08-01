import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { GateResult } from '@llmops/sdk/eval';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildJsonOutput,
  byEvalName,
  EXIT_EVAL_ERROR,
  EXIT_GATE_FAILURE,
  EXIT_OK,
  loadLatestResults,
  parseMaxRegression,
  parseMinScoreSpec,
  resolveExitCode,
} from '../lib/gate';

describe('parseMinScoreSpec', () => {
  it('parses a single evaluator=threshold pair', () => {
    expect(parseMinScoreSpec('accuracy=0.8')).toEqual({ accuracy: 0.8 });
  });

  it('parses multiple comma-separated pairs and trims whitespace', () => {
    expect(parseMinScoreSpec(' accuracy=0.8, exact = 1 ')).toEqual({
      accuracy: 0.8,
      exact: 1,
    });
  });

  it('rejects an entry missing "="', () => {
    expect(() => parseMinScoreSpec('accuracy')).toThrow(/Invalid --minScore/);
  });

  it('rejects a non-numeric threshold', () => {
    expect(() => parseMinScoreSpec('accuracy=high')).toThrow(
      /Invalid --minScore/,
    );
  });

  it('rejects an empty threshold', () => {
    expect(() => parseMinScoreSpec('accuracy=')).toThrow(/Invalid --minScore/);
  });

  it('rejects an empty spec', () => {
    expect(() => parseMinScoreSpec('')).toThrow(/requires at least one/);
  });

  it.each([
    ['negative', 'accuracy=-0.1'],
    ['above one', 'accuracy=1.5'],
    ['infinite', 'accuracy=Infinity'],
  ])('rejects a %s threshold', (_label, spec) => {
    expect(() => parseMinScoreSpec(spec)).toThrow(/Invalid --minScore/);
  });

  it('accepts the inclusive bounds 0 and 1', () => {
    expect(parseMinScoreSpec('a=0,b=1')).toEqual({ a: 0, b: 1 });
  });
});

describe('parseMaxRegression', () => {
  it('defaults to 0 when unset', () => {
    expect(parseMaxRegression(undefined)).toBe(0);
  });

  it('accepts a value inside [0, 1]', () => {
    expect(parseMaxRegression(0.05)).toBe(0.05);
  });

  it.each([
    ['negative', -0.1],
    ['above one', 1.5],
    ['not finite', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('rejects a %s value', (_label, value) => {
    expect(() => parseMaxRegression(value)).toThrow(/--maxRegression/);
  });
});

describe('loadLatestResults', () => {
  const dirs: string[] = [];

  function tempDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'llmops-gate-'));
    dirs.push(dir);
    return dir;
  }

  afterEach(() => {
    for (const dir of dirs.splice(0)) {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  function writeResult(
    dir: string,
    name: string,
    timestamp: number,
    body?: string,
  ) {
    const target = join(dir, ...name.split('/'));
    mkdirSync(target, { recursive: true });
    writeFileSync(
      join(target, `${timestamp}.json`),
      body ?? JSON.stringify({ name, runId: `run-${timestamp}`, scores: {} }),
    );
  }

  it('returns nothing when the directory does not exist', () => {
    expect(loadLatestResults(join(tmpdir(), 'does-not-exist'))).toEqual([]);
  });

  it('picks the most recent file per eval name', () => {
    const dir = tempDir();
    writeResult(dir, 'support-bot', 1000);
    writeResult(dir, 'support-bot', 2000);

    const results = loadLatestResults(dir);
    expect(results).toHaveLength(1);
    expect(results[0].runId).toBe('run-2000');
  });

  it('reconstructs nested variant names from directory structure', () => {
    const dir = tempDir();
    writeResult(dir, 'model-comparison/concise', 1000);
    writeResult(dir, 'model-comparison/verbose', 1000);

    expect(
      loadLatestResults(dir)
        .map((r) => r.name)
        .sort(),
    ).toEqual(['model-comparison/concise', 'model-comparison/verbose']);
  });

  it('filters out files older than sinceTimestamp', () => {
    const dir = tempDir();
    writeResult(dir, 'support-bot', 1000);

    expect(loadLatestResults(dir, 2000)).toEqual([]);
    expect(loadLatestResults(dir, 500)).toHaveLength(1);
  });

  it('throws with the offending path when a result file is corrupt', () => {
    const dir = tempDir();
    writeResult(dir, 'support-bot', 1000, '{ not valid json');

    expect(() => loadLatestResults(dir)).toThrow(/Could not read eval result/);
    expect(() => loadLatestResults(dir)).toThrow(/support-bot/);
  });
});

describe('byEvalName', () => {
  it('keys results by their recorded eval name', () => {
    const a = { name: 'a', runId: '1' } as never;
    const b = { name: 'b', runId: '2' } as never;
    expect(byEvalName([a, b])).toEqual({ a, b });
  });
});

describe('buildJsonOutput', () => {
  const gate: GateResult = {
    passed: false,
    checks: [{ eval: 'a', evaluator: 'x', type: 'min-score', passed: false }],
  };

  it('emits a single eval result unwrapped when there is no gate', () => {
    expect(buildJsonOutput([{ name: 'a' }])).toEqual({ name: 'a' });
  });

  it('emits an array when several eval files ran and there is no gate', () => {
    expect(buildJsonOutput([{ name: 'a' }, { name: 'b' }])).toEqual([
      { name: 'a' },
      { name: 'b' },
    ]);
  });

  it('wraps results alongside the gate when one ran', () => {
    expect(buildJsonOutput([{ name: 'a' }], gate)).toEqual({
      results: { name: 'a' },
      gate,
    });
  });

  it('keeps the wrapper parseable as a single document', () => {
    const output = buildJsonOutput([{ name: 'a' }], gate);
    expect(JSON.parse(JSON.stringify(output))).toHaveProperty(
      'gate.passed',
      false,
    );
  });
});

describe('resolveExitCode', () => {
  const passing: GateResult = { passed: true, checks: [] };
  const failing: GateResult = { passed: false, checks: [] };

  it('exits 0 when nothing failed and no gate ran', () => {
    expect(resolveExitCode({ hasErrors: false })).toBe(EXIT_OK);
  });

  it('exits 0 when the gate passed', () => {
    expect(resolveExitCode({ hasErrors: false, gate: passing })).toBe(EXIT_OK);
  });

  it('exits 2 when the gate failed', () => {
    expect(resolveExitCode({ hasErrors: false, gate: failing })).toBe(
      EXIT_GATE_FAILURE,
    );
  });

  it('exits 1 when an eval failed to run, with no gate', () => {
    expect(resolveExitCode({ hasErrors: true })).toBe(EXIT_EVAL_ERROR);
  });

  it('prefers the execution error over a gate verdict', () => {
    expect(resolveExitCode({ hasErrors: true, gate: failing })).toBe(
      EXIT_EVAL_ERROR,
    );
    expect(resolveExitCode({ hasErrors: true, gate: passing })).toBe(
      EXIT_EVAL_ERROR,
    );
  });
});
