import type { ProviderConfig } from './types';

export async function proxyRequest(
  config: ProviderConfig,
  request: Request,
): Promise<Response> {
  // TODO: resolve provider adapter, build URL + headers, fetch
  return Response.json(
    { error: { message: `Provider "${config.provider}" not yet implemented`, type: 'server_error' } },
    { status: 501 },
  );
}
