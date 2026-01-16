import type { HttpActionBuilder, HttpRouter } from 'convex/server';
import type { LLMOpsClient } from '../../client/edge';

// Re-export the edge client for Convex users
export { createLLMOpsEdge } from '../../client/edge';

export const createLLMOpsConvexActions = ({
  router,
  httpAction,
  llmopsClient,
}: {
  router: HttpRouter;
  httpAction: HttpActionBuilder;
  llmopsClient: LLMOpsClient;
}) => {
  const handler = httpAction(async (ctx, request) => {
    return llmopsClient.handler(request);
  });

  const methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'] as const;

  methods.forEach((method) => {
    router.route({ path: llmopsClient.config.basePath, method, handler });
    router.route({
      pathPrefix: llmopsClient.config.basePath + '/',
      method,
      handler,
    });
  });

  return router;
};
