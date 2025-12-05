import type { MiddlewareHandler } from 'hono';
import { providers } from '@llmops/core';

export const createLLMProvidersMiddleware = (): MiddlewareHandler => {
  let initialized = false;
  let providerInstances: Record<
    keyof typeof providers,
    ReturnType<(typeof providers)[keyof typeof providers]['createProvider']>
  >;

  return async (c, next) => {
    if (!initialized) {
      const config = c.get('llmopsConfig');
      providerInstances = Object.entries(providers).reduce(
        (acc, [key, providerFactory]) => {
          if (config.providers[key as keyof typeof providers]) {
            acc[key as keyof typeof providers] = providerFactory.createProvider(
              config.providers[key as keyof typeof providers]
            );
          }
          return acc;
        },
        {} as Record<keyof typeof providers, any>
      );
      initialized = true;
    }
    c.set('providers', providerInstances);
    await next();
  };
};
