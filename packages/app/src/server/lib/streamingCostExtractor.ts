/**
 * Streaming Cost Extractor
 *
 * A TransformStream wrapper that extracts usage information from SSE streams.
 * Compatible with OpenAI-format streaming responses.
 *
 * Usage information is typically included when `stream_options.include_usage: true`
 * is passed in the request. The final chunk before `data: [DONE]` contains the usage.
 */

import { logger } from '@llmops/core';

/**
 * Gateway hook result structure (from SSE events)
 */
export interface GatewayHookResults {
  before_request_hooks?: Array<{
    id: string;
    verdict: boolean;
    execution_time: number;
    checks: Array<{
      id: string;
      verdict: boolean;
      execution_time: number;
      error?: Error | null;
      data?: unknown;
    }>;
    deny: boolean;
    type: string;
  }>;
  after_request_hooks?: Array<{
    id: string;
    verdict: boolean;
    execution_time: number;
    checks: Array<{
      id: string;
      verdict: boolean;
      execution_time: number;
      error?: Error | null;
      data?: unknown;
    }>;
    deny: boolean;
    type: string;
  }>;
}

/**
 * Extracted usage data from streaming response
 */
export interface StreamingUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  cacheCreationTokens?: number;
  hookResults?: GatewayHookResults;
  output?: { role: string; content: string };
}

/**
 * OpenAI-compatible chunk structure for usage
 * Supports both chat completions format and responses API format
 */
interface StreamChunkUsage {
  usage?: {
    // Chat completions format
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
    prompt_tokens_details?: {
      cached_tokens?: number;
    };
    // Responses API format (OpenAI Agents SDK)
    input_tokens?: number;
    output_tokens?: number;
    input_tokens_details?: {
      cached_tokens?: number;
    };
    output_tokens_details?: {
      reasoning_tokens?: number;
    };
    // Anthropic format
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
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
  let extractedHookResults: GatewayHookResults | undefined = undefined;
  let buffer = '';
  let outputRole = '';
  let outputContent = '';
  let resolveUsage: (usage: StreamingUsage | null) => void;

  const usagePromise = new Promise<StreamingUsage | null>((resolve) => {
    resolveUsage = resolve;
  });

  const decoder = new TextDecoder();

  /**
   * Parse an SSE message and extract usage/hook_results
   */
  function parseSSEMessage(message: string): void {
    const trimmed = message.trim();
    if (!trimmed) return;

    // Parse SSE event format: "event: xxx\ndata: {...}"
    const lines = trimmed.split('\n');
    let eventType: string | null = null;
    let dataLine: string | null = null;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLine = line.slice(5).trim();
      }
    }

    // Skip [DONE] marker
    if (dataLine === '[DONE]') return;
    if (!dataLine) return;

    try {
      const parsed = JSON.parse(dataLine);

      logger.debug(
        { eventType, hasUsage: !!parsed.usage, keys: Object.keys(parsed) },
        'Streaming cost extractor: parsed SSE chunk',
      );

      // Check for hook_results event (Anthropic messages format)
      if (eventType === 'hook_results' || parsed.hook_results) {
        const hookData = parsed.hook_results || parsed;
        if (hookData.before_request_hooks || hookData.after_request_hooks) {
          extractedHookResults = {
            before_request_hooks: hookData.before_request_hooks,
            after_request_hooks: hookData.after_request_hooks,
          };
        }
      }

      // Accumulate output content from streaming deltas
      const delta = parsed.choices?.[0]?.delta;
      if (delta) {
        if (delta.role) outputRole = delta.role;
        if (delta.content) outputContent += delta.content;
      }

      // Check for usage in this chunk (OpenAI format)
      // Handle both chat completions format and responses API format
      // For responses API streaming, usage is nested in parsed.response.usage (response.done event)
      const usageData = parsed as StreamChunkUsage;
      const usage =
        usageData.usage ||
        (parsed.response as StreamChunkUsage | undefined)?.usage;
      if (usage) {
        logger.debug(
          { rawUsage: usage, fromResponseObject: !usageData.usage },
          'Streaming cost extractor: found usage in chunk',
        );
        const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
        const completionTokens =
          usage.completion_tokens ?? usage.output_tokens ?? 0;
        extractedUsage = {
          promptTokens,
          completionTokens,
          totalTokens: usage.total_tokens ?? promptTokens + completionTokens,
          cachedTokens:
            usage.prompt_tokens_details?.cached_tokens ??
            usage.input_tokens_details?.cached_tokens ??
            usage.cache_read_input_tokens,
          cacheCreationTokens: usage.cache_creation_input_tokens,
          hookResults: extractedHookResults,
        };
        logger.debug(
          { extractedUsage },
          'Streaming cost extractor: extracted usage',
        );
      }
    } catch {
      // Ignore parse errors - not all chunks are JSON
    }
  }

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
        parseSSEMessage(message);
      }
    },

    flush(controller) {
      // Process any remaining buffer
      if (buffer.trim()) {
        parseSSEMessage(buffer);
      }

      // Add hook results to usage if we have them
      if (extractedUsage && extractedHookResults) {
        extractedUsage.hookResults = extractedHookResults;
      } else if (!extractedUsage && extractedHookResults) {
        // If we have hook results but no usage, create a minimal usage object
        extractedUsage = {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          hookResults: extractedHookResults,
        };
      }

      // Attach accumulated output content
      if (extractedUsage && outputContent) {
        extractedUsage.output = {
          role: outputRole || 'assistant',
          content: outputContent,
        };
      }

      logger.debug(
        { hasUsage: !!extractedUsage, extractedUsage },
        'Streaming cost extractor: stream flush complete',
      );

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
  body: Record<string, unknown>,
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
