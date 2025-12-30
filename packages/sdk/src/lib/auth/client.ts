/**
 * Auth Client - Extensible authentication client for LLMOps
 *
 * Open source: BasicAuthClient with limited functionality
 * Enterprise: Can extend with full user management, RBAC, SSO, etc.
 */

// ============================================
// Types
// ============================================

/**
 * User representation
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string | null;
  emailVerified: boolean;
  image: string | null;
  banned: boolean | null;
  banReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Session representation
 */
export interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Permission check result
 */
export interface Permission {
  resource: string;
  action: string;
  allowed: boolean;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// Auth Client Interface
// ============================================

/**
 * Base auth client interface
 * All auth implementations must implement this interface
 */
export interface AuthClient {
  /**
   * The type of auth client
   */
  readonly type: string;

  // ---- Session Management ----

  /**
   * Get the current session
   * @returns Current session or null if not authenticated
   */
  getSession(): Promise<Session | null>;

  /**
   * Get the current authenticated user
   * @returns Current user or null if not authenticated
   */
  getCurrentUser(): Promise<User | null>;

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): Promise<boolean>;

  // ---- User Management ----

  /**
   * Get a user by ID
   * @param userId - The user ID
   */
  getUser(userId: string): Promise<User | null>;

  /**
   * List all users (paginated)
   * @param options - Pagination options
   */
  listUsers(options?: PaginationOptions): Promise<PaginatedResponse<User>>;

  /**
   * Create a new user
   * @param data - User data
   */
  createUser(data: {
    email: string;
    name: string;
    password: string;
    role?: string;
  }): Promise<User>;

  /**
   * Update a user
   * @param userId - The user ID
   * @param data - Fields to update
   */
  updateUser(
    userId: string,
    data: Partial<Pick<User, 'name' | 'email' | 'role' | 'image'>>
  ): Promise<User>;

  /**
   * Delete a user
   * @param userId - The user ID
   */
  deleteUser(userId: string): Promise<void>;

  // ---- Role & Permissions ----

  /**
   * Get user's role
   * @param userId - The user ID (optional, defaults to current user)
   */
  getRole(userId?: string): Promise<string | null>;

  /**
   * Set user's role
   * @param userId - The user ID
   * @param role - The role to set
   */
  setRole(userId: string, role: string): Promise<void>;

  /**
   * Check if user has permission
   * @param permission - Permission to check (e.g., { resource: 'configs', action: 'create' })
   * @param userId - The user ID (optional, defaults to current user)
   */
  hasPermission(
    permission: { resource: string; action: string },
    userId?: string
  ): Promise<boolean>;

  /**
   * Get all permissions for a user
   * @param userId - The user ID (optional, defaults to current user)
   */
  getPermissions(userId?: string): Promise<Permission[]>;

  // ---- Ban Management ----

  /**
   * Ban a user
   * @param userId - The user ID
   * @param reason - Optional ban reason
   * @param expiresAt - Optional expiration date
   */
  banUser(userId: string, reason?: string, expiresAt?: Date): Promise<void>;

  /**
   * Unban a user
   * @param userId - The user ID
   */
  unbanUser(userId: string): Promise<void>;

  // ---- Session Management (Admin) ----

  /**
   * List all sessions for a user
   * @param userId - The user ID
   */
  listUserSessions(userId: string): Promise<Session[]>;

  /**
   * Revoke a specific session
   * @param sessionId - The session ID
   */
  revokeSession(sessionId: string): Promise<void>;

  /**
   * Revoke all sessions for a user
   * @param userId - The user ID
   */
  revokeAllSessions(userId: string): Promise<void>;
}

/**
 * Error thrown when a feature is not available in the current auth implementation
 */
export class AuthFeatureNotAvailableError extends Error {
  constructor(feature: string, authType: string) {
    super(
      `The "${feature}" feature is not available with "${authType}" auth. ` +
        `Upgrade to @llmops/enterprise for full auth functionality.`
    );
    this.name = 'AuthFeatureNotAvailableError';
  }
}
