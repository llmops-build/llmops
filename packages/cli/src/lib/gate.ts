import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { EvaluateResult, GateResult } from '@llmops/sdk/eval';

/** Exit codes: 0 = pass, 1 = eval execution or configuration error, 2 = gate check failed. */
export const EXIT_OK = 0;
export const EXIT_EVAL_ERROR = 1;
export const EXIT_GATE_FAILURE = 2;

/**
 * Parses a `--minScore` spec string like `"accuracy=0.8,exact=0.95"` into
 * `{ accuracy: 0.8, exact: 0.95 }`. Throws on malformed entries and on
 * thresholds outside [0, 1] so typos fail fast instead of silently
 * weakening or disabling a gate.
 */
export function parseMinScoreSpec(spec: string): Record<string, number> {
  const thresholds: Record<string, number> = {};

  for (const rawPair of spec.split(',')) {
    const pair = rawPair.trim();
    if (!pair) continue;

    const eq = pair.indexOf('=');
    const name = eq === -1 ? '' : pair.slice(0, eq).trim();
    const raw = eq === -1 ? '' : pair.slice(eq + 1).trim();
    const value = raw === '' ? Number.NaN : Number(raw);

    if (!name || !Number.isFinite(value)) {
      throw new Error(
        `Invalid --minScore entry "${pair}". Expected format "evaluator=threshold", e.g. "accuracy=0.8".`,
      );
    }

    if (value < 0 || value > 1) {
      throw new Error(
        `Invalid --minScore threshold for "${name}": ${value}. Thresholds must be between 0 and 1.`,
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

/**
 * Validates `--maxRegression`. Returns the default of 0 when unset.
 */
export function parseMaxRegression(value: number | undefined): number {
  if (value === undefined) return 0;

  if (!Number.isFinite(value)) {
    throw new Error(
      `Invalid --maxRegression: ${value}. Expected a finite number between 0 and 1.`,
    );
  }

  if (value < 0 || value > 1) {
    throw new Error(
      `Invalid --maxRegression: ${value}. Must be between 0 and 1.`,
    );
  }

  return value;
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
 *
 * Throws with the offending path if a result file cannot be read or parsed,
 * so a corrupt baseline surfaces as a configuration error rather than
 * quietly shrinking the set of things the gate checks.
 */
export function loadLatestResults(
  dir: string,
  sinceTimestamp?: number,
): EvaluateResult[] {
  if (!existsSync(dir)) return [];

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

  const results: EvaluateResult[] = [];
  for (const file of latestByName.values()) {
    let parsed: EvaluateResult;
    try {
      parsed = JSON.parse(readFileSync(file.path, 'utf8'));
    } catch (err) {
      throw new Error(
        `Could not read eval result ${file.path}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    results.push(parsed);
  }
  return results;
}

/**
 * Keys results by their recorded eval name, which is what applyGate matches
 * candidates and baselines on.
 */
export function byEvalName(
  results: EvaluateResult[],
): Record<string, EvaluateResult> {
  const map: Record<string, EvaluateResult> = {};
  for (const result of results) {
    map[result.name] = result;
  }
  return map;
}

/**
 * Shape written to stdout under `--json`. Without a gate the eval result(s)
 * are emitted unchanged; with one they are wrapped alongside the gate so a
 * caller can read both from a single parse.
 */
export function buildJsonOutput(
  evalResults: unknown[],
  gate?: GateResult,
): unknown {
  const results = evalResults.length === 1 ? evalResults[0] : evalResults;
  return gate ? { results, gate } : results;
}

/**
 * The CLI's exit contract, as a pure decision:
 * an eval that failed to run outranks a gate verdict, and a gate that did
 * not pass exits 2.
 */
export function resolveExitCode(input: {
  hasErrors: boolean;
  gate?: GateResult;
}): number {
  if (input.hasErrors) return EXIT_EVAL_ERROR;
  if (input.gate && !input.gate.passed) return EXIT_GATE_FAILURE;
  return EXIT_OK;
}
