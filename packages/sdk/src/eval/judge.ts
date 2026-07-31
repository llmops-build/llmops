import type { Evaluator, JudgeScorerOptions } from './types';

// ─── Template interpolation ─────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path: string) => {
    const value = path
      .split('.')
      .reduce((obj: any, key: string) => obj?.[key], vars);
    if (value === undefined || value === null) return '';
    return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  });
}

function buildVars(
  output: unknown,
  target?: unknown,
  data?: unknown,
): Record<string, unknown> {
  return { output, target, data };
}

// ─── Default system message ─────────────────────────────────────────────────

const DEFAULT_SYSTEM = `You are an expert evaluator. Your job is to grade an AI system's output.

Instructions:
- Read the grading criteria in the user message carefully.
- Evaluate the output objectively.
- Return ONLY valid JSON. No markdown, no explanation outside the JSON.
- The JSON must contain a "score" field with a number between 0.0 and 1.0.
- You may optionally include a "reasoning" field with a brief explanation.

Example response:
{"score": 0.85, "reasoning": "The response is mostly accurate but misses one detail."}`;

// ─── Response parser ────────────────────────────────────────────────────────

function defaultParse(response: string): number | Record<string, number> {
  // Strip markdown code fences if present
  let cleaned = response
    .replace(/```(?:json)?\n?/g, '')
    .replace(/```$/g, '')
    .trim();

  // Try to extract JSON from the response (handle LLMs that add text around it)
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);

  // Single score: { "score": 0.8 } or { "score": 0.8, "reasoning": "..." }
  if (typeof parsed?.score === 'number') {
    return Math.max(0, Math.min(1, parsed.score));
  }

  // Bare number
  if (typeof parsed === 'number') {
    return Math.max(0, Math.min(1, parsed));
  }

  // Multi-score: { "accuracy": 0.8, "relevance": 0.9, "reasoning": "..." }
  if (typeof parsed === 'object' && parsed !== null) {
    const entries = Object.entries(parsed).filter(
      ([k, v]) => typeof v === 'number' && k !== 'reasoning',
    );
    if (entries.length > 0) {
      return Object.fromEntries(
        entries.map(([k, v]) => [k, Math.max(0, Math.min(1, v as number))]),
      ) as Record<string, number>;
    }
  }

  throw new Error(
    `Could not extract score from judge response: ${response.slice(0, 300)}`,
  );
}

// ─── LLM call ───────────────────────────────────────────────────────────────

async function callLLM(
  client: JudgeScorerOptions['client'],
  model: string,
  system: string,
  userMessage: string,
  temperature: number,
): Promise<string> {
  const providerConfig = client.provider();

  const response = await providerConfig.fetch(
    `${providerConfig.baseURL}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${providerConfig.apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userMessage },
        ],
      }),
    },
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown error');
    throw new Error(
      `Judge LLM call failed (${response.status}): ${errorBody.slice(0, 300)}`,
    );
  }

  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = body.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Judge LLM returned empty response');
  }

  return content;
}

// ─── judgeScorer ────────────────────────────────────────────────────────────

/**
 * Factory that returns an Evaluator which uses an LLM to score output.
 *
 * The judge:
 * - Uses a system message that instructs the LLM to return JSON scores
 * - Interpolates {{output}}, {{target}}, {{data}} and their fields in the prompt
 * - Uses temperature 0 by default for deterministic scoring
 * - Retries on parse failure (configurable)
 * - Clamps scores to [0, 1]
 *
 * Usage:
 * ```ts
 * import { llmops } from '@llmops/sdk'
 *
 * const client = llmops()
 * const accuracy = judgeScorer({
 *   model: '@openai/gpt-4o',
 *   prompt: `Rate the accuracy of this response.
 * Expected: {{target.answer}}
 * Actual: {{output}}`,
 *   client,
 * })
 * ```
 */
export function judgeScorer(options: JudgeScorerOptions): Evaluator {
  const {
    model,
    prompt,
    client,
    system = DEFAULT_SYSTEM,
    temperature = 0,
    maxRetries = 1,
    parse = defaultParse,
  } = options;

  return async (
    output: unknown,
    target?: unknown,
    data?: unknown,
  ): Promise<number | Record<string, number>> => {
    const vars = buildVars(output, target, data);
    const userMessage = interpolate(prompt, vars);

    let lastError: Error | null = null;
    const attempts = 1 + maxRetries;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const content = await callLLM(
          client,
          model,
          system,
          userMessage,
          temperature,
        );
        return parse(content);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        // Only retry on parse errors, not on HTTP/network errors
        if (lastError.message.includes('Judge LLM call failed')) {
          throw lastError;
        }
      }
    }

    throw lastError ?? new Error('Judge scoring failed');
  };
}
