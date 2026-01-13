# Portkey Gateway Modifications for LLMOps

This document describes the modifications made to the Portkey gateway code to support LLMOps-specific functionality.

## Overview

The main changes involve:

1. **Provider ID mapping** between models.dev and Portkey gateway
2. **Azure OpenAI configuration** support through JSON config
3. **Config schema updates** for additional provider fields

---

## 1. Provider ID Mapping

### Problem

models.dev uses different provider IDs than Portkey gateway for some providers. For example:

- models.dev: `reka` → Portkey: `reka-ai`
- models.dev: `azure-cognitive-services` → Portkey: `azure-openai`
- models.dev: `azure` → Portkey: `azure-openai`

### Solution

#### New File: `packages/gateway/src/providers/providerIdMapping.ts`

```typescript
/**
 * Provider ID mapping between models.dev and Portkey gateway.
 *
 * models.dev uses different provider IDs than Portkey for some providers.
 * This mapping allows converting from models.dev IDs to Portkey gateway IDs.
 *
 * Key: models.dev provider ID
 * Value: Portkey gateway provider ID
 */
export const MODELS_DEV_TO_PORTKEY_PROVIDER_MAP: Record<string, string> = {
  // models.dev uses 'reka', Portkey uses 'reka-ai'
  reka: 'reka-ai',
  'azure-cognitive-services': 'azure-openai',
  azure: 'azure-openai',
};

/**
 * Reverse mapping from Portkey to models.dev
 */
export const PORTKEY_TO_MODELS_DEV_PROVIDER_MAP: Record<string, string> =
  Object.fromEntries(
    Object.entries(MODELS_DEV_TO_PORTKEY_PROVIDER_MAP).map(([k, v]) => [v, k])
  );

/**
 * Get the Portkey gateway provider ID for a given models.dev provider ID.
 * Returns the original ID if no mapping exists.
 */
export function getPortkeyProviderId(modelsDevProviderId: string): string {
  return (
    MODELS_DEV_TO_PORTKEY_PROVIDER_MAP[modelsDevProviderId] ??
    modelsDevProviderId
  );
}

/**
 * Get the models.dev provider ID for a given Portkey gateway provider ID.
 * Returns the original ID if no mapping exists.
 */
export function getModelsDevProviderId(portkeyProviderId: string): string {
  return (
    PORTKEY_TO_MODELS_DEV_PROVIDER_MAP[portkeyProviderId] ?? portkeyProviderId
  );
}
```

#### Modified Files

**`packages/gateway/src/providers/index.ts`**

- Added exports for mapping functions

**`packages/gateway/src/index.ts`**

- Added exports for mapping functions

**`packages/gateway/src/middlewares/requestValidator/index.ts`**

- Added `isValidProvider()` function that accepts both direct Portkey IDs and mapped models.dev IDs

```typescript
import { getPortkeyProviderId } from '../../providers/providerIdMapping';

function isValidProvider(value: string): boolean {
  if (VALID_PROVIDERS.includes(value)) {
    return true;
  }
  const mappedId = getPortkeyProviderId(value);
  return VALID_PROVIDERS.includes(mappedId);
}
```

**`packages/gateway/src/middlewares/requestValidator/schema/config.ts`**

- Updated provider validation to use `isValidProvider()` with mapping support

**`packages/gateway/src/handlers/services/providerContext.ts`**

- Maps provider ID in constructor using `getPortkeyProviderId()`

```typescript
import { getPortkeyProviderId } from '../../providers/providerIdMapping';

export class ProviderContext {
  constructor(private provider: string) {
    // Map models.dev provider ID to Portkey provider ID if needed
    this.provider = getPortkeyProviderId(provider);
    if (!Providers[this.provider]) {
      throw new GatewayError(`Provider ${provider} not found`);
    }
  }
  // ...
}
```

**`packages/gateway/src/services/transformToProviderRequest.ts`**

- Added import for `getPortkeyProviderId`
- Updated provider config lookup to use mapped provider ID

```typescript
import { getPortkeyProviderId } from '../providers/providerIdMapping';

// Line ~273
const providerAPIConfig = ProviderConfigs[getPortkeyProviderId(provider)].api;
```

**`packages/gateway/src/handlers/responseHandlers.ts`**

- Maps provider ID using `getPortkeyProviderId()`

**`packages/gateway/src/handlers/realtimeHandler.ts`**

