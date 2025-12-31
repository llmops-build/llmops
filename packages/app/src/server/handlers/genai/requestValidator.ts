import { z } from 'zod';
import { zv } from '@server/lib/zv';

// Content types constants
const CONTENT_TYPES = {
  APPLICATION_JSON: 'application/json',
  MULTIPART_FORM_DATA: 'multipart/form-data',
  GENERIC_AUDIO_PATTERN: 'audio/',
} as const;

// Request headers validation schema
export const requestHeadersSchema = z.object({
  'content-type': z.string().refine(
    (contentType) => {
      if (!contentType) return true; // Allow missing content-type

      const baseContentType = contentType.split(';')[0];

      return (
        baseContentType === CONTENT_TYPES.APPLICATION_JSON ||
        baseContentType === CONTENT_TYPES.MULTIPART_FORM_DATA ||
        baseContentType.startsWith(CONTENT_TYPES.GENERIC_AUDIO_PATTERN)
      );
    },
    {
      message:
        'Invalid content type. Must be application/json, multipart/form-data, or audio/*',
    }
  ),
  'x-llmops-config': z.string({
    error: 'LLMOps Config ID was not provided.',
  }), // This is required always
  authorization: z.string({
    error: 'Authorization header with environment secret is required.',
  }),
});

/**
 * Extracts environment secret from Authorization header.
 * The user passes it in the OpenAI apiKey option which comes as "Bearer <envSecret>"
 * @param authHeader - The Authorization header value (e.g., "Bearer sk_xxxxx")
 * @returns The environment secret
 * @throws Error if the header is missing or invalid
 */
export function extractEnvSecretFromAuth(authHeader: string): string {
  // Extract token from "Bearer <token>" format
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error(
      'Invalid Authorization header format. Expected: Bearer <environment-secret>'
    );
  }

  const token = match[1].trim();
  if (!token) {
    throw new Error('Environment secret cannot be empty');
  }

  return token;
}

// Export the request validation middleware
export const requestValidator = zv('header', requestHeadersSchema);
