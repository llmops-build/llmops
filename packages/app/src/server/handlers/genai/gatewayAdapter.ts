import type { MiddlewareHandler } from 'hono';
import { SupportedProviders, logger } from '@llmops/core';
import {
  getInlineProviderCredentials,
  type ProviderCredentials,
} from '@server/services/credentialsCache';

/**
 * Parse a model string in the format @provider-slug/model-name
 * Returns null if the model doesn't match the expected format
 */
function parseProviderSlugModel(
  model: string,
): { providerSlug: string; modelName: string } | null {
  if (!model || !model.startsWith('@')) {
    return null;
  }

  // Remove the @ prefix and split by /
  const withoutAt = model.slice(1);
  const slashIndex = withoutAt.indexOf('/');

  if (slashIndex === -1) {
    return null;
  }

  const providerSlug = withoutAt.slice(0, slashIndex);
  const modelName = withoutAt.slice(slashIndex + 1);

  if (!providerSlug || !modelName) {
    return null;
  }

  return { providerSlug, modelName };
}

/**
 * Provider ID mapping from models.dev to Portkey gateway.
 * models.dev uses different provider IDs than Portkey for some providers.
 */
const MODELS_DEV_TO_PORTKEY_PROVIDER_MAP: Record<string, string> = {
  // models.dev uses 'reka', Portkey uses 'reka-ai'
  reka: 'reka-ai',
  // models.dev uses 'azure-cognitive-services', Portkey uses 'azure-ai'
  'azure-cognitive-services': 'azure-ai',
  // models.dev uses 'azure', Portkey uses 'azure-openai'
  azure: 'azure-openai',
};

/**
 * Get the Portkey gateway provider ID for a given provider ID.
 * Returns the original ID if no mapping exists.
 */
function getPortkeyProviderId(providerId: string): string {
  return MODELS_DEV_TO_PORTKEY_PROVIDER_MAP[providerId] ?? providerId;
}

/**
 * Portkey Gateway Config format
 * @see packages/gateway/src/middlewares/requestValidator/schema/config.ts
 */
interface PortkeyConfig {
  provider: string;
  api_key?: string;
  // AWS credentials
  aws_secret_access_key?: string;
  aws_access_key_id?: string;
  aws_session_token?: string;
  aws_region?: string;
  // Azure OpenAI
  azure_resource_name?: string;
  azure_deployment_id?: string;
  azure_api_version?: string;
  azure_model_name?: string;
  azure_auth_mode?: string;
  azure_ad_token?: string;
  azure_managed_client_id?: string;
  azure_workload_client_id?: string;
  azure_entra_client_id?: string;
  azure_entra_client_secret?: string;
  azure_entra_tenant_id?: string;
  azure_foundry_url?: string;
  // Google Vertex AI
  vertex_project_id?: string;
  vertex_region?: string;
  vertex_service_account_json?: Record<string, string>;
  // OpenAI specific
  openai_project?: string;
  openai_organization?: string;
  // Strategy for multiple targets
  strategy?: {
    mode: 'single' | 'loadbalance' | 'fallback' | 'conditional';
    on_status_codes?: number[];
  };
  targets?: PortkeyConfig[];
  // Other options
  cache?: {
    mode: 'simple' | 'semantic';
    max_age?: number;
  };
  retry?: {
    attempts: number;
    on_status_codes?: number[];
  };
  request_timeout?: number;
  custom_host?: string;
  forward_headers?: string[];
  weight?: number;
  on_status_codes?: number[];
}

/**
 * Maps LLMOps provider names to Portkey provider names
 */
const PROVIDER_MAP: Record<string, string> = {
  [SupportedProviders.OPENROUTER]: 'openrouter',
  openai: 'openai',
  anthropic: 'anthropic',
  'azure-openai': 'azure-openai',
  'vertex-ai': 'vertex-ai',
  bedrock: 'bedrock',
  groq: 'groq',
  'mistral-ai': 'mistral-ai',
  cohere: 'cohere',
  'together-ai': 'together-ai',
  deepseek: 'deepseek',
};

/**
 * Build Portkey config from provider credentials
 */
