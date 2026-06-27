import type { TelemetryEvent } from './events';

/**
 * The WRITE half of telemetry.
 *
 * Everything that produces telemetry depends ONLY on this interface: the
 * gateway, the eval runner, `ops.observe()` / `ops.trace()`. None of them can
 * see a store, a database connection, or a query method — they hand off events
 * and move on.
 *
 * `emit` is fire-and-forget BY CONTRACT. Buffering, batching, retries, and
 * backpressure are the sink's responsibility, never the caller's. That promise
 * is exactly what lets the gateway stay a pure proxy on the hot path: it emits
 * and returns, adding no latency waiting on a database.
 *
 * Implementations are interchangeable: a store (persists, and is also a
 * Reader), an OTel sink (forwards OTLP), a Datadog sink (forwards), a fan-out
 * sink (tees to several), or a no-op (the default when telemetry is absent).
 */
export interface TelemetrySink {
  emit(events: TelemetryEvent[]): void;
  /**
   * Drain buffered events. Node batches on a timer; edge runtimes call this
   * inside `waitUntil` after the response is sent.
   */
  flush(): Promise<void>;
}
