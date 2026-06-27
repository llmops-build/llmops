/**
 * The eval DATA contracts, shared so a dataset can come from anywhere — an
 * inline array, a CSV/JSONL file, or a live `TelemetryReader` query (see
 * `TelemetryReader.dataset` in `../telemetry/reader`).
 *
 * `@llmops/sdk/eval` re-exports these as its public types; the store packages
 * implement the telemetry→dataset bridge. `evaluate()` only ever sees
 * `EvaluationDataset`, so it does not care where the rows came from.
 */

/** One example: inputs, an optional ground-truth target, optional metadata. */
export interface Datapoint<
  D = Record<string, unknown>,
  T = Record<string, unknown>,
> {
  data: D;
  target?: T;
  metadata?: Record<string, unknown>;
}

/**
 * Any source of datapoints. Implemented by the built-in inline-array wrapper
 * and by the telemetry-backed dataset; `evaluate()` consumes this interface and
 * nothing more.
 */
export interface EvaluationDataset<
  D = Record<string, unknown>,
  T = Record<string, unknown>,
> {
  size(): number | Promise<number>;
  get(index: number): Datapoint<D, T> | Promise<Datapoint<D, T>>;
  slice(
    start: number,
    end: number,
  ): Datapoint<D, T>[] | Promise<Datapoint<D, T>[]>;
}
