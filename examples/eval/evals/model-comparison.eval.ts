/**
 * Example: compare two model variants side by side.
 *
 * Run with:
 *   npx @llmops/cli eval evals/model-comparison.eval.ts
 */
import { evaluate } from '@llmops/sdk/eval';

await evaluate({
  name: 'model-comparison',
  data: [
    { data: { question: 'Explain quantum computing in one sentence.' } },
    { data: { question: 'What is a monad?' } },
    { data: { question: 'Why is the sky blue?' } },
  ],

  // Compare two "models" (simulated here — replace with real LLM calls)
  variants: {
    'concise-model': async (data) => {
      const responses: Record<string, string> = {
        'Explain quantum computing in one sentence.': 'Quantum computing uses qubits.',
        'What is a monad?': 'A monad is a design pattern.',
        'Why is the sky blue?': 'Rayleigh scattering.',
      };
      return responses[data.question] ?? '';
    },
    'verbose-model': async (data) => {
      const responses: Record<string, string> = {
        'Explain quantum computing in one sentence.':
          'Quantum computing leverages quantum mechanical phenomena like superposition and entanglement to process information in ways that classical computers cannot.',
        'What is a monad?':
          'A monad is a design pattern in functional programming that allows you to chain operations together while handling side effects, wrapping values in a context.',
        'Why is the sky blue?':
          'The sky appears blue because molecules in the atmosphere scatter shorter wavelengths of sunlight (blue and violet) more than longer wavelengths, a phenomenon known as Rayleigh scattering.',
      };
      return responses[data.question] ?? '';
    },
  },

  evaluators: {
    // Penalize very short answers
    thoroughness: (output) => {
      const len = (output as string).split(/\s+/).length;
      if (len >= 15) return 1;
      if (len >= 8) return 0.7;
      if (len >= 3) return 0.3;
      return 0;
    },

    // Reward conciseness (under 30 words)
    conciseness: (output) => {
      const len = (output as string).split(/\s+/).length;
      if (len <= 10) return 1;
      if (len <= 20) return 0.8;
      if (len <= 30) return 0.5;
      return 0.2;
    },
  },
});
