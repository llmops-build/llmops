import type { TelemetryReader } from './reader';
import type { TelemetrySink } from './sink';

/**
 * A telemetry STORE is simply both halves: it accepts events (Sink) and answers
 * queries (Reader). `pgStore` / `sqliteStore` / `d1Store` implement this.
 *
 * The whole decoupling thesis in one type: the gateway is handed a
 * `TelemetrySink`, the dashboard is handed a `TelemetryReader`, and a store
 * happens to satisfy both — yet neither side can reach across the seam. Swap the
 * store for an OTel-collector sink and the gateway is unaffected; remove the
 * gateway and the reader still powers the dashboard.
 */
export interface TelemetryStore extends TelemetrySink, TelemetryReader {}
