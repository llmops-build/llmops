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
    error: 'LLMOps Config ID was not provided.'
  }), // This is required always
  'x-llmops-environment': z.string().optional()
});

// Export the request validation middleware
export const requestValidator = zv('header', requestHeadersSchema);
