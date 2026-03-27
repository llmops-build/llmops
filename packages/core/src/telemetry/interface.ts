import type { PgStore } from './postgres';

/**
 * TelemetryStore provides read + write access to telemetry data.
 * Implemented by pgStore (and future sqliteStore, etc.)
 */
export type TelemetryStore = Omit<PgStore, '_db'>;
