/**
 * Example: LLM-as-judge evaluation using the LLMOps gateway.
 *
 * Prerequisites:
 *   - Set OPENAI_API_KEY in .env (or any supported provider key)
 *
 * Run with:
 *   npx @llmops/cli eval -t evals/llm-judge.eval.ts
 */
import { evaluate, judgeScorer } from '@llmops/sdk/eval';
import client from '../llmops';

async function main() {
  await evaluate({
    name: 'llm-judge',
    data: [
      {
        data: { question: 'How do I reset my password?' },
        target: { answer: 'Go to settings, click security, then click reset password.' },
      },
      {
        data: { question: 'What is your return policy?' },
        target: { answer: 'Returns accepted within 30 days with receipt.' },
      },
      {
        data: { question: 'How do I contact support?' },
        target: { answer: 'Email support@example.com or call 1-800-555-0123.' },
      },
    ],

    executor: async (data) => {
      const responses: Record<string, string> = {
        'How do I reset my password?':
          'Navigate to Settings, then Security, and click the Reset Password button.',
        'What is your return policy?':
          'We accept returns within 30 days. Please bring your receipt.',
        'How do I contact support?':
          'You can reach us at support@example.com.',
      };
      return responses[data.question] ?? "I'm not sure about that.";
    },

    evaluators: {
      accuracy: judgeScorer({
        model: '@openai/gpt-4o-mini',
        prompt: `Rate the semantic accuracy of this response.

Question: {{data.question}}
Expected answer: {{target.answer}}
Actual response: {{output}}

Consider whether the response conveys the same information, not exact wording.`,
        client,
      }),

      completeness: judgeScorer({
        model: '@openai/gpt-4o-mini',
        prompt: `Rate how complete this response is.

Expected: {{target.answer}}
Actual: {{output}}

Does the response cover ALL the key information from the expected answer?
A partial answer that misses important details should score lower.`,
        client,
      }),

      hasContent: (output) => {
        return (output as string).length > 10 ? 1 : 0;
      },
    },
  });
}

main();
