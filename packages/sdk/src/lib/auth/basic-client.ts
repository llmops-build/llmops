/**
 * Basic Auth Client Implementation
 *
 * Provides a minimal implementation of AuthClient for basic auth.
 * Most methods throw AuthFeatureNotAvailableError since basic auth
 * doesn't support user management, RBAC, etc.
 *
 * For full functionality, use @llmops/enterprise.
 */

import type {
  AuthClient,
  User,
  Session,
  Permission,
  PaginationOptions,
  PaginatedResponse,
} from './client';
import { AuthFeatureNotAvailableError } from './client';
import type { BasicAuthConfig } from './index';

/**
 * Basic auth client - minimal implementation
 *
 * Basic auth is stateless HTTP authentication, so most user management
 * features are not available. This client provides stub implementations
 * that throw helpful errors pointing users to the enterprise version.
 */
export class BasicAuthClient implements AuthClient {
  readonly type = 'basic';

  private config: BasicAuthConfig;
  private authenticated: boolean = false;

  constructor(config: BasicAuthConfig) {
    this.config = config;
  }

  /**
   * Set authentication status (called after successful basic auth)
   */
  setAuthenticated(status: boolean): void {
    this.authenticated = status;
  }

  // ---- Session Management ----

  async getSession(): Promise<Session | null> {
    // Basic auth doesn't have sessions
    if (!this.authenticated) return null;

    // Return a pseudo-session for basic auth
    return {
      id: 'basic-auth-session',
      userId: 'basic-auth-user',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      createdAt: new Date(),
    };
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.authenticated) return null;

    // Return a pseudo-user for basic auth
    return {
      id: 'basic-auth-user',
      email: this.config.defaultUser,
      name: 'Admin',
      role: 'admin',
      emailVerified: true,
      image: null,
      banned: false,
      banReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async isAuthenticated(): Promise<boolean> {
    return this.authenticated;
  }

  // ---- User Management (Not Available) ----

  async getUser(_userId: string): Promise<User | null> {
    throw new AuthFeatureNotAvailableError('getUser', this.type);
  }

  async listUsers(
    _options?: PaginationOptions
  ): Promise<PaginatedResponse<User>> {
    throw new AuthFeatureNotAvailableError('listUsers', this.type);
  }

  async createUser(_data: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }): Promise<User> {
    throw new AuthFeatureNotAvailableError('createUser', this.type);
  }

  async updateUser(
    _userId: string,
    _data: Partial<Pick<User, 'name' | 'email' | 'role' | 'image'>>
  ): Promise<User> {
    throw new AuthFeatureNotAvailableError('updateUser', this.type);
  }

  async deleteUser(_userId: string): Promise<void> {
    throw new AuthFeatureNotAvailableError('deleteUser', this.type);
  }

  // ---- Role & Permissions ----

  async getRole(_userId?: string): Promise<string | null> {
    // Basic auth user is always admin
    if (this.authenticated) {
      return 'admin';
    }
    return null;
  }

  async setRole(_userId: string, _role: string): Promise<void> {
    throw new AuthFeatureNotAvailableError('setRole', this.type);
  }

  async hasPermission(
    _permission: { resource: string; action: string },
    _userId?: string
  ): Promise<boolean> {
    // Basic auth admin has all permissions
    return this.authenticated;
  }

  async getPermissions(_userId?: string): Promise<Permission[]> {
    // Basic auth admin has all permissions
    if (!this.authenticated) return [];

    // Return a wildcard permission set
    return [{ resource: '*', action: '*', allowed: true }];
  }

  // ---- Ban Management (Not Available) ----

  async banUser(
    _userId: string,
    _reason?: string,
    _expiresAt?: Date
  ): Promise<void> {
    throw new AuthFeatureNotAvailableError('banUser', this.type);
  }

  async unbanUser(_userId: string): Promise<void> {
    throw new AuthFeatureNotAvailableError('unbanUser', this.type);
  }

  // ---- Session Management (Not Available) ----

  async listUserSessions(_userId: string): Promise<Session[]> {
    throw new AuthFeatureNotAvailableError('listUserSessions', this.type);
  }

  async revokeSession(_sessionId: string): Promise<void> {
    throw new AuthFeatureNotAvailableError('revokeSession', this.type);
  }

  async revokeAllSessions(_userId: string): Promise<void> {
    throw new AuthFeatureNotAvailableError('revokeAllSessions', this.type);
  }
}

/**
 * Create a basic auth client
 */
export function createBasicAuthClient(
  config: BasicAuthConfig
): BasicAuthClient {
  return new BasicAuthClient(config);
}
