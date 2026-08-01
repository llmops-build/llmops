import type { Datapoint } from '@llmops/core';

// `Datapoint` now lives in @llmops/core (the shared spine). Re-exported here so
// existing `@llmops/sdk/eval` type imports keep resolving from one source.
export type { Datapoint };

/**
 * An evaluator scores executor output.
 * Returns a single number (0-1) or an object of named scores.
 */
export type Evaluator<O = unknown, T = unknown, D = unknown> = (
  output: O,
  target?: T,
  data?: D,
) => number | Record<string, number> | Promise<number | Record<string, number>>;

/**
 * An executor is the function under test.
 */
export type Executor<D = Record<string, unknown>, O = unknown> = (
  data: D,
) => O | Promise<O>;

/**
 * Configuration for evaluate().
 */
export interface EvaluateOptions<D, T, O> {
  /** Name of this evaluation run. Required. */
  name: string;

  /** Dataset — inline array of datapoints or an EvaluationDataset */
  data: Datapoint<D, T>[] | import('./dataset').EvaluationDataset<D, T>;

  /** The function under test. Provide either executor or variants, not both. */
  executor?: Executor<D, O>;

  /** Named variants for side-by-side comparison. Keys become variant labels. */
  variants?: Record<string, Executor<D, O>>;

  /** Named evaluator functions. Keys become score names. */
  evaluators: Record<string, Evaluator<O, T>>;

  /** Maximum concurrent datapoints. Default: 5 */
  concurrency?: number;

  /** Group name for tracking score progression across runs. */
  group?: string;

  /** Metadata attached to the entire run. */
  metadata?: Record<string, unknown>;

  /** Output directory for JSON results. Default: './llmops-evals' */
  outputDir?: string;
}

/**
 * Result for a single datapoint.
 */
export interface DatapointResult<D = unknown, O = unknown> {
  data: D;
  target?: unknown;
  metadata?: Record<string, unknown>;
  output: O;
  scores: Record<string, number>;
  durationMs: number;
  error?: string;
}

/**
 * Aggregated score statistics for one evaluator.
 */
export interface ScoreStats {
  mean: number;
  min: number;
  max: number;
  median: number;
  count: number;
}

/**
 * Summary of an evaluation run.
 */
export interface EvaluateResult<D = unknown, O = unknown> {
  name: string;
  runId: string;
  group?: string;
  scores: Record<string, ScoreStats>;
  durationMs: number;
  count: number;
  errors: number;
  metadata?: Record<string, unknown>;
  results: DatapointResult<D, O>[];
}

/**
 * When variants are used, wraps per-variant results.
 */
export interface VariantEvaluateResult<D = unknown, O = unknown> {
  name: string;
  runId: string;
  group?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
  variants: Record<string, EvaluateResult<D, O>>;
}

/**
 * Options for compare().
 */
export interface CompareOptions {
  /** Paths to eval result JSON files. First is baseline, second is candidate. */
  files: [string, string];
}

/**
 * Per-evaluator delta between two runs.
 */
export interface ScoreDelta {
  baseline: number;
  candidate: number;
  delta: number;
}

/**
 * Result of comparing two runs.
 */
export interface CompareResult {
  baseline: string;
  candidate: string;
  scores: Record<string, ScoreDelta>;
  regressions: Array<{
    data: unknown;
    evaluator: string;
    baselineScore: number;
    candidateScore: number;
  }>;
  improvements: Array<{
    data: unknown;
    evaluator: string;
    baselineScore: number;
    candidateScore: number;
  }>;
}

/**
 * Options for applyGate().
 */
export interface GateOptions {
  /**
   * Minimum mean score required per evaluator name, keyed by evaluator name
   * as it appears in `EvaluateResult.scores`. A result whose mean is below
   * the threshold fails the gate. Thresholds must be finite numbers in [0, 1].
   *
   * An evaluator named here that appears in no candidate result fails the
   * gate rather than being skipped.
   */
  minScore?: Record<string, number>;

  /**
   * Baseline runs to diff against, keyed by `EvaluateResult.name`. Evaluators
   * present in both the baseline and the candidate are compared. A baseline
   * eval with no matching candidate, or a baseline evaluator that produced no
   * score in the candidate, fails the gate rather than being skipped;
   * evaluators only the candidate has count as new coverage.
   *
   * Passing an empty record throws — a regression gate that can compare
   * nothing must not report success.
   */
  baseline?: Record<string, EvaluateResult>;

  /**
   * Maximum allowed drop in an evaluator's mean score vs its baseline
   * before failing. Must be a finite number in [0, 1]. Default: 0
   * (no regression allowed).
   */
  maxRegression?: number;
}

/**
 * A single check performed by applyGate().
 *
 * - `min-score` — an evaluator's mean vs a configured threshold
 * - `regression` — an evaluator's mean vs its baseline
 * - `baseline-missing` — a baseline eval absent from the candidate run
 * - `evaluator-missing` — an evaluator in a matched baseline eval that produced
 *   no score in the candidate run. Evaluators only the candidate has are new
 *   coverage and are not reported.
 * - `errors` — a candidate eval that recorded datapoint/evaluator errors
 */
export interface GateCheck {
  /** `EvaluateResult.name` this check ran against. */
  eval: string;
  /** Evaluator name (key in `EvaluateResult.scores`). Absent for whole-eval checks. */
  evaluator?: string;
  type:
    | 'min-score'
    | 'regression'
    | 'baseline-missing'
    | 'evaluator-missing'
    | 'errors';
  score?: number;
  threshold?: number;
  baseline?: number;
  candidate?: number;
  delta?: number;
  maxRegression?: number;
  /** Number of failed datapoints, for `errors` checks. */
  errors?: number;
  passed: boolean;
  /** Human-readable reason, set for checks that fail closed rather than on a number. */
  message?: string;
}

/**
 * Result of applyGate(). `passed` is true only when every check passed.
 *
 * A gate that produced no checks at all is reported as `passed: false` —
 * a gate that verified nothing has not been satisfied.
 */
export interface GateResult {
  passed: boolean;
  checks: GateCheck[];
}

/**
 * Options for judgeScorer().
 */
export interface JudgeScorerOptions {
  /** Model identifier — routed through the gateway. e.g. '@openai/gpt-4o' */
  model: string;

  /**
   * Grading prompt. Supports {{output}}, {{target}}, {{target.*}},
   * {{data}}, {{data.*}} placeholders.
   *
   * This becomes the user message. A system message is added automatically
   * that instructs the LLM to return a JSON score.
   */
  prompt: string;

  /**
   * The llmops client instance. The judge call is routed through the
   * gateway and traced like any other LLM call.
   *
   * ```ts
   * const client = llmops({ telemetry: pgStore(url) })
   * judgeScorer({ model: '@openai/gpt-4o', prompt: '...', client })
   * ```
   */
  client: import('../client').LLMOpsClient;

  /**
   * Custom system message. Overrides the default grading instructions.
   * If omitted, a default system message is used that instructs
   * the LLM to return JSON with a "score" field (0-1).
   */
  system?: string;

  /** Temperature for the judge LLM. Default: 0 (deterministic). */
  temperature?: number;

  /** Max retries on parse failure. Default: 1. */
  maxRetries?: number;

  /**
   * Custom parser for extracting score from LLM response.
   * Default: expects JSON with a `score` field.
   */
  parse?: (response: string) => number | Record<string, number>;
}
