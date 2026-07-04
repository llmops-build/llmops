import { RequestType } from './types/requests';

// Longest paths first so `/chat/completions` matches before `/completions`.
const REQUEST_TYPES = Object.values(RequestType).sort(
  (a, b) => b.length - a.length,
);

/**
 * Match a request path to a RequestType. Tolerates any leading prefix (e.g.
 * `/v1`, `/api/genai/v1`), so the plug works standalone or mounted.
 */
export function matchRoute(pathname: string): RequestType | null {
  return REQUEST_TYPES.find((rt) => pathname.endsWith(rt)) ?? null;
}