- Maps provider ID using `getPortkeyProviderId()`

**`packages/gateway/src/handlers/realtimeHandlerNode.ts`**

- Maps provider ID using `getPortkeyProviderId()`

---

## 2. Azure OpenAI Configuration Support

### Problem

Azure OpenAI requires specific configuration fields (`resourceName`, `deploymentId`, `apiVersion`) to construct the API URL:

```
https://{resourceName}.openai.azure.com/openai/deployments/{deploymentId}/chat/completions?api-version={apiVersion}
```

When using JSON config (via `x-llmops-config` header), these fields need to be:

1. Accepted in the schema with `azure_*` prefix (snake_case)
2. Converted to camelCase (`azureResourceName`, etc.)
3. Normalized to the format the Azure provider expects (`resourceName`, etc.)

### Solution

#### Modified: `packages/gateway/src/middlewares/requestValidator/schema/config.ts`

Added Azure-specific fields to the config schema:

```typescript
export const configSchema: any = z.object({
  // ... existing fields ...

  // AzureOpenAI specific
  azure_resource_name: z.string().optional(),
  azure_deployment_id: z.string().optional(),
  azure_api_version: z.string().optional(),
  azure_model_name: z.string().optional(),
  azure_auth_mode: z.string().optional(),
  azure_ad_token: z.string().optional(),
  azure_managed_client_id: z.string().optional(),
  azure_workload_client_id: z.string().optional(),
  azure_entra_client_id: z.string().optional(),
  azure_entra_client_secret: z.string().optional(),
  azure_entra_tenant_id: z.string().optional(),
  strict_open_ai_compliance: z.boolean().optional(),

  // ... rest of schema ...
});
```

#### Modified: `packages/gateway/src/handlers/handlerUtils.ts`

Added `normalizeAzureConfig()` function to convert field names from JSON config format to provider format:

```typescript
/**
 * Normalizes Azure OpenAI config fields from JSON config format to provider format.
 * JSON config uses `azure_*` prefix (e.g., `azure_resource_name`) which converts to `azureResourceName`,
 * but the provider expects `resourceName`, `deploymentId`, etc.
 * This function recursively normalizes nested targets as well.
 */
function normalizeAzureConfig(
  config: Record<string, any>
): Record<string, any> {
  const normalized = { ...config };

  // Map azureResourceName -> resourceName
  if (normalized.azureResourceName && !normalized.resourceName) {
    normalized.resourceName = normalized.azureResourceName;
  }
  // Map azureDeploymentId -> deploymentId
  if (normalized.azureDeploymentId && !normalized.deploymentId) {
    normalized.deploymentId = normalized.azureDeploymentId;
  }
  // Map azureApiVersion -> apiVersion
  if (normalized.azureApiVersion && !normalized.apiVersion) {
    normalized.apiVersion = normalized.azureApiVersion;
  }

  // Recursively normalize nested targets
  if (Array.isArray(normalized.targets)) {
    normalized.targets = normalized.targets.map((target: Record<string, any>) =>
      normalizeAzureConfig(target)
    );
  }

  return normalized;
}
```

Updated `constructConfigFromRequestHeaders()` to use the normalizer:

```typescript
// In constructConfigFromRequestHeaders function
const camelCaseConfig = convertKeysToCamelCase(parsedConfigJson, [
  // ... preserved keys ...
]) as any;
// Normalize Azure fields for providers that expect non-prefixed names
return normalizeAzureConfig(camelCaseConfig);
```

---

## 3. LLMOps Gateway Adapter

### File: `packages/app/src/server/handlers/genai/gatewayAdapter.ts`

The gateway adapter translates LLMOps config to Portkey gateway format.

#### Provider ID Mapping

```typescript
const MODELS_DEV_TO_PORTKEY_PROVIDER_MAP: Record<string, string> = {
  reka: 'reka-ai',
  'azure-cognitive-services': 'azure-openai',
  azure: 'azure-openai',
};

function getPortkeyProviderId(providerId: string): string {
  return MODELS_DEV_TO_PORTKEY_PROVIDER_MAP[providerId] ?? providerId;
}
```

#### PortkeyConfig Interface

```typescript
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
  cache?: { mode: 'simple' | 'semantic'; max_age?: number };
  retry?: { attempts: number; on_status_codes?: number[] };
  request_timeout?: number;
  custom_host?: string;
  forward_headers?: string[];
  weight?: number;
  on_status_codes?: number[];
}
```

