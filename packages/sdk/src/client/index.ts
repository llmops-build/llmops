import { type LLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';

type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  fetch: typeof globalThis.fetch;
};

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: ValidatedLLMOpsConfig;
  provider: () => ProviderConfig;
};

export const createLLMOps = (config?: LLMOpsConfig): LLMOpsClient => {
  const { app, config: validatedConfig } = createApp(config);
  const handler = async (req: Request) => app.fetch(req, undefined, undefined);
  const basePath = validatedConfig.basePath;

  const internalFetch: typeof globalThis.fetch = (input, init) => {
    const request = new Request(input, init);
    const url = new URL(request.url);

    // Strip basePath — same as what all middleware adapters do
    if (basePath && basePath !== '/' && url.pathname.startsWith(basePath)) {
      url.pathname = url.pathname.slice(basePath.length) || '/';
    }

    return handler(new Request(url.toString(), request));
  };

  return {
    handler,
    config: Object.freeze(validatedConfig),
    provider: () => ({
      baseURL: `http://localhost${basePath}/api/genai/v1`,
      apiKey: 'llmops',
      fetch: internalFetch,
    }),
  };
};
