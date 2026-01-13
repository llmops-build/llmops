import type { MiddlewareHandler } from 'hono';
import {
  variantJsonDataSchema,
  SupportedProviders,
  type VariantJsonData,
} from '@llmops/core';
import { cacheService } from '@server/services/cache';
import { renderTemplate } from '@server/lib/template-utils';

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
  // Add more mappings as needed
};

/**
 * Merges variant config with the request body for chat completions.
 * Variant config takes precedence over request body values.
 * If input variables are provided, they are used to render nunjucks templates in system_prompt.
 */
function mergeChatCompletionBody(
  body: Record<string, unknown>,
  variantConfig: VariantJsonData,
  modelName: string,
  inputVariables?: Record<string, unknown>
): Record<string, unknown> {
  // Build messages array: prepend system prompt from variant if present
  const messages: Array<{ role: string; content: string }> = [];

  if (variantConfig.system_prompt) {
    // Render nunjucks template with input variables if provided
    let systemPromptContent = variantConfig.system_prompt;
    if (inputVariables && Object.keys(inputVariables).length > 0) {
      try {
        systemPromptContent = renderTemplate(
          variantConfig.system_prompt,
          inputVariables
        );
      } catch (error) {
        // If template rendering fails, use original prompt
        console.warn(
          'Template rendering failed, using original prompt:',
          error
        );
      }
    }

    messages.push({
      role: 'system',
      content: systemPromptContent,
    });
  }

  // Append user's messages
  if (Array.isArray(body.messages)) {
    messages.push(
      ...(body.messages as Array<{ role: string; content: string }>)
    );
  }

  // Use model from jsonData, fallback to modelName column
  const model = variantConfig.model || modelName;

  // Merge variant config with request body
  // Variant config takes precedence, request body provides fallbacks
  return {
    ...body,
    messages,
    model,
    // Variant config takes precedence over request body
    temperature: variantConfig.temperature ?? body.temperature,
    max_tokens: variantConfig.max_tokens ?? body.max_tokens,
    max_completion_tokens:
      variantConfig.max_completion_tokens ?? body.max_completion_tokens,
    top_p: variantConfig.top_p ?? body.top_p,
    frequency_penalty:
      variantConfig.frequency_penalty ?? body.frequency_penalty,
    presence_penalty: variantConfig.presence_penalty ?? body.presence_penalty,
    stop: variantConfig.stop ?? body.stop,
    n: variantConfig.n ?? body.n,
    logprobs: variantConfig.logprobs ?? body.logprobs,
    top_logprobs: variantConfig.top_logprobs ?? body.top_logprobs,
    response_format: variantConfig.response_format ?? body.response_format,
    seed: variantConfig.seed ?? body.seed,
    tools: variantConfig.tools ?? body.tools,
    tool_choice: variantConfig.tool_choice ?? body.tool_choice,
    parallel_tool_calls:
      variantConfig.parallel_tool_calls ?? body.parallel_tool_calls,
    user: variantConfig.user ?? body.user,
    stream: variantConfig.stream ?? body.stream,
    stream_options: variantConfig.stream_options ?? body.stream_options,
  };
}

/**
 * Middleware that adapts LLMOps config to Portkey Gateway format.
 *
 * Flow:
 * 1. Reads configId and envSec from context (set by requestGuard)
 * 2. Fetches variant config from database
 * 3. Fetches provider API key from database (provider_configs table)
 * 4. Translates to Portkey config format
 * 5. Sets x-portkey-config header for gateway consumption
 * 6. Modifies request body to merge variant config settings
 */
