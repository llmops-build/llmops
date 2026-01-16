import type { GenericActionCtx } from 'convex/server';
import type { LLMOpsClient } from '../../client';

/**
 * Create a handler for Convex HTTP actions
 *
 * This handler wraps the LLMOps app to work within Convex HTTP actions.
 */
export function createLLMOpsHandler(client: LLMOpsClient) {
  const basePath = client.config.basePath;

  return async (
    _ctx: GenericActionCtx<any>,
    request: Request
  ): Promise<Response> => {
    let urlPath = new URL(request.url).pathname;

    // Strip the base path if it exists
    if (basePath && basePath !== '/' && urlPath.startsWith(basePath)) {
      urlPath = urlPath.slice(basePath.length) || '/';
    }

    const url = new URL(urlPath, request.url);

    const newRequest = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });

    return client.handler(newRequest);
  };
}

// Re-export Convex adapter and schema generator
export {
  ConvexAdapter,
  createConvexAdapter,
  ConvexMigrationAdapter,
  createConvexMigrationAdapter,
  type ConvexAdapterOptions,
  type ConvexClientInterface,
} from '../../convex/adapter';

export {
  generateConvexSchema,
  generateConvexFunctionsTemplate,
  printConvexSchema,
  printConvexFunctionsTemplate,
} from '../../convex/schema-generator';
