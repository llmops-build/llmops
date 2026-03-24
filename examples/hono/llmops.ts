import { llmops, pgStore } from '@llmops/sdk';
import { env } from 'node:process';

export default llmops({
  basePath: '/llmops',
  telemetry: pgStore(env.POSTGRES_URL || ''),

  // Providers are auto-detected from environment variables!
  // If OPENAI_API_KEY is set, @openai/model works automatically.
  // If ANTHROPIC_API_KEY is set, @anthropic/model works automatically.
  // Supported auto-detection env vars:
  //   OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, MISTRAL_API_KEY,
  //   GROQ_API_KEY, COHERE_API_KEY, TOGETHER_API_KEY, PERPLEXITY_API_KEY,
  //   DEEPSEEK_API_KEY, FIREWORKS_API_KEY, OPENROUTER_API_KEY, XAI_API_KEY, etc.

  // Explicit providers override auto-detected ones with the same slug:
  // providers: [
  //   {
  //     provider: 'openai',
  //     slug: 'my-openai', // Custom slug: use @my-openai/gpt-4.1-nano
  //     apiKey: env.CUSTOM_OPENAI_KEY || '',
  //   },
  // ],
});
