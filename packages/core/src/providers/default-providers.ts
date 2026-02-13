import { SupportedProviders } from './supported-providers';
import type { InlineProviderConfig } from './provider-configs';

/**
 * Default provider configuration mapping.
 * Maps environment variable names to provider configs.
 *
 * When the env var is set, the provider is auto-configured with that slug.
 * User-configured providers always take precedence over defaults.
 */
interface DefaultProviderMapping {
  /** Provider type */
  provider: SupportedProviders;
  /** Default slug (used as @slug/model) */
  slug: string;
  /** Environment variable name for API key */
  envVar: string;
}

/**
 * Top providers with simple API key authentication.
 * Providers requiring additional config (Azure, Bedrock, Vertex) are excluded
 * as they need endpoint/region info that can't be auto-detected.
 */
const DEFAULT_PROVIDER_MAPPINGS: DefaultProviderMapping[] = [
  // Tier 1: Most popular
  {
    provider: SupportedProviders.OPENAI,
    slug: 'openai',
    envVar: 'OPENAI_API_KEY',
  },
  {
    provider: SupportedProviders.ANTHROPIC,
    slug: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
  },
  {
    provider: SupportedProviders.GOOGLE,
    slug: 'google',
    envVar: 'GOOGLE_API_KEY',
  },
  {
    provider: SupportedProviders.MISTRAL_AI,
    slug: 'mistral',
    envVar: 'MISTRAL_API_KEY',
  },
  {
    provider: SupportedProviders.GROQ,
    slug: 'groq',
    envVar: 'GROQ_API_KEY',
  },

  // Tier 2: Popular alternatives
  {
    provider: SupportedProviders.COHERE,
    slug: 'cohere',
    envVar: 'COHERE_API_KEY',
  },
  {
    provider: SupportedProviders.TOGETHER_AI,
    slug: 'together',
    envVar: 'TOGETHER_API_KEY',
  },
  {
    provider: SupportedProviders.PERPLEXITY_AI,
    slug: 'perplexity',
    envVar: 'PERPLEXITY_API_KEY',
  },
  {
    provider: SupportedProviders.DEEPSEEK,
    slug: 'deepseek',
    envVar: 'DEEPSEEK_API_KEY',
  },
  {
    provider: SupportedProviders.FIREWORKS_AI,
    slug: 'fireworks',
    envVar: 'FIREWORKS_API_KEY',
  },

  // Tier 3: Other notable providers
  {
    provider: SupportedProviders.OPENROUTER,
    slug: 'openrouter',
    envVar: 'OPENROUTER_API_KEY',
  },
  {
    provider: SupportedProviders.X_AI,
    slug: 'xai',
    envVar: 'XAI_API_KEY',
  },
  {
    provider: SupportedProviders.CEREBRAS,
    slug: 'cerebras',
    envVar: 'CEREBRAS_API_KEY',
  },
  {
    provider: SupportedProviders.SAMBANOVA,
    slug: 'sambanova',
    envVar: 'SAMBANOVA_API_KEY',
  },
  {
    provider: SupportedProviders.HUGGINGFACE,
    slug: 'huggingface',
    envVar: 'HUGGINGFACE_API_KEY',
  },
  {
    provider: SupportedProviders.REPLICATE,
    slug: 'replicate',
    envVar: 'REPLICATE_API_TOKEN',
  },
  {
    provider: SupportedProviders.AI21,
    slug: 'ai21',
    envVar: 'AI21_API_KEY',
  },
  {
    provider: SupportedProviders.DEEPINFRA,
    slug: 'deepinfra',
    envVar: 'DEEPINFRA_API_KEY',
  },
];

/**
 * Get default provider configurations from environment variables.
 *
 * Scans for known API key environment variables and creates
 * InlineProviderConfig entries for each one found.
 *
 * @param env - Environment variables object (defaults to process.env)
 * @returns Array of auto-configured providers
 *
 * @example
 * ```typescript
 * // With OPENAI_API_KEY and ANTHROPIC_API_KEY set in environment:
 * const defaults = getDefaultProviders();
 * // Returns:
 * // [
 * //   { provider: 'openai', slug: 'openai', apiKey: '...' },
 * //   { provider: 'anthropic', slug: 'anthropic', apiKey: '...' }
 * // ]
 * ```
 */
export function getDefaultProviders(
  env: Record<string, string | undefined> = process.env
): InlineProviderConfig[] {
  const providers: InlineProviderConfig[] = [];

  for (const mapping of DEFAULT_PROVIDER_MAPPINGS) {
    const apiKey = env[mapping.envVar];
    if (apiKey) {
      providers.push({
        provider: mapping.provider,
        slug: mapping.slug,
        apiKey,
      });
    }
  }

  return providers;
}

/**
 * Merge user-provided providers with default providers.
 *
 * User-provided providers take precedence:
 * - If a user specifies a provider with the same slug, the default is ignored
 * - If a user specifies the same provider type with a different slug, both are kept
 *
 * @param userProviders - User-configured providers (may be undefined)
 * @param env - Environment variables object (defaults to process.env)
 * @returns Merged array of providers (user configs + non-conflicting defaults)
 *
 * @example
 * ```typescript
 * // User overrides openai with custom slug
 * const merged = mergeWithDefaultProviders([
 *   { provider: 'openai', slug: 'my-openai', apiKey: 'custom-key' }
 * ]);
 * // Default 'openai' slug is still added if OPENAI_API_KEY is set,
 * // user's 'my-openai' is kept as separate config
 * ```
 */
export function mergeWithDefaultProviders(
  userProviders: InlineProviderConfig[] | undefined,
  env: Record<string, string | undefined> = process.env
): InlineProviderConfig[] {
  const defaults = getDefaultProviders(env);

  if (!userProviders || userProviders.length === 0) {
    return defaults;
  }

  // Get slugs already defined by user
  const userSlugs = new Set(userProviders.map((p) => p.slug));

  // Filter out defaults that would conflict with user-defined slugs
  const nonConflictingDefaults = defaults.filter((d) => !userSlugs.has(d.slug));

  // User providers come first (higher priority), then defaults
  return [...userProviders, ...nonConflictingDefaults];
}

/**
 * List of supported default provider environment variables.
 * Useful for documentation or debugging.
 */
export const DEFAULT_PROVIDER_ENV_VARS = DEFAULT_PROVIDER_MAPPINGS.map(
  (m) => m.envVar
);
