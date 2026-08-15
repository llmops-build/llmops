import { SupportedProviders } from './supported-providers';
import type { InlineProviderConfig } from './provider-configs';
import type { PROVIDER_METADATA } from './metadata';

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
 * Top providers with simple API key authentication that can actually route.
 *
 * A provider is only auto-detected when ALL of the following hold:
 * 1. It has an entry in {@link PROVIDER_METADATA}.
 * 2. It either (a) is OpenAI-compatible (`openaiCompatible: true`) OR
 *    (b) has a dedicated adapter in the gateway.
 * 3. It has a static base URL (providers needing region/resource info like
 *    Azure, Bedrock, Vertex are excluded).
 *
 * Divergent providers (Anthropic, Cohere, Replicate, …) are NOT listed here
 * until a dedicated gateway adapter lands. They can still be used explicitly
 * via `providers` + `config.adapters`.
 */
export const DEFAULT_PROVIDER_MAPPINGS: DefaultProviderMapping[] = [
  // Tier 1: Most popular — OpenAI-compatible
  {
    provider: SupportedProviders.OPENAI,
    slug: 'openai',
    envVar: 'OPENAI_API_KEY',
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

  // Tier 2: Popular alternatives — OpenAI-compatible
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

  // Tier 3: Other notable providers — OpenAI-compatible
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
  env: Record<string, string | undefined> = process.env,
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
  env: Record<string, string | undefined> = process.env,
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
  (m) => m.envVar,
);
