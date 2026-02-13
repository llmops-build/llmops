import { randomBytes } from 'node:crypto';
import {
  LLMOPS_TRACE_ID_HEADER,
  LLMOPS_TRACE_NAME_HEADER,
  LLMOPS_SPAN_NAME_HEADER,
  LLMOPS_SESSION_ID_HEADER,
  LLMOPS_USER_ID_HEADER,
} from '@llmops/core';

/**
 * Resolved trace context from request headers
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  sessionId: string | null;
  traceName: string | null;
  spanName: string | null;
  userId: string | null;
}

/**
 * Generate a 32-character hex trace ID (W3C format)
 */
export function generateTraceId(): string {
  return randomBytes(16).toString('hex');
}

/**
 * Generate a 16-character hex span ID (W3C format)
 */
export function generateSpanId(): string {
  return randomBytes(8).toString('hex');
}

/**
 * Format a W3C traceparent header value
 * Format: {version}-{traceId}-{spanId}-{traceFlags}
 */
export function formatTraceparent(traceId: string, spanId: string): string {
  return `00-${traceId}-${spanId}-01`;
}

/**
 * Parse a W3C traceparent header
 * Format: {version}-{traceId}-{parentSpanId}-{traceFlags}
 *
 * Returns null if the header is invalid
 */
function parseTraceparent(
  header: string
): { traceId: string; parentSpanId: string } | null {
  const parts = header.trim().split('-');
  if (parts.length < 4) return null;

  const [version, traceId, parentSpanId] = parts;

  // Version must be 2 hex chars
  if (!version || !/^[0-9a-f]{2}$/.test(version)) return null;
  // Trace ID must be 32 hex chars and not all zeros
  if (!traceId || !/^[0-9a-f]{32}$/.test(traceId)) return null;
  if (traceId === '00000000000000000000000000000000') return null;
  // Parent span ID must be 16 hex chars and not all zeros
  if (!parentSpanId || !/^[0-9a-f]{16}$/.test(parentSpanId)) return null;
  if (parentSpanId === '0000000000000000') return null;

  return { traceId, parentSpanId };
}

/**
 * Resolve trace context from an incoming request.
 *
 * Priority:
 * 1. Parse W3C `traceparent` header → extract traceId + parentSpanId
 * 2. Read `x-llmops-trace-id` header → use as traceId
 * 3. Neither → auto-generate traceId
 *
 * Always generates a new spanId for this hop.
 */
export function resolveTraceContext(req: { // eslint-disable-line @typescript-eslint/no-unused-vars
  header: (name: string) => string | undefined;
}): TraceContext {
  let traceId: string | null = null;
  let parentSpanId: string | null = null;

  // 1. Try W3C traceparent
  const traceparent = req.header('traceparent');
  if (traceparent) {
    const parsed = parseTraceparent(traceparent);
    if (parsed) {
      traceId = parsed.traceId;
      parentSpanId = parsed.parentSpanId;
    }
  }

  // 2. Fall back to x-llmops-trace-id
  if (!traceId) {
    const customTraceId = req.header(LLMOPS_TRACE_ID_HEADER);
    if (customTraceId && /^[0-9a-f]{32}$/.test(customTraceId)) {
      traceId = customTraceId;
    }
  }

  // 3. Auto-generate
  if (!traceId) {
    traceId = generateTraceId();
  }

  // Always generate a new span ID for this gateway hop
  const spanId = generateSpanId();

  return {
    traceId,
    spanId,
    parentSpanId,
    sessionId: req.header(LLMOPS_SESSION_ID_HEADER) ?? null,
    traceName: req.header(LLMOPS_TRACE_NAME_HEADER) ?? null,
    spanName: req.header(LLMOPS_SPAN_NAME_HEADER) ?? null,
    userId: req.header(LLMOPS_USER_ID_HEADER) ?? null,
  };
}
