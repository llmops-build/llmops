import type { Datapoint } from './types';

/**
 * Interface for custom dataset sources.
 * Built-in: inline arrays are wrapped in InlineDataset automatically.
 * Future: CSVDataset, JSONLDataset, S3Dataset.
 */
export interface EvaluationDataset<D = Record<string, unknown>, T = Record<string, unknown>> {
  size(): number | Promise<number>;
  get(index: number): Datapoint<D, T> | Promise<Datapoint<D, T>>;
  slice(start: number, end: number): Datapoint<D, T>[] | Promise<Datapoint<D, T>[]>;
}

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
