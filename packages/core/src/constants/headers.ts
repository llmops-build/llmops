/**
 * Custom HTTP headers used for trace context propagation
 * between SDK clients and the LLMOps gateway.
 */

export const LLMOPS_TRACE_ID_HEADER = 'x-llmops-trace-id';
export const LLMOPS_TRACE_NAME_HEADER = 'x-llmops-trace-name';
export const LLMOPS_SPAN_NAME_HEADER = 'x-llmops-span-name';
export const LLMOPS_SESSION_ID_HEADER = 'x-llmops-session-id';
export const LLMOPS_USER_ID_HEADER = 'x-llmops-user-id';
export const LLMOPS_SPAN_ID_HEADER = 'x-llmops-span-id';
export const LLMOPS_REQUEST_ID_HEADER = 'x-llmops-request-id';
export const LLMOPS_INTERNAL_HEADER = 'x-llmops-internal';
