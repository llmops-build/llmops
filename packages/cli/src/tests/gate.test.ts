import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadLatestResults, parseMinScoreSpec } from '../lib/gate';

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

  it('rejects an empty spec', () => {
    expect(() => parseMinScoreSpec('')).toThrow(/requires at least one/);
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

  function writeResult(dir: string, name: string, timestamp: number) {
    const target = join(dir, ...name.split('/'));
    mkdirSync(target, { recursive: true });
    writeFileSync(
      join(target, `${timestamp}.json`),
      JSON.stringify({ name, runId: `run-${timestamp}`, scores: {} }),
    );
  }

  it('returns an empty map when the directory does not exist', () => {
    expect(loadLatestResults(join(tmpdir(), 'does-not-exist'))).toEqual({});
  });

  it('picks the most recent file per eval name', () => {
    const dir = tempDir();
    writeResult(dir, 'support-bot', 1000);
    writeResult(dir, 'support-bot', 2000);

    const results = loadLatestResults(dir);
    expect(results['support-bot'].runId).toBe('run-2000');
  });

  it('reconstructs nested variant names from directory structure', () => {
    const dir = tempDir();
    writeResult(dir, 'model-comparison/concise', 1000);
    writeResult(dir, 'model-comparison/verbose', 1000);

    const results = loadLatestResults(dir);
    expect(Object.keys(results).sort()).toEqual([
      'model-comparison/concise',
      'model-comparison/verbose',
    ]);
  });

  it('filters out files older than sinceTimestamp', () => {
    const dir = tempDir();
    writeResult(dir, 'support-bot', 1000);

    expect(loadLatestResults(dir, 2000)).toEqual({});
    expect(loadLatestResults(dir, 500)).toHaveProperty('support-bot');
  });
});
