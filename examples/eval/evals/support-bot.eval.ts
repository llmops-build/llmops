/**
 * Example: evaluate a support bot's responses.
 *
 * Run with:
 *   npx @llmops/cli eval -t evals/support-bot.eval.ts
 *
 * Or run all evals:
 *   npx @llmops/cli eval
 */
import { evaluate } from '@llmops/sdk/eval';

async function main() {
  await evaluate({
    name: 'support-bot',
    data: [
      {
        data: { question: 'How do I reset my password?' },
        target: { answer: 'Go to settings, then security, and click reset password.' },
      },
      {
        data: { question: 'What are your hours?' },
        target: { answer: 'We are open 9am to 5pm, Monday through Friday.' },
      },
      {
        data: { question: 'Can I get a refund?' },
        target: { answer: 'Yes, refunds are available within 30 days of purchase.' },
      },
      {
        data: { question: 'How do I contact support?' },
        target: { answer: 'Email us at support@example.com or call 1-800-EXAMPLE.' },
      },
    ],

    // The function under test — replace with your actual LLM call
    executor: async (data) => {
      const responses: Record<string, string> = {
        'How do I reset my password?': 'Navigate to Settings > Security and click Reset Password.',
        'What are your hours?': 'Our hours are 9am-5pm Monday to Friday.',
        'Can I get a refund?': 'Refunds are available within 30 days.',
        'How do I contact support?': 'Reach us at support@example.com.',
      };
      return responses[data.question] ?? 'I don\'t know.';
    },

    evaluators: {
      exactMatch: (output, target) => {
        return output === target?.answer ? 1 : 0;
      },

      keywordOverlap: (output, target) => {
        if (!target?.answer) return 0;
        const expected = target.answer.toLowerCase().split(/\s+/);
        const actual = (output as string).toLowerCase();
        const matches = expected.filter((word: string) => actual.includes(word));
        return matches.length / expected.length;
      },

      adequateLength: (output) => {
        const len = (output as string).length;
        if (len > 20) return 1;
        if (len > 10) return 0.5;
        return 0;
      },

      mentionsContext: (output, _target, data) => {
        const question = (data?.question as string)?.toLowerCase() ?? '';
        const keywords = question.split(/\s+/).filter((w: string) => w.length > 3);
        const response = (output as string).toLowerCase();
        const matches = keywords.filter((w: string) => response.includes(w));
        return keywords.length > 0 ? matches.length / keywords.length : 0;
      },
    },
  });
}

main();
