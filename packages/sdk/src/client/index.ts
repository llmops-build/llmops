import { type LLMOpsConfig, type ValidatedLLMOpsConfig } from '@llmops/core';
import { createApp } from '@llmops/app';

type ProviderConfig = {
  baseURL: string;
  apiKey: string;
  fetch: typeof globalThis.fetch;
};

export type TraceContext = {
  traceId?: string;
  spanName?: string;
  traceName?: string;
};

export type ProviderOptions = {
  traceContext?: () => TraceContext | null;
};

export type LLMOpsClient = {
  handler: (request: Request) => Promise<Response>;
  config: ValidatedLLMOpsConfig;
  provider: (options?: ProviderOptions) => ProviderConfig;
};

export const createLLMOps = (config?: LLMOpsConfig): LLMOpsClient => {
  const { app, config: validatedConfig } = createApp(config);
  const handler = async (req: Request) => app.fetch(req, undefined, undefined);
  const basePath = validatedConfig.basePath;

  const createInternalFetch = (
    getTraceContext?: () => TraceContext | null
  ): typeof globalThis.fetch => {
    return (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);

      // Strip basePath — same as what all middleware adapters do
      if (basePath && basePath !== '/' && url.pathname.startsWith(basePath)) {
        url.pathname = url.pathname.slice(basePath.length) || '/';
      }

      // Inject trace context headers if a provider is configured
      if (getTraceContext) {
        const ctx = getTraceContext();
        if (ctx) {
          const headers = new Headers(request.headers);
          if (ctx.traceId) {
            headers.set('x-llmops-trace-id', ctx.traceId);
          }
          if (ctx.traceName) {
            headers.set('x-llmops-trace-name', ctx.traceName);
          }
          if (ctx.spanName) {
            headers.set('x-llmops-span-name', ctx.spanName);
          }
          return handler(
            new Request(url.toString(), {
              method: request.method,
              headers,
              body: request.body,
              duplex: 'half',
            } as RequestInit)
          );
        }
      }

      return handler(new Request(url.toString(), request));
    };
  };

  return {
    handler,
    config: Object.freeze(validatedConfig),
    provider: (options?: ProviderOptions) => ({
      baseURL: `http://localhost${basePath}/api/genai/v1`,
      apiKey: 'llmops',
      fetch: createInternalFetch(options?.traceContext),
    }),
  };
};
