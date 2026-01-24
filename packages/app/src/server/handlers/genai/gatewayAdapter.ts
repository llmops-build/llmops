import type { MiddlewareHandler } from 'hono';
import {
  variantJsonDataSchema,
  SupportedProviders,
  ManifestRouter,
  logger,
  type VariantJsonData,
  type RoutingContext,
} from '@llmops/core';
import { getManifestService } from '@server/services/manifest';
import {
  getProviderCredentials,
  getProviderCredentialsByProviderId,
  getProviderCredentialsBySlug,
  type ProviderCredentials,
} from '@server/services/credentialsCache';
import { renderTemplate } from '@server/lib/template-utils';

/**
 * Parse a model string in the format @provider-slug/model-name
 * Returns null if the model doesn't match the expected format
 */
function parseProviderSlugModel(
  model: string
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
/**
 * Gateway guardrail format
 * Each guardrail object has the function ID as key with parameters
 */
type GatewayGuardrail = {
  deny?: boolean;
  on_fail?: string;
  [functionId: string]: unknown;
};

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
  // Guardrails
  default_input_guardrails?: GatewayGuardrail[];
  default_output_guardrails?: GatewayGuardrail[];
}

/**
 * Database guardrail config type
 */
interface DbGuardrailConfig {
  id: string;
  pluginId: string;
  functionId: string;
  hookType: 'beforeRequestHook' | 'afterRequestHook';
  parameters: Record<string, unknown>;
  enabled: boolean;
  priority: number;
  onFail: 'block' | 'log';
}

/**
 * Converts database guardrail configs to gateway format.
 * The gateway expects guardrails as objects with function ID as key.
 *
 * @example
 * DB format: { functionId: 'regexMatch', parameters: { rule: '.*' }, onFail: 'block' }
 * Gateway format: { deny: true, regexMatch: { id: 'default.regexMatch', rule: '.*' } }
 */
