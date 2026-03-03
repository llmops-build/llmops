---
name: gateway-provider
description: Add a new LLM provider adapter to the @llmops/gateway package. Use when asked to "add a provider", "add X provider to gateway", "support X in gateway", or "implement gateway adapter for X".
metadata:
  author: llmops
  version: "1.0.0"
  argument-hint: <provider-name>
---

# Gateway Provider Skill

Scaffold and wire a new LLM provider adapter into `packages/gateway`.

## Architecture Overview

The gateway proxies requests to upstream LLM providers. Each provider is an adapter that knows how to build URLs, headers, and optionally transform request/response bodies.

### Key Files

| File | Purpose |
|---|---|
| `packages/gateway/src/providers/types.ts` | `ProviderAdapter` and `EndpointConfig` interfaces |
| `packages/gateway/src/providers/utils.ts` | Shared helpers: `defaultURL`, `bearerAuthHeader`, `extractForwardHeaders` |
| `packages/gateway/src/providers/openai-compatible.ts` | Factory for OpenAI-compatible providers (Bearer auth, same path layout, no transforms) |
| `packages/gateway/src/providers/openai.ts` | Reference: full custom provider with provider-specific headers |
| `packages/gateway/src/providers/registry.ts` | Maps provider name strings to `ProviderAdapter` instances |
| `packages/gateway/src/types/provider.ts` | `ProviderConfig` interface — add provider-specific config fields here |
| `packages/gateway/src/types/requests.ts` | `RequestType` enum — the 11 endpoint types |
| `packages/gateway/src/handlers/executeRequest.ts` | Core execution pipeline (do NOT modify unless adding new execution logic) |

### Interfaces

```typescript
interface EndpointConfig {
  getURL(config: ProviderConfig, requestType: RequestType): string;
  getHeaders(config: ProviderConfig, request: Request): Record<string, string>;
  transformRequestBody?(body: unknown, config: ProviderConfig): unknown;
  transformResponseBody?(body: unknown, config: ProviderConfig): unknown;
  transformStreamEvent?(event: string, config: ProviderConfig): string;
}

interface ProviderAdapter {
  name: string;
  endpoints: Partial<Record<RequestType, EndpointConfig>>;
}
```

### URL Resolution Pattern

Every provider resolves its base URL with this precedence:
1. `config.baseURL` (user override)
2. `config.customHost` (deprecated fallback)
3. Provider's hardcoded default

Then: `baseURL + RequestType` value (e.g. `https://api.example.com/v1` + `/chat/completions`).

## Steps to Add a New Provider

### Step 1: Determine provider category

- **OpenAI-compatible** (same paths, Bearer auth, no body transforms): Use the `openaiCompatible()` factory. This is a one-liner in the registry — no new file needed.
- **Custom provider** (different auth, URL scheme, or body format): Create a new file in `packages/gateway/src/providers/`.

### Step 2A: OpenAI-Compatible Provider (one-liner)

If the provider uses OpenAI-compatible paths and Bearer auth, just add to `packages/gateway/src/providers/registry.ts`:

```typescript
import { openaiCompatible } from './openai-compatible';

// In the registry object:
providername: openaiCompatible('ProviderName', 'https://api.provider.com/v1'),
```

### Step 2B: Custom Provider (new file)

Create `packages/gateway/src/providers/<providername>.ts`:

```typescript
import type { ProviderConfig } from '../types/provider';
import { RequestType } from '../types/requests';
import type { EndpointConfig, ProviderAdapter } from './types';
import { bearerAuthHeader, defaultURL, extractForwardHeaders } from './utils';

const DEFAULT_BASE_URL = 'https://api.provider.com/v1';

function resolveBaseURL(config: ProviderConfig): string {
  return config.baseURL ?? config.customHost ?? DEFAULT_BASE_URL;
}

function getURL(config: ProviderConfig, requestType: RequestType): string {
  return defaultURL(resolveBaseURL(config), requestType);
}

function getHeaders(
  config: ProviderConfig,
  request: Request
): Record<string, string> {
  return {
    ...bearerAuthHeader(config.apiKey),
    ...extractForwardHeaders(config, request),
    // Add provider-specific headers here
  };
}

function makeEndpoint(): EndpointConfig {
  return { getURL, getHeaders };
}

export const providername: ProviderAdapter = {
  name: 'providername',
  endpoints: {
    [RequestType.ChatCompletion]: makeEndpoint(),
    // Add only the endpoints this provider supports
  },
};
```

Then register it in `packages/gateway/src/providers/registry.ts`:

```typescript
import { providername } from './providername';

// In the registry object:
providername,
```

### Step 3: Add provider-specific config fields (if needed)

If the provider requires config beyond `apiKey`/`baseURL`, add fields to `ProviderConfig` in `packages/gateway/src/types/provider.ts`:

```typescript
// Provider Name
providerSpecificField?: string;
```

### Step 4: Add body transforms (if needed)

If the provider has a non-OpenAI request/response format, add transform functions to the `EndpointConfig`:

- `transformRequestBody` — convert OpenAI-format request to provider format
- `transformResponseBody` — convert provider response to OpenAI format
- `transformStreamEvent` — convert each SSE data event string (streaming)

### Step 5: Add tests

Add tests to `packages/gateway/src/proxy.test.ts` or `proxy.e2e.test.ts` following the existing pattern:

```typescript
test('routes <provider> chat completions', async () => {
  mockFetch.mockResolvedValueOnce(
    Response.json({ id: 'chatcmpl-test' }, { status: 200 })
  );

  const config: ProviderConfig = { provider: 'providername', apiKey: 'key-test' };
  const request = new Request('http://localhost/v1/chat/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ model: 'test-model', messages: [] }),
  });

  const response = await proxyRequest(config, request);
  expect(response.status).toBe(200);
  const [url, init] = mockFetch.mock.calls[0];
  expect(url).toBe('https://api.provider.com/v1/chat/completions');
  expect(init.headers['Authorization']).toBe('Bearer key-test');
});
```

### Step 6: Verify

```bash
cd packages/gateway && pnpm test -- --run
```

## Rules

- Always read the existing provider files before writing new code
- Use `openaiCompatible()` factory when possible — avoid unnecessary custom files
- Only add endpoints the provider actually supports (partial `endpoints` map is fine)
- Never modify `executeRequest.ts` or `proxy.ts` for a new provider
- Keep `ProviderConfig` additions grouped with a comment naming the provider
- Run tests after adding the provider
