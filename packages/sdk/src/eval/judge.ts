import type { Evaluator, JudgeScorerOptions } from './types';

/**
 * Simple mustache-style template interpolation.
 */
function interpolate(
  template: string,
  vars: Record<string, unknown>,
): string {
  return template.replace(
    /\{\{(\w+(?:\.\w+)*)\}\}/g,
    (_, path: string) => {
      const value = path
        .split('.')
        .reduce((obj: any, key: string) => obj?.[key], vars);
      return typeof value === 'string' ? value : JSON.stringify(value);
    },
  );
}

/**
 * Default parser: expects JSON with a `score` field, a bare number,
 * or an object of number values (multi-score).
 */
function defaultParse(
  response: string,
): number | Record<string, number> {
  const cleaned = response.replace(/```json\n?|```/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (typeof parsed === 'number') return parsed;
  if (typeof parsed?.score === 'number') return parsed.score;
  if (typeof parsed === 'object' && parsed !== null) {
    const entries = Object.entries(parsed).filter(
      ([, v]) => typeof v === 'number',
    );
    if (entries.length > 0) {
      return Object.fromEntries(entries) as Record<string, number>;
    }
  }

  throw new Error(
    `Could not extract score from judge response: ${response.slice(0, 200)}`,
  );
}

/**
 * Factory that returns an Evaluator which uses an LLM to score output.
 *
 * Usage:
 * ```ts
 * const accuracy = judgeScorer({
 *   model: '@openai/gpt-4o',
 *   prompt: 'Rate accuracy 0-1. Expected: {{target.answer}} Actual: {{output}}',
 *   ops,
 * })
 * ```
 */
export function judgeScorer(options: JudgeScorerOptions): Evaluator {
  const { model, prompt, ops, parse = defaultParse } = options;

  return async (
    output: unknown,
    target?: unknown,
  ): Promise<number | Record<string, number>> => {
    // Build template variables
    const vars: Record<string, unknown> = {
      output: typeof output === 'string' ? output : JSON.stringify(output),
      target,
    };

    // Spread target fields for {{target.fieldName}} access
    if (target && typeof target === 'object') {
      for (const [k, v] of Object.entries(target)) {
        vars[`target.${k}`] = v;
      }
    }

    const renderedPrompt = interpolate(prompt, vars);

    // Call LLM via the gateway
    const providerConfig = ops.provider();
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
          messages: [{ role: 'user', content: renderedPrompt }],
          response_format: { type: 'json_object' },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `Judge LLM call failed: ${response.status} ${await response.text()}`,
      );
    }

    const body = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = body.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Judge LLM returned empty response');
    }

    return parse(content);
  };
}
