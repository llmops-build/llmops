import { getAdapter } from './providers/registry';
import type { ProviderAdapter } from './providers/types';
import { ok, type Result } from './result';
import type {
  ProviderInput,
  ProviderMetadataResolver,
} from './types/config';
import type { ProviderConfig } from './types/provider';
import { type GatewayError, invalidRequest } from './utils/responses';

const MODEL_RE = /^@([^/]+)\/(.+)$/;

export interface ResolvedTarget {
  adapter: ProviderAdapter;
  config: ProviderConfig;
  /** Bare model name (the `@slug/` prefix stripped). */
  model: string;
}

/** Parse the `@slug/model` model string. */
export function parseModel(
  model: unknown,
): Result<{ slug: string; model: string }, GatewayError> {
  if (typeof model !== 'string' || model.length === 0) {
    return invalidRequest('Request field "model" is required.');
  }
  const match = MODEL_RE.exec(model);
  if (!match) {
    return invalidRequest(
      `Model "${model}" must be in "@provider-slug/model" format.`,
    );
  }
  return ok({ slug: match[1], model: match[2] });
}

/** Resolve a slug to a provider target (adapter + config) using the gateway config. */
export async function resolveTarget(
  slug: string,
  model: string,
  providers: Map<string, ProviderInput>,
  options: {
    getProviderMetadata?: ProviderMetadataResolver;
    adapters?: Record<string, ProviderAdapter>;
  } = {},
): Promise<Result<ResolvedTarget, GatewayError>> {
  const input = providers.get(slug);
  if (!input) {
    return invalidRequest(`No provider configured for slug "@${slug}".`);
  }
  const meta = options.getProviderMetadata
    ? await options.getProviderMetadata(input.provider)
    : null;
  const baseURL = input.baseURL ?? meta?.baseURL;
  if (!baseURL) {
    return invalidRequest(
      `No base URL for provider "${input.provider}" — pass "baseURL" or a getProviderMetadata resolver.`,
    );
  }
  const config: ProviderConfig = {
    provider: input.provider,
    apiKey: input.apiKey,
    baseURL,
    forwardHeaders: input.forwardHeaders,
  };
  return ok({
    adapter: getAdapter(input.provider, options.adapters),
    config,
    model,
  });
}
