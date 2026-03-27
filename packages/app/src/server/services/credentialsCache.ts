import type { InlineProvidersConfig } from '@llmops/core';

/**
 * Provider credentials extracted from provider config
 */
export interface ProviderCredentials {
  apiKey?: string;
  customHost?: string;
  // AWS
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsSessionToken?: string;
  awsRegion?: string;
  // Azure
  resourceName?: string;
  deploymentId?: string;
  apiVersion?: string;
  azureAuthMode?: string;
  azureAdToken?: string;
  azureManagedClientId?: string;
  azureWorkloadClientId?: string;
  azureEntraClientId?: string;
  azureEntraClientSecret?: string;
  azureEntraTenantId?: string;
  azureFoundryUrl?: string;
  azureDeploymentName?: string;
  azureApiVersion?: string;
  // Google Vertex AI
  vertexProjectId?: string;
  vertexRegion?: string;
  vertexServiceAccountJson?: Record<string, string>;
  // OpenAI
  openaiOrganization?: string;
  openaiProject?: string;
}

/**
 * Result of getting provider credentials by slug
 */
export interface ProviderCredentialsWithProvider {
  credentials: ProviderCredentials;
  providerId: string;
}

/**
 * Get provider credentials from inline config array by slug.
 * Returns credentials and providerId, or null if not found.
 */
export function getInlineProviderCredentials(
  slug: string,
  inlineProviders: InlineProvidersConfig,
): ProviderCredentialsWithProvider | null {
  const config = inlineProviders.find((p: { slug: string }) => p.slug === slug);
  if (!config) {
    return null;
  }

  // Extract credentials (all fields except provider and slug)
  const { provider, slug: _, ...credentials } = config;

  return {
    credentials: credentials as ProviderCredentials,
    providerId: provider,
  };
}