#### Azure Field Mapping

The adapter maps provider config fields from the database to Portkey config format:

```typescript
// Azure OpenAI
if (configData?.resourceName) {
  portkeyConfig.azure_resource_name = configData.resourceName;
}
if (configData?.deploymentId) {
  portkeyConfig.azure_deployment_id = configData.deploymentId;
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
  portkeyConfig.azure_workload_client_id = configData.azureWorkloadClientId;
}
if (configData?.azureEntraClientId) {
  portkeyConfig.azure_entra_client_id = configData.azureEntraClientId;
}
if (configData?.azureEntraClientSecret) {
  portkeyConfig.azure_entra_client_secret = configData.azureEntraClientSecret;
}
if (configData?.azureEntraTenantId) {
  portkeyConfig.azure_entra_tenant_id = configData.azureEntraTenantId;
}
```

---

## 4. Azure OpenAI Provider Config Requirements

For Azure OpenAI to work, the provider config in the database must include:

| Field          | Description         | Example                |
| -------------- | ------------------- | ---------------------- |
| `resourceName` | Azure resource name | `"my-azure-openai"`    |
| `deploymentId` | Deployment name     | `"gpt-4o-deployment"`  |
| `apiVersion`   | Azure API version   | `"2024-02-15-preview"` |
| `apiKey`       | Azure API key       | `"abc123..."`          |

Optional authentication fields:

- `azureAuthMode`: `'apiKey'` | `'entra'` | `'managed'` | `'workload'`
- `azureAdToken`: For AD token authentication
- `azureManagedClientId`: For managed identity
- `azureWorkloadClientId`: For workload identity
- `azureEntraClientId`, `azureEntraClientSecret`, `azureEntraTenantId`: For Entra ID authentication

---

## 5. Data Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Request Flow                                   │
└─────────────────────────────────────────────────────────────────────────┘

1. Client Request
   └── Headers: Authorization, X-LLMOps-Config
   └── Body: { model, messages, ... }

2. Gateway Adapter (gatewayAdapter.ts)
   └── Fetch variant config from DB
   └── Fetch provider config from DB
   └── Map provider ID (models.dev → Portkey)
   └── Build PortkeyConfig with azure_* fields
   └── Set x-llmops-config header with JSON config

3. Request Validator (requestValidator/index.ts)
   └── Validate provider ID (with mapping support)
   └── Parse and validate JSON config schema

4. Handler Utils (handlerUtils.ts)
   └── constructConfigFromRequestHeaders()
   └── convertKeysToCamelCase() → azureResourceName, etc.
   └── normalizeAzureConfig() → resourceName, deploymentId, apiVersion

5. Provider Context (providerContext.ts)
   └── Map provider ID using getPortkeyProviderId()
   └── Get provider config from Providers registry

6. Transform Request (transformToProviderRequest.ts)
   └── Get API config using mapped provider ID
   └── Transform request body to provider format

7. Azure OpenAI API (azure-openai/api.ts)
   └── getBaseURL(): https://{resourceName}.openai.azure.com/openai
   └── getEndpoint(): /deployments/{deploymentId}/chat/completions?api-version=...
   └── headers(): api-key or Bearer token
```

---

## 6. Testing

To test Azure OpenAI integration:

```bash
curl http://localhost:5177/api/genai/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-api-key>" \
  -H "X-LLMOps-Config: <config-id>" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

Ensure the provider config in the database has:

- `resourceName`: Your Azure resource name
- `deploymentId`: Your deployment name
- `apiVersion`: API version (e.g., "2024-02-15-preview")
- `apiKey`: Your Azure API key

---

## 7. Files Changed Summary

