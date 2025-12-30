/**
 * Auth module for LLMOps SDK
 *
 * Provides extensible authentication with:
 * - basicAuth() - Simple username/password for open source
 * - AuthClient interface - Extensible for enterprise features
 *
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

// ============================================
// Basic Auth (open source)
// ============================================
export { BasicAuthClient, createBasicAuthClient } from './basic-client';

// ============================================
// Config Types (re-exported from core for type compatibility)
// ============================================
import type {
  AuthConfig as CoreAuthConfig,
  BasicAuthConfig as CoreBasicAuthConfig,
} from '@llmops/core';

export type AuthConfig = CoreAuthConfig;
export type BasicAuthConfig = CoreBasicAuthConfig;

/**
 * Options for basic authentication
 */
export interface BasicAuthOptions {
  /**
   * Default username for basic auth
   * @example "admin@example.com"
   */
  username: string;
  /**
   * Default password for basic auth
   * Should be changed in production!
   */
  password: string;
}

/**
 * Create a basic auth configuration
 *
 * @example
 * ```typescript
 * import { llmops, basicAuth } from '@llmops/sdk';
 *
 * const client = llmops({
 *   database: pool,
 *   basePath: '/llmops',
 *   providers: { openai: { apiKey: '...' } },
 *   auth: basicAuth({
 *     username: 'admin@example.com',
 *     password: 'secure-password',
 *   }),
 * });
 * ```
 */
export function basicAuth(options: BasicAuthOptions): BasicAuthConfig {
  if (!options.username || options.username.length === 0) {
    throw new Error('basicAuth: username is required');
  }
  if (!options.password || options.password.length === 0) {
    throw new Error('basicAuth: password is required');
  }

  return Object.freeze({
    type: 'basic' as const,
    defaultUser: options.username,
    defaultPassword: options.password,
  });
}
