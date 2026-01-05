/**
 * Auth module for LLMOps SDK
 *
 * Provides extensible authentication with:
 * - AuthClient interface - Extensible for different auth providers
 */

// ============================================
// Auth Client (extensible interface)
// ============================================
export type {
  AuthClient,
  User,
  Session,
  Permission,
  PaginationOptions,
  PaginatedResponse,
} from './client';
export { AuthFeatureNotAvailableError } from './client';