export const createGatewayAdapterMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const configId = c.get('configId');
    const envSec = c.get('envSec');
    const db = c.var.db;

    if (!configId) {
      return c.json(
        {
          error: {
            message: 'Config ID is required',
            type: 'invalid_request_error',
          },
        },
        400
      );
    }

    try {
      // Fetch variant data from database (cached)
      const data = (await cacheService.getOrSet(
        `secret:${envSec}`,
        () =>
          db.getVariantJsonDataForConfig({
            configId,
            envSecret: envSec,
          }),
        {
          namespace: `config:${configId}`,
        }
      )) as {
        configId: string;
        variantId: string;
        environmentId: string;
        version: number;
        provider: string;
        modelName: string;
        jsonData: Record<string, unknown>;
      };

      // Parse variant config
      const variantConfig = variantJsonDataSchema.parse(
        typeof data.jsonData === 'string'
          ? JSON.parse(data.jsonData)
          : data.jsonData
      );

      // Map provider name - first check PROVIDER_MAP, then apply models.dev to Portkey mapping
      const portkeyProvider = getPortkeyProviderId(
        PROVIDER_MAP[data.provider] || data.provider
      );

      // Get API key from database (provider_configs table)
      const providerConfig = await cacheService.getOrSet(
        `provider:${data.provider}`,
        () =>
          db.getProviderConfigByProviderId({
            providerId: data.provider,
          }),
        {
          namespace: 'provider-configs',
        }
      );

      // Parse the config JSON to extract credentials
      const configData =
        typeof providerConfig?.config === 'string'
          ? JSON.parse(providerConfig.config)
          : providerConfig?.config;
      const apiKey = configData?.apiKey;

      // For most providers, apiKey is required. But some providers (like bedrock, vertex-ai)
      // use different auth mechanisms
      const requiresApiKey = !['bedrock', 'sagemaker', 'vertex-ai'].includes(
        data.provider
      );

      if (requiresApiKey && !apiKey) {
        return c.json(
          {
            error: {
              message: `No API key configured for provider: ${data.provider}`,
              type: 'invalid_request_error',
            },
          },
          400
        );
      }

      // Build Portkey config with provider-specific fields
      const portkeyConfig: PortkeyConfig = {
        provider: portkeyProvider,
      };

      // Add API key if present
      if (apiKey) {
        portkeyConfig.api_key = apiKey;
      }

      // Add custom host if configured
      if (configData?.customHost) {
        portkeyConfig.custom_host = configData.customHost;
      }

      // Map provider-specific fields to Portkey config format
      // OpenAI specific
      if (configData?.openaiOrganization) {
        portkeyConfig.openai_organization = configData.openaiOrganization;
      }
      if (configData?.openaiProject) {
        portkeyConfig.openai_project = configData.openaiProject;
      }

      // AWS Bedrock/SageMaker
      if (configData?.awsAccessKeyId) {
        portkeyConfig.aws_access_key_id = configData.awsAccessKeyId;
      }
      if (configData?.awsSecretAccessKey) {
        portkeyConfig.aws_secret_access_key = configData.awsSecretAccessKey;
      }
      if (configData?.awsSessionToken) {
        portkeyConfig.aws_session_token = configData.awsSessionToken;
      }
      if (configData?.awsRegion) {
        portkeyConfig.aws_region = configData.awsRegion;
      }

      // Azure OpenAI
      if (configData?.resourceName) {
        portkeyConfig.azure_resource_name = configData.resourceName;
      }
      if (configData?.deploymentId) {
        portkeyConfig.azure_deployment_id = configData.deploymentId;
        // Also set azure_model_name for compatibility
        portkeyConfig.azure_model_name = configData.deploymentId;
      }
      if (configData?.apiVersion) {
        portkeyConfig.azure_api_version = configData.apiVersion;
      }
      if (configData?.azureAuthMode) {
        portkeyConfig.azure_auth_mode = configData.azureAuthMode;
      }
      if (configData?.azureAdToken) {
        portkeyConfig.azure_ad_token = configData.azureAdToken;
      }
      if (configData?.azureManagedClientId) {
        portkeyConfig.azure_managed_client_id = configData.azureManagedClientId;
      }
      if (configData?.azureWorkloadClientId) {
        portkeyConfig.azure_workload_client_id =
          configData.azureWorkloadClientId;
      }
      if (configData?.azureEntraClientId) {
        portkeyConfig.azure_entra_client_id = configData.azureEntraClientId;
      }
      if (configData?.azureEntraClientSecret) {
        portkeyConfig.azure_entra_client_secret =
          configData.azureEntraClientSecret;
      }
      if (configData?.azureEntraTenantId) {
        portkeyConfig.azure_entra_tenant_id = configData.azureEntraTenantId;
      }
      if (configData?.azureFoundryUrl) {
        portkeyConfig.azure_foundry_url = configData.azureFoundryUrl;
      }
      if (configData?.azureDeploymentName) {
        portkeyConfig.azure_deployment_id = configData.azureDeploymentName;
      }
      if (configData?.azureApiVersion) {
        portkeyConfig.azure_api_version = configData.azureApiVersion;
      }

      // Google Vertex AI
      if (configData?.vertexProjectId) {
        portkeyConfig.vertex_project_id = configData.vertexProjectId;
      }
      if (configData?.vertexRegion) {
        portkeyConfig.vertex_region = configData.vertexRegion;
      }
      if (configData?.vertexServiceAccountJson) {
        try {
          portkeyConfig.vertex_service_account_json =
            typeof configData.vertexServiceAccountJson === 'string'
              ? JSON.parse(configData.vertexServiceAccountJson)
              : configData.vertexServiceAccountJson;
        } catch {
          // If parsing fails, leave it as-is
        }
      }

      // Check if this is a chat completions request that needs body transformation
      const path = c.req.path;
      const method = c.req.method;
      const contentType = c.req.header('content-type')?.split(';')[0];

      if (
        method === 'POST' &&
        contentType === 'application/json' &&
        (path.endsWith('/chat/completions') || path.endsWith('/completions'))
      ) {
        // Get original body and merge with variant config
        const originalBody = await c.req.json();

        // Extract input variables for nunjucks template rendering
        // input can be provided in the request body to fill template variables
        const inputVariables =
          originalBody.input && typeof originalBody.input === 'object'
            ? (originalBody.input as Record<string, unknown>)
            : {};

        const mergedBody = mergeChatCompletionBody(
          originalBody,
          variantConfig,
          data.modelName,
          inputVariables
        );

        // Remove 'input' from the final body as it's not part of OpenAI API spec
        delete mergedBody.input;

        // Clone headers from the original request
        const newHeaders = new Headers(c.req.raw.headers);
        newHeaders.set('x-llmops-config', JSON.stringify(portkeyConfig));

        // Create a completely new Request object with the merged body
        // This is the proper way to replace request body in Hono
        const newRequest = new Request(c.req.raw.url, {
          method: c.req.raw.method,
          headers: newHeaders,
          body: JSON.stringify(mergedBody),
          duplex: 'half', // Required for request body streams in Node.js
        } as RequestInit);

        // Use Object.defineProperty to replace the raw request
        // This ensures Hono will re-parse the body from the new request
        Object.defineProperty(c.req, 'raw', {
          value: newRequest,
          writable: true,
          configurable: true,
        });

        // Clear Hono's internal body cache by resetting the parsed body
        (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache =
          {};
      } else {
        // For non-chat requests, just set the header
        c.req.raw.headers.set('x-llmops-config', JSON.stringify(portkeyConfig));
      }

      // Store variant config in context for reference
      c.set('variantConfig', variantConfig);
      c.set('variantModel', variantConfig.model || data.modelName);
      // Store resolved IDs for cost tracking (configId from header may be a slug)
      c.set('configId', data.configId);
      c.set('variantId', data.variantId);
      c.set('environmentId', data.environmentId);
      // environmentId is returned from getVariantJsonDataForConfig
      c.set(
        'environmentId',
        (data as { environmentId?: string }).environmentId
      );
      c.set('environmentId', data.environmentId);

      await next();
    } catch (error) {
      console.error('Gateway adapter error:', error);
      return c.json(
        {
          error: {
            message:
              error instanceof Error ? error.message : 'Failed to fetch config',
            type: 'api_error',
          },
        },
        500
      );
    }
  };
};