| File                                                                 | Changes                                   |
| -------------------------------------------------------------------- | ----------------------------------------- |
| `packages/gateway/src/providers/providerIdMapping.ts`                | **NEW** - Provider ID mapping functions   |
| `packages/gateway/src/providers/index.ts`                            | Export mapping functions                  |
| `packages/gateway/src/index.ts`                                      | Export mapping functions                  |
| `packages/gateway/src/middlewares/requestValidator/index.ts`         | `isValidProvider()` with mapping          |
| `packages/gateway/src/middlewares/requestValidator/schema/config.ts` | Azure fields in schema                    |
| `packages/gateway/src/handlers/handlerUtils.ts`                      | `normalizeAzureConfig()` function         |
| `packages/gateway/src/handlers/services/providerContext.ts`          | Map provider in constructor               |
| `packages/gateway/src/services/transformToProviderRequest.ts`        | Use mapped provider for config lookup     |
| `packages/gateway/src/handlers/responseHandlers.ts`                  | Map provider ID                           |
| `packages/gateway/src/handlers/realtimeHandler.ts`                   | Map provider ID                           |
| `packages/gateway/src/handlers/realtimeHandlerNode.ts`               | Map provider ID                           |
| `packages/app/src/server/handlers/genai/gatewayAdapter.ts`           | Azure fields mapping, provider ID mapping |

---

## 8. Browser-Safe Provider ID Mapping

### Problem

The `@llmops/gateway` package exports provider ID mapping functions (`getPortkeyProviderId`, etc.), but importing from `@llmops/gateway` in frontend code causes a runtime error:

```
ReferenceError: process is not defined
```

This happens because `@llmops/gateway` imports a logger utility that uses `process.env` at module initialization time, which doesn't exist in browser environments.

### Solution

Create a separate browser-safe provider ID mapping in the app's shared directory that can be used by both client and server code.

#### New File: `packages/app/src/shared/provider-id-mapping.ts`

```typescript
/**
 * Provider ID mapping between models.dev and internal gateway IDs.
 *
 * models.dev uses different provider IDs than the internal gateway for some providers.
 * This mapping allows converting from models.dev IDs to internal gateway IDs.
 *
 * This file is browser-safe and can be used in both client and server code.
 */
export const MODELS_DEV_TO_INTERNAL_PROVIDER_MAP: Record<string, string> = {
  'azure-cognitive-services': 'azure-ai',
  azure: 'azure-openai',
};

export const INTERNAL_TO_MODELS_DEV_PROVIDER_MAP: Record<string, string> =
  Object.fromEntries(
    Object.entries(MODELS_DEV_TO_INTERNAL_PROVIDER_MAP).map(([k, v]) => [v, k])
  );

export function getInternalProviderId(modelsDevProviderId: string): string {
  return (
    MODELS_DEV_TO_INTERNAL_PROVIDER_MAP[modelsDevProviderId] ??
    modelsDevProviderId
  );
}

export function getModelsDevProviderId(internalProviderId: string): string {
  return (
    INTERNAL_TO_MODELS_DEV_PROVIDER_MAP[internalProviderId] ??
    internalProviderId
  );
}
```

### Usage

In frontend code, import from the shared module instead of `@llmops/gateway`:

```typescript
// DON'T do this in frontend code - will cause "process is not defined" error
import { getPortkeyProviderId } from '@llmops/gateway';

// DO this instead - browser-safe
import { getInternalProviderId } from '@shared/provider-id-mapping';
```

### Example: Provider Field Definitions

The `provider-field-definitions.ts` uses the mapping to look up form fields for providers:

```typescript
// packages/app/src/client/routes/(app)/settings/_settings/-components/provider-field-definitions.ts

import { getInternalProviderId } from '@shared/provider-id-mapping';

export function getProviderFields(
  providerId: string
): ProviderFieldDefinition[] {
  // Normalize provider ID (e.g., 'azure-cognitive-services' -> 'azure-ai')
  const normalizedId = getInternalProviderId(providerId);
  const config = providerFieldDefinitions[normalizedId];
  return config?.fields || baseFields;
}
```

### Key Points

1. **Keep mappings in sync**: The mapping in `@shared/provider-id-mapping.ts` should match the mapping in `@llmops/gateway/src/providers/providerIdMapping.ts`

2. **Use appropriate import based on context**:
   - **Server-side code**: Can use either `@llmops/gateway` or `@shared/provider-id-mapping`
   - **Client-side code**: Must use `@shared/provider-id-mapping`

3. **Why two mappings exist**:
   - `@llmops/gateway` mapping is authoritative for the gateway runtime
   - `@shared/provider-id-mapping` is a browser-safe copy for UI code

### Files Changed

| File                                                                                                | Changes                                                        |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `packages/app/src/shared/provider-id-mapping.ts`                                                    | **NEW** - Browser-safe provider ID mapping                     |
| `packages/app/src/client/routes/(app)/settings/_settings/-components/provider-field-definitions.ts` | Use `@shared/provider-id-mapping` instead of `@llmops/gateway` |

