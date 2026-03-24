import type { createLLMRequestsDataLayer } from '../datalayer/llmRequests';
import type { createTracesDataLayer } from '../datalayer/traces';

export type LLMRequestsStore = ReturnType<typeof createLLMRequestsDataLayer>;
export type TracesStore = ReturnType<typeof createTracesDataLayer>;

/**
 * TelemetryStore provides read + write access to telemetry data.
 * Implemented by pgStore (and future sqliteStore, etc.)
 */
export type TelemetryStore = LLMRequestsStore & TracesStore;