function convertGuardrailsToGatewayFormat(
  guardrails: DbGuardrailConfig[]
): GatewayGuardrail[] {
  return guardrails.map((guardrail) => {
    const gatewayGuardrail: GatewayGuardrail = {
      // deny: true means block the request if guardrail fails
      deny: guardrail.onFail === 'block',
    };

    // Add the function with its parameters
    // The gateway expects the function ID as key with parameters as value
    gatewayGuardrail[guardrail.functionId] = {
      id: `${guardrail.pluginId}.${guardrail.functionId}`,
      ...guardrail.parameters,
    };

    return gatewayGuardrail;
  });
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
 * If input variables are provided, they are used to render nunjucks templates in messages.
 */
function mergeChatCompletionBody(
  body: Record<string, unknown>,
  variantConfig: VariantJsonData,
  modelName: string,
  inputVariables?: Record<string, unknown>
): Record<string, unknown> {
  // Build messages array: prepend variant messages if present
  const messages: Array<{ role: string; content: string }> = [];

  // Check for new messages array format first, fall back to old system_prompt format
  if (variantConfig.messages && Array.isArray(variantConfig.messages)) {
    // New format: use messages array from variant config
    for (const msg of variantConfig.messages) {
      let content = msg.content;
      // Render nunjucks template with input variables if provided
      if (inputVariables && Object.keys(inputVariables).length > 0) {
        try {
          content = renderTemplate(msg.content, inputVariables);
        } catch (error) {
          // If template rendering fails, use original content
          logger.warn(
            `Template rendering failed, using original content: ${error}`
          );
        }
      }
      messages.push({
        role: msg.role,
        content,
      });
    }
  } else if (variantConfig.system_prompt) {
    // Old format: use system_prompt (backwards compatibility)
    let systemPromptContent = variantConfig.system_prompt;
    if (inputVariables && Object.keys(inputVariables).length > 0) {
      try {
        systemPromptContent = renderTemplate(
          variantConfig.system_prompt,
          inputVariables
        );
      } catch (error) {
        // If template rendering fails, use original prompt
        logger.warn(
          `Template rendering failed, using original prompt: ${error}`
        );
      }
    }

    messages.push({
      role: 'system',
      content: systemPromptContent,
    });
  }

  // Append user's messages from request body
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
 * Build Portkey config from provider credentials
 */
function buildPortkeyConfig(
  portkeyProvider: string,
  credentials: ProviderCredentials | null
): PortkeyConfig {
  const portkeyConfig: PortkeyConfig = {
    provider: portkeyProvider,
  };

  if (!credentials) return portkeyConfig;

  // Add API key if present
  if (credentials.apiKey) {
    portkeyConfig.api_key = credentials.apiKey;
  }

  // Add custom host if configured
  if (credentials.customHost) {
    portkeyConfig.custom_host = credentials.customHost;
  }

  // OpenAI specific
  if (credentials.openaiOrganization) {
    portkeyConfig.openai_organization = credentials.openaiOrganization;
  }
  if (credentials.openaiProject) {
    portkeyConfig.openai_project = credentials.openaiProject;
  }

  // AWS Bedrock/SageMaker
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

  // Azure OpenAI
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
    portkeyConfig.azure_entra_client_secret = credentials.azureEntraClientSecret;
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

  // Google Vertex AI
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
 * This is used when no config header is provided and the model field
 * specifies a provider slug directly (e.g., @openai-prod/gpt-4.1-nano).
 */
async function handleDirectProviderRequest(
  c: Parameters<MiddlewareHandler>[0],
  next: Parameters<MiddlewareHandler>[1],
  originalBody: Record<string, unknown>,
  providerSlug: string,
  modelName: string
) {
  const db = c.var.db;

  // Look up provider credentials by slug
  const result = await getProviderCredentialsBySlug(providerSlug, db);

  if (!result) {
    return c.json(
      {
        error: {
          message: `Provider config not found for slug: ${providerSlug}`,
          type: 'invalid_request_error',
        },
      },
      404
    );
  }

  const { credentials, providerId } = result;

  // Map provider name to Portkey provider
  const portkeyProvider = getPortkeyProviderId(
    PROVIDER_MAP[providerId] || providerId
  );

  // Check if API key is required
  const requiresApiKey = !['bedrock', 'sagemaker', 'vertex-ai'].includes(
    providerId
  );

  if (requiresApiKey && !credentials?.apiKey) {
    return c.json(
      {
        error: {
          message: `No API key configured for provider: ${providerId}`,
          type: 'invalid_request_error',
        },
      },
      400
    );
  }

  // Build Portkey config for the gateway
  const portkeyConfig = buildPortkeyConfig(portkeyProvider, credentials);

  // Fetch enabled guardrails from database and add to config
  try {
    const [beforeGuardrails, afterGuardrails] = await Promise.all([
      db.getEnabledGuardrailsByHookType?.('beforeRequestHook') ??
        Promise.resolve([]),
      db.getEnabledGuardrailsByHookType?.('afterRequestHook') ??
        Promise.resolve([]),
    ]);

    if (beforeGuardrails.length > 0) {
      portkeyConfig.default_input_guardrails = convertGuardrailsToGatewayFormat(
        beforeGuardrails as DbGuardrailConfig[]
      );
    }
    if (afterGuardrails.length > 0) {
      portkeyConfig.default_output_guardrails =
        convertGuardrailsToGatewayFormat(afterGuardrails as DbGuardrailConfig[]);
    }
  } catch (error) {
    logger.warn(`Failed to fetch guardrails: ${error}`);
    // Continue without guardrails if fetch fails
  }

  // Update the body with the extracted model name (without the @slug/ prefix)
  const updatedBody: Record<string, unknown> = {
    ...originalBody,
    model: modelName,
  };

  // Remove 'input' from the final body as it's not part of OpenAI API spec
  delete updatedBody.input;

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

  await next();
}

/**
 * Middleware that adapts LLMOps config to Portkey Gateway format.
 *
 * Flow:
 * 1. If no configId, check for @provider-slug/model format in request body
 * 2. If configId provided, uses manifest to resolve targeting rules and variant
 * 3. Fetches provider credentials from cache
 * 4. Translates to Portkey config format
 * 5. Sets x-llmops-config header for gateway consumption
 * 6. Modifies request body to merge variant config settings
 */
export const createGatewayAdapterMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const configId = c.get('configId');
    const envSec = c.get('envSec');
    const db = c.var.db;
    const kyselyDb = c.var.kyselyDb;

    // Check if this is a chat completions request
    const path = c.req.path;
    const method = c.req.method;
    const contentType = c.req.header('content-type')?.split(';')[0];
    const isChatRequest =
      method === 'POST' &&
      contentType === 'application/json' &&
      (path.endsWith('/chat/completions') || path.endsWith('/completions'));

    // If no configId, check for @provider-slug/model format
    if (!configId && isChatRequest) {
      try {
        const body = await c.req.json();
        const model = body.model as string | undefined;

        if (model) {
          const parsed = parseProviderSlugModel(model);
          if (parsed) {
            // Direct provider request with @provider-slug/model format
            return handleDirectProviderRequest(
              c,
              next,
              body,
              parsed.providerSlug,
              parsed.modelName
            );
          }
        }
      } catch {
        // If body parsing fails, continue with normal flow
      }

      // No config and no @provider-slug/model format
      return c.json(
        {
          error: {
            message:
              'Config ID is required. Either provide x-llmops-config header or use @provider-slug/model format in the model field.',
            type: 'invalid_request_error',
          },
        },
        400
      );
    }

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
      // Get manifest service and route the request
      const manifestService = getManifestService(kyselyDb);
      const manifest = await manifestService.getManifest();
      const router = new ManifestRouter(manifest);

      // Resolve environment from secret or use production
      let environmentId: string | null = null;
      if (envSec) {
        environmentId = router.resolveEnvironmentFromSecret(envSec);
        if (!environmentId) {
          return c.json(
            {
              error: {
                message: 'Invalid environment secret',
                type: 'invalid_request_error',
              },
            },
            400
          );
        }
      } else {
        environmentId = router.getProductionEnvironmentId();
        if (!environmentId) {
          return c.json(
            {
              error: {
                message: 'No production environment configured',
                type: 'invalid_request_error',
              },
            },
            400
          );
        }
      }

      // Build routing context from request for JSONLogic evaluation
      const headersObj: Record<string, string> = {};
      c.req.raw.headers.forEach((value, key) => {
        headersObj[key.toLowerCase()] = value;
      });
      const routingContext: RoutingContext = {
        headers: headersObj,
        request: {
          path: c.req.path,
          method: c.req.method,
          ip: c.req.header('x-forwarded-for') || c.req.header('x-real-ip'),
        },
        timestamp: Date.now(),
      };

      // Route to variant using weighted selection
      const routeResult = router.routeWithWeights(
        configId,
        environmentId,
        routingContext
      );

      if (!routeResult) {
        return c.json(
          {
            error: {
              message: `No targeting rule found for config ${configId} in environment ${environmentId}`,
              type: 'invalid_request_error',
            },
          },
          400
        );
      }

      const { version } = routeResult;

      // Parse variant config from manifest
      const variantConfig = variantJsonDataSchema.parse(version.jsonData);

      // Map provider name
      const portkeyProvider = getPortkeyProviderId(
        PROVIDER_MAP[version.provider] || version.provider
      );

      // Get provider credentials from cache
      let credentials: ProviderCredentials | null = null;
      if (version.providerConfigId) {
        credentials = await getProviderCredentials(
          version.providerConfigId,
          db
        );
      } else {
        // Fallback: lookup by providerId string (legacy behavior)
        credentials = await getProviderCredentialsByProviderId(
          version.provider,
          db
        );
      }

      // Check if API key is required
      const requiresApiKey = !['bedrock', 'sagemaker', 'vertex-ai'].includes(
        version.provider
      );

      if (requiresApiKey && !credentials?.apiKey) {
        return c.json(
          {
            error: {
              message: `No API key configured for provider: ${version.provider}`,
              type: 'invalid_request_error',
            },
          },
          400
        );
      }

      // Build Portkey config for the gateway
      const portkeyConfig = buildPortkeyConfig(portkeyProvider, credentials);

      // Fetch enabled guardrails from database and add to config
      try {
        const [beforeGuardrails, afterGuardrails] = await Promise.all([
          db.getEnabledGuardrailsByHookType?.('beforeRequestHook') ??
            Promise.resolve([]),
          db.getEnabledGuardrailsByHookType?.('afterRequestHook') ??
            Promise.resolve([]),
        ]);

        if (beforeGuardrails.length > 0) {
          portkeyConfig.default_input_guardrails =
            convertGuardrailsToGatewayFormat(
              beforeGuardrails as DbGuardrailConfig[]
            );
        }
        if (afterGuardrails.length > 0) {
          portkeyConfig.default_output_guardrails =
            convertGuardrailsToGatewayFormat(
              afterGuardrails as DbGuardrailConfig[]
            );
        }
      } catch (error) {
        logger.warn(`Failed to fetch guardrails: ${error}`);
        // Continue without guardrails if fetch fails
      }

      if (isChatRequest) {
        // Get original body and merge with variant config
        const originalBody = await c.req.json();

        // Extract input variables for nunjucks template rendering
        const inputVariables =
          originalBody.input && typeof originalBody.input === 'object'
            ? (originalBody.input as Record<string, unknown>)
            : {};

        const mergedBody = mergeChatCompletionBody(
          originalBody,
          variantConfig,
          version.modelName,
          inputVariables
        );

        // Remove 'input' from the final body as it's not part of OpenAI API spec
        delete mergedBody.input;

        // Clone headers from the original request
        const newHeaders = new Headers(c.req.raw.headers);

        // Set the gateway config header with provider credentials
        // This is required by the gateway's requestValidator
        newHeaders.set('x-llmops-config', JSON.stringify(portkeyConfig));

        // Create a completely new Request object with the merged body
        const newRequest = new Request(c.req.raw.url, {
          method: c.req.raw.method,
          headers: newHeaders,
          body: JSON.stringify(mergedBody),
          duplex: 'half',
        } as RequestInit);

        // Replace the raw request
        Object.defineProperty(c.req, 'raw', {
          value: newRequest,
          writable: true,
          configurable: true,
        });

        // Clear Hono's internal body cache
        (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache =
          {};
      } else {
        // For non-chat requests, set the gateway config header
        c.req.raw.headers.set('x-llmops-config', JSON.stringify(portkeyConfig));
      }

      // Store resolved data in context
      c.set('variantConfig', variantConfig);
      c.set('variantModel', variantConfig.model || version.modelName);
      c.set('configId', routeResult.configId);
      c.set('variantId', routeResult.variantId);
      c.set('environmentId', routeResult.environmentId);

      await next();
    } catch (error) {
      logger.error(`Gateway adapter error: ${error}`);

      // If manifest is unavailable, could add fallback to direct DB lookup here
      // For now, return error
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
