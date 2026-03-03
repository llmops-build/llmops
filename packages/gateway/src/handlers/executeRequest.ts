import { ok, type Result } from 'neverthrow';
import type { ProviderConfig } from '../types/provider';
import type { RequestType } from '../types/requests';
import type { EndpointConfig } from '../providers/types';
import { getProvider } from '../providers/registry';
import {
  type GatewayError,
  invalidRequest,
  serverError,
} from '../utils/responses';

/**
 * Execute a request against an upstream provider.
 *
 * 1. Resolve provider adapter from registry
 * 2. Check endpoint is supported
 * 3. Build upstream URL + headers
 * 4. Optionally transform request body
 * 5. Fetch upstream
 * 6. Optionally transform response/stream
 * 7. Return Result<Response, GatewayError>
 */
export async function executeRequest(
  config: ProviderConfig,
  request: Request,
  requestType: RequestType
): Promise<Result<Response, GatewayError>> {
  // 1. Resolve provider
  const adapter = getProvider(config.provider);
  if (!adapter) {
    return serverError(
      `Provider "${config.provider}" is not supported`
    );
  }

  // 2. Check endpoint support
  const endpointConfig: EndpointConfig | undefined =
    adapter.endpoints[requestType];
  if (!endpointConfig) {
    return invalidRequest(
      `Provider "${adapter.name}" does not support endpoint "${requestType}"`
    );
  }

  // 3. Build URL + headers
  const url = endpointConfig.getURL(config, requestType);
  const providerHeaders = endpointConfig.getHeaders(config, request);

  // Carry over content-type from the original request
  const contentType = request.headers.get('content-type');
  const headers: Record<string, string> = {
    ...providerHeaders,
    ...(contentType ? { 'content-type': contentType } : {}),
  };

  // 4. Build request body
  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (endpointConfig.transformRequestBody) {
      // Parse and transform
      const rawBody = await request.json();
      const transformed = endpointConfig.transformRequestBody(rawBody, config);
      body = JSON.stringify(transformed);
    } else {
      // Pass through as-is (no parsing)
      body = request.body;
    }
  }

  // 5. Fetch upstream
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: request.method,
      headers,
      body,
      // @ts-expect-error -- duplex is needed for streaming request bodies
      duplex: body instanceof ReadableStream ? 'half' : undefined,
    });
  } catch (e) {
    const cause =
      e instanceof Error && e.cause instanceof Error
        ? e.cause.message
        : undefined;
    const message = e instanceof Error ? e.message : String(e);
    const detail = cause ? `${message}: ${cause}` : message;
    return serverError(`Upstream request failed: ${detail}`);
  }

  // 6. Handle error responses from upstream
  if (!upstream.ok) {
    // Pass through upstream error response as-is
    return ok(
      new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: upstream.headers,
      })
    );
  }

  // 7. Transform response if needed
  const isStreaming =
    upstream.headers.get('content-type')?.includes('text/event-stream') ??
    false;

  if (isStreaming && endpointConfig.transformStreamEvent && upstream.body) {
    const transformedStream = createTransformedSSEStream(
      upstream.body,
      endpointConfig.transformStreamEvent,
      config
    );
    return ok(
      new Response(transformedStream, {
        status: upstream.status,
        headers: upstream.headers,
      })
    );
  }

  if (
    !isStreaming &&
    endpointConfig.transformResponseBody &&
    upstream.body
  ) {
    const rawBody = await upstream.json();
    const transformed = endpointConfig.transformResponseBody(rawBody, config);
    return ok(Response.json(transformed, { status: upstream.status }));
  }

  // Pass through as-is
  return ok(
    new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: upstream.headers,
    })
  );
}

/**
 * Create a TransformStream that transforms SSE events and pipe the
 * upstream through it.
 */
function createTransformedSSEStream(
  upstream: ReadableStream<Uint8Array>,
  transform: (event: string, config: ProviderConfig) => string,
  config: ProviderConfig
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let buffer = '';

  const transformer = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } else {
            const transformed = transform(data, config);
            controller.enqueue(encoder.encode(`data: ${transformed}\n\n`));
          }
        } else {
          controller.enqueue(encoder.encode(line + '\n'));
        }
      }
    },
    flush(controller) {
      if (buffer.length > 0) {
        if (buffer.startsWith('data: ')) {
          const data = buffer.slice(6);
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } else {
            const transformed = transform(data, config);
            controller.enqueue(encoder.encode(`data: ${transformed}\n\n`));
          }
        } else {
          controller.enqueue(encoder.encode(buffer + '\n'));
        }
      }
    },
  });

  upstream.pipeTo(transformer.writable).catch(() => {
    // Ignore errors — the readable side will see them
  });

  return transformer.readable;
}
