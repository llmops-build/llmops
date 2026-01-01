/**
 * Streaming Cost Extractor
 *
 * A TransformStream wrapper that extracts usage information from SSE streams.
 * Compatible with OpenAI-format streaming responses.
 *
 * Usage information is typically included when `stream_options.include_usage: true`
 * is passed in the request. The final chunk before `data: [DONE]` contains the usage.
 */

/**
 * Extracted usage data from streaming response
 */
export interface StreamingUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
}

/**
 * OpenAI-compatible chunk structure for usage
 */
interface StreamChunkUsage {
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
    };
  };
}

/**
 * Callback invoked when stream completes with extracted usage
 */
export type UsageCallback = (usage: StreamingUsage | null) => void;

/**
 * Creates a TransformStream that passes through SSE data while extracting usage info.
 *
 * @param onComplete - Callback invoked when stream completes with extracted usage
 * @returns TransformStream that passes through the original stream
 *
 * @example
 * ```typescript
 * const { stream, usagePromise } = createStreamingCostExtractor();
 *
 * // Pipe the response through the extractor
 * const transformedResponse = originalResponse.body.pipeThrough(stream);
 *
 * // Later, get the usage
 * const usage = await usagePromise;
 * if (usage) {
 *   console.log(`Tokens used: ${usage.totalTokens}`);
 * }
 * ```
 */
export function createStreamingCostExtractor(): {
  stream: TransformStream<Uint8Array, Uint8Array>;
  usagePromise: Promise<StreamingUsage | null>;
} {
  let extractedUsage: StreamingUsage | null = null;
  let buffer = '';
  let resolveUsage: (usage: StreamingUsage | null) => void;

  const usagePromise = new Promise<StreamingUsage | null>((resolve) => {
    resolveUsage = resolve;
  });

  const decoder = new TextDecoder();

  const stream = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      // Pass through the original chunk unchanged
      controller.enqueue(chunk);

      // Decode and process for usage extraction
      const text = decoder.decode(chunk, { stream: true });
      buffer += text;

      // Process complete SSE messages (each ends with \n\n)
      const messages = buffer.split('\n\n');
      // Keep the last potentially incomplete message in the buffer
      buffer = messages.pop() || '';

      for (const message of messages) {
        const trimmed = message.trim();
        if (!trimmed) continue;

        // Skip non-data messages
        if (!trimmed.startsWith('data:')) continue;

        // Extract the JSON part
        const jsonPart = trimmed.slice(5).trim();

        // Skip [DONE] marker
        if (jsonPart === '[DONE]') continue;

        try {
          const parsed: StreamChunkUsage = JSON.parse(jsonPart);

          // Check for usage in this chunk
          if (parsed.usage) {
            extractedUsage = {
              promptTokens: parsed.usage.prompt_tokens ?? 0,
              completionTokens: parsed.usage.completion_tokens ?? 0,
              totalTokens: parsed.usage.total_tokens ?? 0,
              cachedTokens: parsed.usage.prompt_tokens_details?.cached_tokens,
            };
          }
        } catch {
          // Ignore parse errors - not all chunks are JSON
        }
      }
    },

    flush(controller) {
      // Process any remaining buffer
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (trimmed.startsWith('data:')) {
          const jsonPart = trimmed.slice(5).trim();
          if (jsonPart !== '[DONE]') {
            try {
              const parsed: StreamChunkUsage = JSON.parse(jsonPart);
              if (parsed.usage) {
                extractedUsage = {
                  promptTokens: parsed.usage.prompt_tokens ?? 0,
                  completionTokens: parsed.usage.completion_tokens ?? 0,
                  totalTokens: parsed.usage.total_tokens ?? 0,
                  cachedTokens:
                    parsed.usage.prompt_tokens_details?.cached_tokens,
                };
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      // Resolve the usage promise
      resolveUsage(extractedUsage);
    },
  });

  return { stream, usagePromise };
}

/**
 * Wraps a Response with a streaming body to extract usage information.
 *
 * @param response - Original streaming Response
 * @returns Object with transformed response and promise for usage data
 *
 * @example
 * ```typescript
 * const result = wrapStreamingResponse(originalResponse);
 *
 * // Return the transformed response to the client
 * return result.response;
 *
 * // After response is sent, get usage for cost tracking
 * result.usagePromise.then((usage) => {
 *   if (usage) {
 *     trackCost(usage);
 *   }
 * });
 * ```
 */
export function wrapStreamingResponse(response: Response): {
  response: Response;
  usagePromise: Promise<StreamingUsage | null>;
} {
  if (!response.body) {
    return {
      response,
      usagePromise: Promise.resolve(null),
    };
  }

  const { stream, usagePromise } = createStreamingCostExtractor();

  const transformedBody = response.body.pipeThrough(stream);

  const transformedResponse = new Response(transformedBody, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });

  return {
    response: transformedResponse,
    usagePromise,
  };
}

/**
 * Checks if a request is a streaming request based on the body
 *
 * @param body - Request body (already parsed JSON)
 * @returns true if stream: true is set
 */
export function isStreamingRequest(body: Record<string, unknown>): boolean {
  return body.stream === true;
}

/**
 * Ensures stream_options.include_usage is set for cost tracking
 * Modifies the body in place.
 *
 * @param body - Request body (will be modified)
 * @returns Modified body with include_usage enabled
 */
export function ensureStreamUsageEnabled(
  body: Record<string, unknown>
): Record<string, unknown> {
  if (body.stream === true) {
    const streamOptions =
      (body.stream_options as Record<string, unknown>) || {};
    body.stream_options = {
      ...streamOptions,
      include_usage: true,
    };
  }
  return body;
}
