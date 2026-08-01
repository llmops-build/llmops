import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { EvaluateResult } from '@llmops/sdk/eval';

/**
 * Parses a `--minScore` spec string like `"accuracy=0.8,exact=0.95"` into
 * `{ accuracy: 0.8, exact: 0.95 }`. Throws on malformed entries so typos
 * fail fast instead of silently skipping a threshold.
 */
export function parseMinScoreSpec(spec: string): Record<string, number> {
  const thresholds: Record<string, number> = {};

  for (const rawPair of spec.split(',')) {
    const pair = rawPair.trim();
    if (!pair) continue;

    const eq = pair.indexOf('=');
    const name = eq === -1 ? '' : pair.slice(0, eq).trim();
    const value = eq === -1 ? Number.NaN : Number(pair.slice(eq + 1).trim());

    if (!name || Number.isNaN(value)) {
      throw new Error(
        `Invalid --minScore entry "${pair}". Expected format "evaluator=threshold", e.g. "accuracy=0.8".`,
      );
    }

    thresholds[name] = value;
  }

  if (Object.keys(thresholds).length === 0) {
    throw new Error(
      '--minScore requires at least one "evaluator=threshold" entry.',
    );
  }

  return thresholds;
}

interface ResultFile {
  /** Eval name, reconstructed from its path relative to the results dir. */
  name: string;
  path: string;
  timestamp: number;
}

function collectResultFiles(dir: string, base: string): ResultFile[] {
  const files: ResultFile[] = [];
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectResultFiles(full, base));
      continue;
    }
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;

    const timestamp = Number(entry.name.slice(0, -'.json'.length));
    if (Number.isNaN(timestamp)) continue;

    const name = relative(base, dir).split(sep).join('/');
    files.push({ name, path: full, timestamp });
  }

  return files;
}

/**
 * Loads the most recent saved eval result per eval name from a results
 * directory (the layout produced by evaluate()'s outputDir). When
 * `sinceTimestamp` is given, only files written at or after that time are
 * considered — used to isolate the results produced by the current `eval`
 * invocation from older runs left in the same directory.
 */
export function loadLatestResults(
  dir: string,
  sinceTimestamp?: number,
): Record<string, EvaluateResult> {
  if (!existsSync(dir)) return {};

  const files = collectResultFiles(dir, dir).filter(
    (f) => sinceTimestamp === undefined || f.timestamp >= sinceTimestamp,
  );

  const latestByName = new Map<string, ResultFile>();
  for (const file of files) {
    const existing = latestByName.get(file.name);
    if (!existing || file.timestamp > existing.timestamp) {
      latestByName.set(file.name, file);
    }
  }

  const results: Record<string, EvaluateResult> = {};
  for (const [name, file] of latestByName) {
    results[name] = JSON.parse(readFileSync(file.path, 'utf8'));
  }
  return results;
}
