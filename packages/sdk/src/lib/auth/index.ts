/**
 * Auth module for LLMOps SDK
 *
 * Provides extensible authentication with:
 * - basicAuth() - Simple username/password for open source
 * - AuthClient interface - Extensible for enterprise features
 *
 * Enterprise users can extend with @llmops/enterprise for:
 * - Full user management (CRUD)
 * - Role-based access control (RBAC)
 * - SSO (SAML, OIDC)
 * - Session management
 * - User banning
 *
 * ## Enterprise Integration
 *
 * Enterprise auth works by:
 * 1. Setting a custom auth type in config (e.g., `type: 'better-auth'`)
 * 2. Adding enterprise middleware BEFORE the LLMOps routes
 * 3. Enterprise middleware sets `c.set('authHandled', true)` after successful auth
 * 4. The open source auth middleware skips basic auth when `authHandled` is true
 *
 * @example Enterprise middleware pattern
 * ```typescript
 * // In @llmops/enterprise
 * export const enterpriseAuthMiddleware = (): MiddlewareHandler => {
 *   return async (c, next) => {
 *     const config = c.get('llmopsConfig');
 *     if (config.auth.type === 'better-auth') {
 *       // ... perform Better Auth authentication ...
 *       c.set('authHandled', true);
 *     }
 *     await next();
 *   };
 * };
 * ```
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
