export const TRACE_ID_HEADER = 'x-llmops-trace-id';
export const SPAN_ID_HEADER = 'x-llmops-span-id';
export const TRACE_NAME_HEADER = 'x-llmops-trace-name';
export const SPAN_NAME_HEADER = 'x-llmops-span-name';
export const SESSION_ID_HEADER = 'x-llmops-session-id';
export const USER_ID_HEADER = 'x-llmops-user-id';
export const REQUEST_ID_HEADER = 'x-llmops-request-id';

export interface GatewayTraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceName?: string;
  spanName?: string;
  sessionId?: string;
  userId?: string;
}

function randomHex(bytes: number): string {
  const value = new Uint8Array(bytes);
  crypto.getRandomValues(value);
  return Array.from(value, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseTraceparent(
  value: string | null,
): { traceId: string; parentSpanId: string } | null {
  if (!value) return null;
  const match =
    /^00-([0-9a-f]{32})-([0-9a-f]{16})-[0-9a-f]{2}(?:-.*)?$/i.exec(
      value.trim(),
    );
  if (!match || !match[1] || !match[2]) return null;
  if (/^0+$/.test(match[1]) || /^0+$/.test(match[2])) return null;
  return {
    traceId: match[1].toLowerCase(),
    parentSpanId: match[2].toLowerCase(),
  };
}

function validTraceId(value: string | null): string | undefined {
  return value && /^[0-9a-f]{32}$/i.test(value) && !/^0+$/.test(value)
    ? value.toLowerCase()
    : undefined;
}

export function resolveGatewayTraceContext(
  headers: Headers,
): GatewayTraceContext {
  const parent = parseTraceparent(headers.get('traceparent'));
  return {
    traceId:
      parent?.traceId ?? validTraceId(headers.get(TRACE_ID_HEADER)) ?? randomHex(16),
    spanId: randomHex(8),
    parentSpanId: parent?.parentSpanId,
    traceName: headers.get(TRACE_NAME_HEADER) ?? undefined,
    spanName: headers.get(SPAN_NAME_HEADER) ?? undefined,
    sessionId: headers.get(SESSION_ID_HEADER) ?? undefined,
    userId: headers.get(USER_ID_HEADER) ?? undefined,
  };
}

export function applyTraceHeaders(
  headers: Headers,
  requestId: string,
  trace: GatewayTraceContext,
): void {
  headers.set(REQUEST_ID_HEADER, requestId);
  headers.set(TRACE_ID_HEADER, trace.traceId);
  headers.set(SPAN_ID_HEADER, trace.spanId);
  headers.set('traceparent', `00-${trace.traceId}-${trace.spanId}-01`);
}
