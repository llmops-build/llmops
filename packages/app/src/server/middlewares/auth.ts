import type { MiddlewareHandler } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import type {
  UserRoleType,
  AuthContext as ConfigAuthContext,
} from '@llmops/core';
import { generateId } from '@llmops/core';
import { createHash } from 'node:crypto';

// Cookie name for session
export const SESSION_COOKIE_NAME = 'llmops_session';

// Session token generation
export const generateSessionToken = (): string => {
  return generateId(64);
};

// Hash session token for storage (we store hashed tokens in DB)
export const hashSessionToken = (token: string): string => {
  return createHash('sha256').update(token).digest('hex');
};

// Password hashing using built-in crypto
export const hashPassword = async (password: string): Promise<string> => {
  const { pbkdf2, randomBytes } = await import('node:crypto');
  const { promisify } = await import('node:util');
  const pbkdf2Async = promisify(pbkdf2);

  const salt = randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2Async(password, salt, 100000, 64, 'sha512');
  return `${salt}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (
  password: string,
  storedHash: string
): Promise<boolean> => {
  const { pbkdf2 } = await import('node:crypto');
  const { promisify } = await import('node:util');
  const pbkdf2Async = promisify(pbkdf2);

  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;

  const derivedKey = await pbkdf2Async(password, salt, 100000, 64, 'sha512');
  return derivedKey.toString('hex') === hash;
};

/**
 * User context type for authenticated requests
 */
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRoleType;
  teamId?: string;
  isActive: boolean;
}

/**
 * Session context type
 */
export interface AuthSession {
  id: string;
  token: string;
  expiresAt: Date;
}

/**
 * Auth context added to Hono context
 */
export interface AuthContext {
  user: AuthUser;
  session: AuthSession;
}

/**
 * Helper to authenticate using basic auth (session cookies + DB)
 */
async function authenticateBasicAuth(
  c: Parameters<MiddlewareHandler>[0]
): Promise<AuthContext | null> {
  const db = c.get('db');
  const sessionToken = getCookie(c, SESSION_COOKIE_NAME);

  if (!sessionToken) {
    return null;
  }

  const hashedToken = hashSessionToken(sessionToken);
  const sessionWithUser = await db.getSessionWithUser({ token: hashedToken });

  if (!sessionWithUser) {
    deleteCookie(c, SESSION_COOKIE_NAME);
    return null;
  }

  // Check if session is expired
  const expiresAt = new Date(sessionWithUser.expiresAt);
  if (expiresAt < new Date()) {
    await db.deleteSessionByToken({ token: hashedToken });
    deleteCookie(c, SESSION_COOKIE_NAME);
    return null;
  }

  // Check if user is active
  if (!sessionWithUser.isActive) {
    deleteCookie(c, SESSION_COOKIE_NAME);
    return null;
  }

  return {
    user: {
      id: sessionWithUser.userId,
      email: sessionWithUser.email,
      name: sessionWithUser.name ?? undefined,
      role: sessionWithUser.role,
      teamId: sessionWithUser.teamId ?? undefined,
      isActive: sessionWithUser.isActive,
    },
    session: {
      id: sessionWithUser.sessionId,
      token: hashedToken,
      expiresAt,
    },
  };
}

/**
 * Convert ConfigAuthContext to internal AuthContext
 */
function convertAuthContext(ctx: ConfigAuthContext): AuthContext {
  return {
    user: {
      id: ctx.user.id,
      email: ctx.user.email,
      name: ctx.user.name,
      role: ctx.user.role as UserRoleType,
      teamId: ctx.user.teamId,
      isActive: ctx.user.isActive,
    },
    session: {
      id: ctx.session.id,
      token: '', // Custom auth doesn't use tokens in the same way
      expiresAt: ctx.session.expiresAt,
    },
  };
}

/**
 * Creates an auth middleware that validates authentication based on config.
 *
 * Supports three modes:
 * - 'basic': Uses built-in session cookies and user/session tables
 * - 'custom': Uses user-provided authenticate function
 * - 'none': Skips authentication (for development only)
 * - undefined: No auth configured, skips authentication
 *
 * Use this for protected routes that require authentication.
 */
export const createAuthMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const config = c.get('llmopsConfig');
    const authConfig = config.auth;

    // No auth configured - skip authentication
    if (!authConfig) {
      await next();
      return;
    }

    // Auth type: none - skip authentication
    if (authConfig.type === 'none') {
      await next();
      return;
    }

    let authContext: AuthContext | null = null;

    // Auth type: basic - use built-in session auth
    if (authConfig.type === 'basic') {
      authContext = await authenticateBasicAuth(c);
    }

    // Auth type: custom - use user-provided authenticate function
    if (authConfig.type === 'custom') {
      try {
        const result = await authConfig.authenticate(c.req.raw);
        if (result) {
          authContext = convertAuthContext(result);
        }
      } catch (error) {
        console.error('Custom auth error:', error);
        return c.json(
          { error: 'Unauthorized', message: 'Authentication failed' },
          401
        );
      }
    }

    if (!authContext) {
      return c.json(
        { error: 'Unauthorized', message: 'No valid session found' },
        401
      );
    }

    c.set('auth', authContext);
    await next();
  };
};

/**
 * Creates an optional auth middleware that sets user context if authenticated
 * but doesn't block unauthenticated requests.
 *
 * Use this for routes that work for both authenticated and anonymous users.
 */
export const createOptionalAuthMiddleware = (): MiddlewareHandler => {
  return async (c, next) => {
    const config = c.get('llmopsConfig');
    const authConfig = config.auth;

    // No auth configured - skip
    if (!authConfig || authConfig.type === 'none') {
      await next();
      return;
    }

    let authContext: AuthContext | null = null;

    if (authConfig.type === 'basic') {
      authContext = await authenticateBasicAuth(c);
    }

    if (authConfig.type === 'custom') {
      try {
        const result = await authConfig.authenticate(c.req.raw);
        if (result) {
          authContext = convertAuthContext(result);
        }
      } catch {
        // Ignore errors for optional auth
      }
    }

    if (authContext) {
      c.set('auth', authContext);
    }

    await next();
  };
};

/**
 * Creates a role-based access control middleware.
 *
 * @param allowedRoles - Array of roles that are allowed to access the route
 */
export const createRBACMiddleware = (
  allowedRoles: UserRoleType[]
): MiddlewareHandler => {
  return async (c, next) => {
    const auth = c.get('auth') as AuthContext | undefined;

    if (!auth) {
      return c.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        401
      );
    }

    if (!allowedRoles.includes(auth.user.role)) {
      return c.json(
        { error: 'Forbidden', message: 'Insufficient permissions' },
        403
      );
    }

    await next();
  };
};

/**
 * Helper to set session cookie
 */
export const setSessionCookie = (
  c: Parameters<MiddlewareHandler>[0],
  token: string,
  expiresAt: Date
) => {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    expires: expiresAt,
  });
};

/**
 * Helper to clear session cookie
 */
export const clearSessionCookie = (c: Parameters<MiddlewareHandler>[0]) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
};

/**
 * Check if auth is enabled in the config
 */
export const isAuthEnabled = (
  authConfig: { type: string } | undefined
): boolean => {
  return authConfig != null && authConfig.type !== 'none';
};

/**
 * Check if basic auth is configured
 */
export const isBasicAuth = (
  authConfig: { type: string } | undefined
): authConfig is {
  type: 'basic';
  defaultEmail: string;
  defaultPassword: string;
  sessionExpiryHours: number;
} => {
  return authConfig?.type === 'basic';
};
