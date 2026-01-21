import { cacheService } from './cache';

const CREDENTIALS_NAMESPACE = 'provider-credentials';
const CREDENTIALS_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Provider credentials extracted from provider_configs
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
 * Data layer type for fetching provider configs.
 * Using a flexible type since the actual data layer has many more methods.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataLayerWithProviderConfig = {
  getProviderConfigById: (params: {
    id: string;
  }) => Promise<{ config: Record<string, unknown> | string; providerId: string } | undefined>;
  getProviderConfigByProviderId?: (params: {
    providerId: string;
  }) => Promise<{ config: Record<string, unknown> | string; providerId: string } | undefined>;
  getProviderConfigBySlug?: (params: {
    slug: string;
  }) => Promise<{ config: Record<string, unknown> | string; providerId: string } | undefined>;
};

/**
 * Result of getting provider credentials by slug
 */
export interface ProviderCredentialsWithProvider {
  credentials: ProviderCredentials;
  providerId: string;
}

/**
 * Get provider credentials by provider config ID (cached)
 */
export async function getProviderCredentials(
  providerConfigId: string,
  db: DataLayerWithProviderConfig
): Promise<ProviderCredentials | null> {
  return cacheService.getOrSet(
    `credentials:${providerConfigId}`,
    async () => {
      const config = await db.getProviderConfigById({ id: providerConfigId });
      if (!config) return null;

      const configData =
        typeof config.config === 'string'
          ? JSON.parse(config.config)
          : config.config;

      return configData as ProviderCredentials;
    },
    { namespace: CREDENTIALS_NAMESPACE, ttl: CREDENTIALS_TTL_MS }
  );
}

/**
 * Get provider credentials by provider ID string (legacy behavior, cached)
 */
export async function getProviderCredentialsByProviderId(
  providerId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
): Promise<ProviderCredentials | null> {
  if (!db.getProviderConfigByProviderId) {
    return null;
  }

  return cacheService.getOrSet(
    `credentials-by-provider:${providerId}`,
    async () => {
      const config = await db.getProviderConfigByProviderId({ providerId });
      if (!config) return null;

      const configData =
        typeof config.config === 'string'
          ? JSON.parse(config.config)
          : config.config;

      return configData as ProviderCredentials;
    },
    { namespace: CREDENTIALS_NAMESPACE, ttl: CREDENTIALS_TTL_MS }
  );
}

/**
 * Get provider credentials by provider config slug (cached)
 * Returns both credentials and providerId since the caller needs to know the provider
 */
export async function getProviderCredentialsBySlug(
  slug: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
): Promise<ProviderCredentialsWithProvider | null> {
  if (!db.getProviderConfigBySlug) {
    console.log('[credentialsCache] db.getProviderConfigBySlug not found');
    return null;
  }

  return cacheService.getOrSet(
    `credentials-by-slug:${slug}`,
    async () => {
      console.log('[credentialsCache] Looking up provider config by slug:', slug);
      const config = await db.getProviderConfigBySlug({ slug });
      console.log('[credentialsCache] Found config:', config ? config.id : 'null');
      if (!config) return null;

      const configData =
        typeof config.config === 'string'
          ? JSON.parse(config.config)
          : config.config;

      return {
        credentials: configData as ProviderCredentials,
        providerId: config.providerId,
      };
    },
    { namespace: CREDENTIALS_NAMESPACE, ttl: CREDENTIALS_TTL_MS }
  );
}

/**
 * Invalidate credentials cache for a specific provider config
 */
export async function invalidateProviderCredentials(
  providerConfigId: string
): Promise<void> {
  await cacheService.delete(
    `credentials:${providerConfigId}`,
    CREDENTIALS_NAMESPACE
  );
}

/**
 * Invalidate credentials cache for a provider ID
 */
export async function invalidateProviderCredentialsByProviderId(
  providerId: string
): Promise<void> {
  await cacheService.delete(
    `credentials-by-provider:${providerId}`,
    CREDENTIALS_NAMESPACE
  );
}

/**
 * Invalidate credentials cache for a provider config slug
 */
export async function invalidateProviderCredentialsBySlug(
  slug: string
): Promise<void> {
  await cacheService.delete(
    `credentials-by-slug:${slug}`,
    CREDENTIALS_NAMESPACE
  );
}

/**
 * Invalidate all provider credentials cache
 */
export async function invalidateAllProviderCredentials(): Promise<void> {
  await cacheService.clear(CREDENTIALS_NAMESPACE);
}
