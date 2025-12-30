import { expect, test, describe } from 'vitest';
import { llmops, basicAuth } from '../src';

describe('llmops', () => {
  test('should be a function', () => {
    expect(typeof llmops).toBe('function');
  });
});

describe('basicAuth', () => {
  test('should be exported', () => {
    expect(typeof basicAuth).toBe('function');
  });
});
