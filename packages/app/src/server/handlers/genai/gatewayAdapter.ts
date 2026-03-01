import type { MiddlewareHandler } from 'hono';
import type { ProviderConfig } from '@llmops/gateway';
import {
  variantJsonDataSchema,
  ManifestRouter,
  logger,
  type VariantJsonData,
  type RoutingContext,
} from '@llmops/core';
import { getManifestService } from '@server/services/manifest';
import {
  getProviderCredentials,
  getProviderCredentialsByProviderId,
  getProviderCredentialsWithFallback,
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
 * Extracts system message content from variant config messages.
 * Used by the Responses API to convert messages to instructions.
 */
function extractSystemContent(
  variantConfig: VariantJsonData,
  inputVariables?: Record<string, unknown>
): string | null {
  // Check for new messages array format first
  if (variantConfig.messages && Array.isArray(variantConfig.messages)) {
    const systemMessages = variantConfig.messages.filter(
      (msg) => msg.role === 'system'
    );
    if (systemMessages.length > 0) {
      // Combine all system messages and render templates
      return systemMessages
        .map((msg) => {
          if (inputVariables && Object.keys(inputVariables).length > 0) {
            try {
              return renderTemplate(msg.content, inputVariables);
            } catch (error) {
              logger.warn(
                `Template rendering failed, using original content: ${error}`
              );
              return msg.content;
            }
          }
          return msg.content;
        })
        .join('\n');
    }
  }

  // Fall back to old system_prompt format
  if (variantConfig.system_prompt) {
    if (inputVariables && Object.keys(inputVariables).length > 0) {
      try {
        return renderTemplate(variantConfig.system_prompt, inputVariables);
      } catch (error) {
        logger.warn(
          `Template rendering failed, using original prompt: ${error}`
        );
        return variantConfig.system_prompt;
      }
    }
    return variantConfig.system_prompt;
  }

  return null;
}

/**
 * Merges variant config with the request body for the Responses API.
 * Converts system messages from variant config to the `instructions` parameter.
 * Variant config takes precedence over request body values.
 */
function mergeResponsesBody(
  body: Record<string, unknown>,
  variantConfig: VariantJsonData,
  modelName: string,
  inputVariables?: Record<string, unknown>
): Record<string, unknown> {
  // Use model from jsonData, fallback to modelName column
  const model = variantConfig.model || modelName;

  // Extract system content for instructions
  const instructions = extractSystemContent(variantConfig, inputVariables);

  // Build merged body - Responses API uses different parameter names
  const merged: Record<string, unknown> = {
    ...body,
    model,
  };

  // Set instructions from variant config (system messages)
  // Only set if variant config has system content
  if (instructions) {
    merged.instructions = instructions;
  }

  // Responses API uses max_output_tokens instead of max_tokens
  if (variantConfig.max_tokens !== undefined) {
    merged.max_output_tokens = variantConfig.max_tokens;
  }
  if (variantConfig.max_completion_tokens !== undefined) {
    merged.max_output_tokens = variantConfig.max_completion_tokens;
  }

  // Map other common parameters
  if (variantConfig.temperature !== undefined) {
    merged.temperature = variantConfig.temperature;
  }
  if (variantConfig.top_p !== undefined) {
    merged.top_p = variantConfig.top_p;
  }

  return merged;
}

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
 * Build ProviderConfig from provider credentials.
 * Fields map directly from ProviderCredentials — no snake_case conversion needed.
 */
function buildProviderConfig(
  providerId: string,
  credentials: ProviderCredentials | null
): ProviderConfig {
  const config: ProviderConfig = {
    provider: providerId,
  };

  if (!credentials) return config;

  // Add API key if present
  if (credentials.apiKey) {
    config.apiKey = credentials.apiKey;
  }

  // Add custom host if configured
  if (credentials.customHost) {
    config.customHost = credentials.customHost;
  }

  // OpenAI specific
  if (credentials.openaiOrganization) {
    config.openaiOrganization = credentials.openaiOrganization;
  }
  if (credentials.openaiProject) {
    config.openaiProject = credentials.openaiProject;
  }

  // AWS Bedrock/SageMaker
  if (credentials.awsAccessKeyId) {
    config.awsAccessKeyId = credentials.awsAccessKeyId;
  }
  if (credentials.awsSecretAccessKey) {
    config.awsSecretAccessKey = credentials.awsSecretAccessKey;
  }
  if (credentials.awsSessionToken) {
    config.awsSessionToken = credentials.awsSessionToken;
  }
  if (credentials.awsRegion) {
    config.awsRegion = credentials.awsRegion;
  }

  // Azure OpenAI
  if (credentials.resourceName) {
    config.azureResourceName = credentials.resourceName;
  }
  if (credentials.deploymentId) {
    config.azureDeploymentId = credentials.deploymentId;
  }
  if (credentials.apiVersion) {
    config.azureApiVersion = credentials.apiVersion;
  }
  if (credentials.azureAuthMode) {
    config.azureAuthMode = credentials.azureAuthMode;
  }
  if (credentials.azureAdToken) {
    config.azureAdToken = credentials.azureAdToken;
  }
  if (credentials.azureManagedClientId) {
    config.azureManagedClientId = credentials.azureManagedClientId;
  }
  if (credentials.azureWorkloadClientId) {
    config.azureWorkloadClientId = credentials.azureWorkloadClientId;
  }
  if (credentials.azureEntraClientId) {
    config.azureEntraClientId = credentials.azureEntraClientId;
  }
  if (credentials.azureEntraClientSecret) {
    config.azureEntraClientSecret = credentials.azureEntraClientSecret;
  }
  if (credentials.azureEntraTenantId) {
    config.azureEntraTenantId = credentials.azureEntraTenantId;
  }
  if (credentials.azureFoundryUrl) {
    config.azureFoundryUrl = credentials.azureFoundryUrl;
  }
  if (credentials.azureDeploymentName) {
    config.azureDeploymentName = credentials.azureDeploymentName;
  }
  if (credentials.azureApiVersion) {
    config.azureApiVersion = credentials.azureApiVersion;
  }

  // Google Vertex AI
  if (credentials.vertexProjectId) {
    config.vertexProjectId = credentials.vertexProjectId;
  }
  if (credentials.vertexRegion) {
    config.vertexRegion = credentials.vertexRegion;
  }
  if (credentials.vertexServiceAccountJson) {
    config.vertexServiceAccountJson = credentials.vertexServiceAccountJson;
  }

  return config;
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
  const inlineProviders = c.var.inlineProviders;

  // Look up provider credentials - inline config takes precedence over database
  const result = await getProviderCredentialsWithFallback(
    providerSlug,
    inlineProviders,
    db
  );

  if (!result) {
    return c.json(
      {
        error: {
          message:
            `Provider config not found for slug: ${providerSlug}. ` +
            `Configure it inline in your llmops config or add it to the database.`,
          type: 'invalid_request_error',
        },
      },
      404
    );
  }

  const { credentials, providerId } = result;

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

  // Build provider config for the gateway
  const providerConfig = buildProviderConfig(providerId, credentials);

  // Update the body with the extracted model name (without the @slug/ prefix)
  const updatedBody: Record<string, unknown> = {
    ...originalBody,
    model: modelName,
  };

  // Remove 'input_variables' from the final body as it's not part of OpenAI API spec
  delete updatedBody.input_variables;

  // Store resolved data in context
  c.set('providerConfig', providerConfig);
  c.set('providerId', providerId);
  c.set('variantModel', modelName);

  // Replace the request with the updated body
  const newHeaders = new Headers(c.req.raw.headers);
  const newRequest = new Request(c.req.raw.url, {
    method: c.req.raw.method,
    headers: newHeaders,
    body: JSON.stringify(updatedBody),
    duplex: 'half',
  } as RequestInit);

  Object.defineProperty(c.req, 'raw', {
    value: newRequest,
    writable: true,
    configurable: true,
  });
  (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache = {};

  logger.debug(
    { provider: providerId, model: modelName },
    'Gateway request [direct]'
  );

  await next();
}

/**
 * Middleware that resolves provider config and merges variant body.
 *
 * Flow:
 * 1. If no configId, check for @provider-slug/model format in request body
 * 2. If configId provided, uses manifest to resolve targeting rules and variant
 * 3. Fetches provider credentials from cache
 * 4. Builds ProviderConfig and stores in Hono context
 * 5. Modifies request body to merge variant config settings
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

    // Check if this is a responses API request (used by OpenAI Agents SDK)
    const isResponsesRequest =
      method === 'POST' &&
      contentType === 'application/json' &&
      path.endsWith('/responses');

    // Check if this is a JSON POST request that might contain a model field
    const isJsonPostRequest =
      method === 'POST' && contentType === 'application/json';

    // If no configId, check for @provider-slug/model format in any JSON POST request
    if (!configId && isJsonPostRequest) {
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

    // Config-based routing requires database
    if (!db || !kyselyDb) {
      return c.json(
        {
          error: {
            message:
              'Config-based routing requires a database. ' +
              'Either configure a database or use @provider-slug/model format for inline providers.',
            type: 'configuration_error',
          },
        },
        503
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

      const providerId = version.provider;

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

      // Build provider config for the gateway
      const providerConfig = buildProviderConfig(providerId, credentials);

      // Store resolved data in context
      c.set('providerConfig', providerConfig);
      c.set('providerId', providerId);
      c.set('variantConfig', variantConfig);
      c.set('variantModel', variantConfig.model || version.modelName);
      c.set('configId', routeResult.configId);
      c.set('variantId', routeResult.variantId);
      c.set('environmentId', routeResult.environmentId);

      if (isChatRequest || isResponsesRequest) {
        // Get original body and merge with variant config
        const originalBody = await c.req.json();

        // Extract input variables for nunjucks template rendering
        const inputVariables =
          originalBody.input_variables &&
          typeof originalBody.input_variables === 'object'
            ? (originalBody.input_variables as Record<string, unknown>)
            : {};

        // Use different merge function based on endpoint type
        const mergedBody = isResponsesRequest
          ? mergeResponsesBody(
              originalBody,
              variantConfig,
              version.modelName,
              inputVariables
            )
          : mergeChatCompletionBody(
              originalBody,
              variantConfig,
              version.modelName,
              inputVariables
            );

        // Remove 'input_variables' from the final body
        delete mergedBody.input_variables;

        // Replace the request with the merged body
        const newHeaders = new Headers(c.req.raw.headers);
        const newRequest = new Request(c.req.raw.url, {
          method: c.req.raw.method,
          headers: newHeaders,
          body: JSON.stringify(mergedBody),
          duplex: 'half',
        } as RequestInit);

        Object.defineProperty(c.req, 'raw', {
          value: newRequest,
          writable: true,
          configurable: true,
        });
        (c.req as unknown as { bodyCache: Record<string, unknown> }).bodyCache =
          {};

        logger.debug(
          { provider: providerId, model: mergedBody.model },
          'Gateway request [config]'
        );
      } else {
        logger.debug(
          { provider: providerId },
          'Gateway request [config/non-chat]'
        );
      }

      await next();
    } catch (error) {
      logger.error(`Gateway adapter error: ${error}`);

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
