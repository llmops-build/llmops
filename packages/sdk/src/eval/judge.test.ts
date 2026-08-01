import { describe, expect, it, vi } from 'vitest';
import type { LLMOpsClient } from '../client';
import { judgeScorer } from './judge';

function client(fetch: typeof globalThis.fetch): LLMOpsClient {
  return {
    provider: () => ({
      apiKey: 'llmops',
      baseURL: 'http://llmops.test/api/genai/v1',
      fetch,
    }),
  } as LLMOpsClient;
}

describe('judgeScorer', () => {
  it('routes the judge through the gateway and interpolates inputs', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe('@openai/gpt-4o-mini');
        expect(body.messages[1].content).toContain('Expected: Paris');
        expect(body.messages[1].content).toContain('Actual: Paris');
        return Response.json({
          choices: [{ message: { content: '{"score":0.9}' } }],
        });
      },
    );
    const scorer = judgeScorer({
      model: '@openai/gpt-4o-mini',
      prompt: 'Expected: {{target.answer}} Actual: {{output}}',
      client: client(fetchMock as typeof globalThis.fetch),
    });

    await expect(
      scorer('Paris', { answer: 'Paris' }, { question: 'Capital?' }),
    ).resolves.toBe(0.9);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('retries parse failures and clamps the returned score', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { content: 'not json' } }] }),
      )
      .mockResolvedValueOnce(
        Response.json({ choices: [{ message: { content: '{"score":2}' } }] }),
      );
    const scorer = judgeScorer({
      model: '@openai/gpt-4o-mini',
      prompt: '{{output}}',
      client: client(fetchMock as typeof globalThis.fetch),
      maxRetries: 1,
    });

    await expect(scorer('answer')).resolves.toBe(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry upstream HTTP failures', async () => {
    const fetchMock = vi.fn(async () => new Response('quota', { status: 429 }));
    const scorer = judgeScorer({
      model: '@openai/gpt-4o-mini',
      prompt: '{{output}}',
      client: client(fetchMock as typeof globalThis.fetch),
      maxRetries: 2,
    });

    await expect(scorer('answer')).rejects.toThrow(
      'Judge LLM call failed (429)',
    );
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
