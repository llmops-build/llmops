import type { Datapoint, EvaluationDataset } from '@llmops/core';

// `EvaluationDataset` and `Datapoint` are defined in @llmops/core (the shared
// spine), so a telemetry-backed dataset and an inline array satisfy the same
// contract. Re-exported here so existing `@llmops/sdk/eval` imports resolve.
export type { EvaluationDataset };

/**
 * Wraps a plain array as an EvaluationDataset.
 */
export class InlineDataset<D, T> implements EvaluationDataset<D, T> {
  constructor(private items: Datapoint<D, T>[]) {}

  size() {
    return this.items.length;
  }

  get(index: number) {
    return this.items[index];
  }

  slice(start: number, end: number) {
    return this.items.slice(start, end);
  }
}
