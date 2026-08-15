import { llmops } from '@llmops/sdk';
import { pgStore } from '@llmops/sdk/store/pg';
import { env } from 'node:process';

export default llmops({
  basePath: '/llmops',
  telemetry: env.POSTGRES_URL ? pgStore(env.POSTGRES_URL) : undefined,

  // Providers are auto-detected from environment variables!
  // Only OpenAI-compatible providers with static base URLs are auto-detected:
  //   OPENAI_API_KEY, GOOGLE_API_KEY, MISTRAL_API_KEY, GROQ_API_KEY,
  //   TOGETHER_API_KEY, PERPLEXITY_API_KEY, DEEPSEEK_API_KEY,
  //   FIREWORKS_API_KEY, OPENROUTER_API_KEY, XAI_API_KEY,
  //   CEREBRAS_API_KEY, SAMBANOVA_API_KEY, AI21_API_KEY, DEEPINFRA_API_KEY

  // Explicit providers override auto-detected ones with the same slug:
  // providers: [
  //   {
  //     provider: 'openai',
  //     slug: 'my-openai', // Custom slug: use @my-openai/gpt-4.1-nano
  //     apiKey: env.CUSTOM_OPENAI_KEY || '',
  //   },
  // ],
});
