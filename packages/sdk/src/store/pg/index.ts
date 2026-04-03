/**
 * pgStore — PostgreSQL-backed telemetry store.
 *
 * Uses generated types from tsqx (./generated/) and hand-written query functions.
 * The generated query functions in queries/gen/ have SQL stripping bugs in tsqx
 * and are not used yet — they'll replace the hand-written code once tsqx is fixed.
 */
export {
  createPgStore as pgStore,
  type PgStore,
} from '@llmops/core';

// Re-export generated types for consumers
export type { LlmRequests, Spans, Traces, SpanEvents } from './generated';
export {
  LlmRequestsSchema,
  SpansSchema,
  TracesSchema,
  SpanEventsSchema,
} from './generated';

// Re-export generated query param types
export type {
  GetTotalCostParams,
  GetCostByModelParams,
  GetCostByProviderParams,
  GetDailyCostsParams,
  GetRequestStatsParams,
  GetRequestByRequestIdParams,
} from './queries';

// Re-export generated param JSON Schemas
export {
  GetTotalCostParamsSchema,
  GetCostByModelParamsSchema,
  GetCostByProviderParamsSchema,
  GetDailyCostsParamsSchema,
  GetRequestStatsParamsSchema,
  GetRequestByRequestIdParamsSchema,
} from './queries';
