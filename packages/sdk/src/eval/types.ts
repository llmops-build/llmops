/**
 * A single datapoint in a dataset.
 */
export interface Datapoint<D = Record<string, unknown>, T = Record<string, unknown>> {
  data: D;
  target?: T;
  metadata?: Record<string, unknown>;
}

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
  /** Run IDs to compare. First is baseline. */
  runs: string[];
  /** Directory where eval results are stored. Default: './llmops-evals' */
  outputDir?: string;
  /** Eval name to search within. Required. */
  name: string;
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
 * Options for judgeScorer().
 */
export interface JudgeScorerOptions {
  /** Model identifier — routed through the gateway. e.g. '@openai/gpt-4o' */
  model: string;
  /** Prompt template. Supports {{output}}, {{target}}, {{target.*}} placeholders. */
  prompt: string;
  /** The llmops client instance. Judge call routed through gateway. */
  ops: import('../client').LLMOpsClient;
  /** Custom parser for extracting score from LLM response. */
  parse?: (response: string) => number | Record<string, number>;
}