---

## 9. Provider Request Logging

### Problem

Need visibility into the actual HTTP requests being sent to LLM providers for debugging purposes.

### Solution

Added comprehensive request/response logging to the gateway's retry handler, which is where all provider HTTP requests are made.

#### Modified File: `packages/gateway/src/handlers/retryHandler.ts`

```typescript
import { createLogger } from '../shared/utils/logger';

const logger = createLogger('ProviderRequest');

/**
 * Sanitizes headers by masking sensitive values like API keys and tokens
 */
function sanitizeHeaders(
  headers: HeadersInit | undefined
): Record<string, string> {
  if (!headers) return {};

  const sanitized: Record<string, string> = {};
  const sensitivePatterns =
    /^(authorization|x-api-key|api-key|x-.*-key|x-.*-token|x-.*-secret|bearer)$/i;

  const headersObj =
    headers instanceof Headers
      ? Object.fromEntries([...headers])
      : Array.isArray(headers)
        ? Object.fromEntries(headers)
        : (headers as Record<string, string>);

  for (const [key, value] of Object.entries(headersObj)) {
    if (sensitivePatterns.test(key)) {
      // Show first 8 chars and mask the rest
      sanitized[key] =
        value.length > 12 ? `${value.substring(0, 8)}...****` : '****';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logs the outgoing request to the provider
 */
function logProviderRequest(
  url: string,
  options: RequestInit,
  attempt: number
): void {
  const sanitizedHeaders = sanitizeHeaders(options.headers);

  let bodyPreview: string | undefined;
  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        const parsed = JSON.parse(options.body);
        const bodyStr = JSON.stringify(parsed, null, 2);
        bodyPreview =
          bodyStr.length > 2000 ? `${bodyStr.substring(0, 2000)}...` : bodyStr;
      } catch {
        bodyPreview =
          options.body.length > 500
            ? `${options.body.substring(0, 500)}...`
            : options.body;
      }
    } else if (options.body instanceof FormData) {
      bodyPreview = '[FormData]';
    } else if (options.body instanceof ArrayBuffer) {
      bodyPreview = `[ArrayBuffer: ${options.body.byteLength} bytes]`;
    } else if (options.body instanceof ReadableStream) {
      bodyPreview = '[ReadableStream]';
    }
  }

  logger.debug(`Provider Request (attempt ${attempt})`, {
    url,
    method: options.method || 'GET',
    headers: sanitizedHeaders,
    body: bodyPreview,
  });
}

/**
 * Logs the provider response
 */
function logProviderResponse(
  url: string,
  response: Response,
  attempt: number,
  durationMs: number
): void {
  logger.debug(`Provider Response (attempt ${attempt})`, {
    url,
    status: response.status,
    statusText: response.statusText,
    durationMs,
    headers: Object.fromEntries([...response.headers]),
  });
}
```

### Enabling Logging

The logging uses DEBUG level. To see provider request logs, set the environment variable:

```bash
LOG_LEVEL=DEBUG
```

### Example Output

```
[2026-01-12T10:30:00.000Z] [ProviderRequest] [DEBUG] Provider Request (attempt 1) {
  url: 'https://api.openai.com/v1/chat/completions',
  method: 'POST',
  headers: {
    authorization: 'Bearer sk-...****',
    'content-type': 'application/json'
  },
  body: '{\n  "model": "gpt-4o",\n  "messages": [{"role": "user", "content": "Hello"}]\n}'
}

[2026-01-12T10:30:01.234Z] [ProviderRequest] [DEBUG] Provider Response (attempt 1) {
  url: 'https://api.openai.com/v1/chat/completions',
  status: 200,
  statusText: 'OK',
  durationMs: 1234,
  headers: { 'content-type': 'application/json', ... }
}
```

### Security

- API keys in headers are automatically masked (shows first 8 chars + `...****`)
- Sensitive header patterns: `authorization`, `x-api-key`, `api-key`, `x-*-key`, `x-*-token`, `x-*-secret`, `bearer`
- Request bodies are truncated to 2000 chars max

### Files Changed

| File                                            | Changes                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------ |
| `packages/gateway/src/handlers/retryHandler.ts` | Added `sanitizeHeaders()`, `logProviderRequest()`, `logProviderResponse()` functions |
