import { expect, test, describe } from 'vitest';
import { llmops } from '../src';

describe('llmops', () => {
  test('should be a function', () => {
    expect(typeof llmops).toBe('function');
  });
});
