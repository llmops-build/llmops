import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { evaluate } from './evaluate';

const tempDirs: string[] = [];

function outputDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'llmops-eval-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('evaluate', () => {
  it('keeps duplicate datapoints in their original positions', async () => {
    const datapoint = { data: { value: 2 }, target: 4 };
    const result = await evaluate({
      name: 'duplicates',
      data: [datapoint, datapoint],
      executor: async ({ value }) => value * 2,
      evaluators: {
        exact: (output, target) => (output === target ? 1 : 0),
      },
      outputDir: outputDir(),
    });

    expect('results' in result && result.results).toHaveLength(2);
    expect(
      'results' in result && result.results.map((row) => row.output),
    ).toEqual([4, 4]);
  });

  it('scores null as a valid executor output', async () => {
    const result = await evaluate({
      name: 'null-output',
      data: [{ data: 'input' }],
      executor: async () => null,
      evaluators: {
        isNull: (output) => (output === null ? 1 : 0),
      },
      outputDir: outputDir(),
    });

    expect('scores' in result && result.scores.isNull.mean).toBe(1);
  });

  it('rejects invalid concurrency instead of hanging', async () => {
    await expect(
      evaluate({
        name: 'invalid-concurrency',
        data: [{ data: 'input' }],
        executor: async (data) => data,
        evaluators: {},
        concurrency: 0,
        outputDir: outputDir(),
      }),
    ).rejects.toThrow('concurrency must be a positive integer');
  });

  it('writes a complete JSON result for CI consumption', async () => {
    const dir = outputDir();
    const result = await evaluate({
      name: 'persisted',
      data: [{ data: 2, target: 4 }],
      executor: async (value) => value * 2,
      evaluators: {
        exact: (output, target) => (output === target ? 1 : 0),
      },
      outputDir: dir,
    });

    const [file] = readdirSync(join(dir, 'persisted'));
    const stored = JSON.parse(
      readFileSync(join(dir, 'persisted', file), 'utf8'),
    );
    expect(stored.runId).toBe(result.runId);
    expect(stored.scores.exact.mean).toBe(1);
  });

  it('counts evaluator failures instead of reporting a false pass', async () => {
    const result = await evaluate({
      name: 'evaluator-error',
      data: [{ data: 'input' }],
      executor: async (data) => data,
      evaluators: {
        broken: () => {
          throw new Error('judge unavailable');
        },
      },
      outputDir: outputDir(),
    });

    expect('errors' in result && result.errors).toBe(1);
    expect('results' in result && result.results[0].error).toContain(
      'evaluator "broken": judge unavailable',
    );
  });
});
