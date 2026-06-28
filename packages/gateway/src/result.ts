/**
 * A tiny, zero-dependency `Result` type.
 *
 * Handlers return a `Result` instead of throwing; it is collapsed to a
 * `Response` exactly once, at the gateway boundary. This keeps error handling
 * explicit and typed without pulling in a library.
 */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const isOk = <T, E>(
  r: Result<T, E>,
): r is { ok: true; value: T } => r.ok;
export const isErr = <T, E>(
  r: Result<T, E>,
): r is { ok: false; error: E } => !r.ok;