function buildPortkeyConfig(
  portkeyProvider: string,
  credentials: ProviderCredentials | null,
): PortkeyConfig {
  const portkeyConfig: PortkeyConfig = {
    provider: portkeyProvider,
  };

  if (!credentials) return portkeyConfig;

  if (credentials.apiKey) {
    portkeyConfig.api_key = credentials.apiKey;
  }
  if (credentials.customHost) {
    portkeyConfig.custom_host = credentials.customHost;
  }
  if (credentials.openaiOrganization) {
    portkeyConfig.openai_organization = credentials.openaiOrganization;
  }
  if (credentials.openaiProject) {
    portkeyConfig.openai_project = credentials.openaiProject;
  }
  if (credentials.awsAccessKeyId) {
    portkeyConfig.aws_access_key_id = credentials.awsAccessKeyId;
  }
  if (credentials.awsSecretAccessKey) {
    portkeyConfig.aws_secret_access_key = credentials.awsSecretAccessKey;
  }
  if (credentials.awsSessionToken) {
    portkeyConfig.aws_session_token = credentials.awsSessionToken;
  }
  if (credentials.awsRegion) {
    portkeyConfig.aws_region = credentials.awsRegion;
  }
  if (credentials.resourceName) {
    portkeyConfig.azure_resource_name = credentials.resourceName;
  }
  if (credentials.deploymentId) {
    portkeyConfig.azure_deployment_id = credentials.deploymentId;
    portkeyConfig.azure_model_name = credentials.deploymentId;
  }
  if (credentials.apiVersion) {
    portkeyConfig.azure_api_version = credentials.apiVersion;
  }
  if (credentials.azureAuthMode) {
    portkeyConfig.azure_auth_mode = credentials.azureAuthMode;
  }
  if (credentials.azureAdToken) {
    portkeyConfig.azure_ad_token = credentials.azureAdToken;
  }
  if (credentials.azureManagedClientId) {
    portkeyConfig.azure_managed_client_id = credentials.azureManagedClientId;
  }
  if (credentials.azureWorkloadClientId) {
    portkeyConfig.azure_workload_client_id = credentials.azureWorkloadClientId;
  }
  if (credentials.azureEntraClientId) {
    portkeyConfig.azure_entra_client_id = credentials.azureEntraClientId;
  }
  if (credentials.azureEntraClientSecret) {
    portkeyConfig.azure_entra_client_secret =
      credentials.azureEntraClientSecret;
  }
  if (credentials.azureEntraTenantId) {
    portkeyConfig.azure_entra_tenant_id = credentials.azureEntraTenantId;
  }
  if (credentials.azureFoundryUrl) {
    portkeyConfig.azure_foundry_url = credentials.azureFoundryUrl;
  }
  if (credentials.azureDeploymentName) {
    portkeyConfig.azure_deployment_id = credentials.azureDeploymentName;
  }
  if (credentials.azureApiVersion) {
    portkeyConfig.azure_api_version = credentials.azureApiVersion;
  }
  if (credentials.vertexProjectId) {
    portkeyConfig.vertex_project_id = credentials.vertexProjectId;
  }
  if (credentials.vertexRegion) {
    portkeyConfig.vertex_region = credentials.vertexRegion;
  }
  if (credentials.vertexServiceAccountJson) {
    portkeyConfig.vertex_service_account_json =
      credentials.vertexServiceAccountJson;
  }

  return portkeyConfig;
}

/**
 * Handle direct provider requests with @provider-slug/model format.
 * Providers are resolved from inline config (code-configured).
 */
async function handleDirectProviderRequest(
  c: Parameters<MiddlewareHandler>[0],
  next: Parameters<MiddlewareHandler>[1],
  originalBody: Record<string, unknown>,
  providerSlug: string,
  modelName: string,
) {
  const inlineProviders = c.var.inlineProviders;

  if (!inlineProviders) {
    return c.json(
      {
        error: {
          message: `No providers configured. Add providers to your llmops() config.`,
          type: 'invalid_request_error',
        },
      },
      400,
    );
  }

  const result = getInlineProviderCredentials(providerSlug, inlineProviders);

  if (!result) {
    return c.json(
      {
        error: {
          message:
            `Provider config not found for slug: ${providerSlug}. ` +
            `Configure it in your llmops() config.`,
          type: 'invalid_request_error',
        },
      },
      404,
    );
  }

  const { credentials, providerId } = result;

  // Map provider name to Portkey provider
  const portkeyProvider = getPortkeyProviderId(
    PROVIDER_MAP[providerId] || providerId,
  );

  // Check if API key is required
  const requiresApiKey = !['bedrock', 'sagemaker', 'vertex-ai'].includes(
    providerId,
  );

  if (requiresApiKey && !credentials?.apiKey) {
    return c.json(
      {
        error: {
          message: `No API key configured for provider: ${providerId}`,
          type: 'invalid_request_error',
        },
      },
      400,
    );
  }

  // Build Portkey config for the gateway
  const portkeyConfig = buildPortkeyConfig(portkeyProvider, credentials);

  // Update the body with the extracted model name (without the @slug/ prefix)
  const updatedBody: Record<string, unknown> = {
    ...originalBody,
    model: modelName,
  };

  // Remove 'input_variables' from the final body as it's not part of OpenAI API spec
  delete updatedBody.input_variables;

  // Clone headers from the original request
  const newHeaders = new Headers(c.req.raw.headers);

  // Set the gateway config header with provider credentials
  newHeaders.set('x-llmops-config', JSON.stringify(portkeyConfig));

  // Create a completely new Request object with the updated body
  const newRequest = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers: newHeaders,
    body: JSON.stringify(updatedBody),
    duplex: 'half',
  } as RequestInit);

  // Replace the raw request
  Object.defineProperty(c.req, 'raw', {
    value: newRequest,
    writable: true,
    configurable: true,
  });

  // Clear Hono's internal body cache
  (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache = {};

  // Store resolved data in context
  c.set('variantModel', modelName);
  c.set('providerId', providerId);

  // Debug log the gateway request
  const debugHeaders: Record<string, string> = {};
  newHeaders.forEach((value, key) => {
    debugHeaders[key] = key === 'x-llmops-config' ? '[REDACTED]' : value;
  });
  logger.debug(
    { headers: debugHeaders, body: updatedBody },
    'Gateway request [direct]',
  );

  await next();
}

/**
 * Middleware that adapts LLMOps config to Portkey Gateway format.
 *
 * Checks for @provider-slug/model format in request body and resolves
 * provider credentials from inline config.
 */
export const createGatewayAdapterMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const method = c.req.method;
    const contentType = c.req.header('content-type')?.split(';')[0];
    const isJsonPostRequest =
      method === 'POST' && contentType === 'application/json';

    if (isJsonPostRequest) {
      try {
        const body = await c.req.json();
        const model = body.model as string | undefined;

        if (model) {
          const parsed = parseProviderSlugModel(model);
          if (parsed) {
            return handleDirectProviderRequest(
              c,
              next,
              body,
              parsed.providerSlug,
              parsed.modelName,
            );
          }
        }
      } catch {
        // If body parsing fails, continue with normal flow
      }
    }

    // No @provider-slug/model format found
    return c.json(
      {
        error: {
          message:
            'Use @provider-slug/model format in the model field. Example: @openai/gpt-4.1-nano',
          type: 'invalid_request_error',
        },
      },
      400,
    );
  };
};
