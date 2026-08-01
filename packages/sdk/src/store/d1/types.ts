/**
 * Minimal D1Database type interface.
 * Avoids depending on @cloudflare/workers-types (10MB+).
 * Users pass their actual D1 binding which satisfies this structurally.
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  all<T = unknown>(): Promise<D1Result<T>>;
  run(): Promise<D1Result>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: {
    changes: number;
    duration: number;
    last_row_id: number;
  };
}
