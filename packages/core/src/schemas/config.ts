import { z } from 'zod';
import { SupportedProviders } from '../providers';

const openRouterProviderSchema = z.object({
  apiKey: z
    .string()
    .min(1, 'OpenRouter API key is required and cannot be empty'),
});

const providersSchema = z.object({
  [SupportedProviders.OPENROUTER]: openRouterProviderSchema.optional(),
});

/**
 * Auth user object returned by the auth hook
 */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  role: z.enum(['admin', 'member', 'viewer']).default('admin'),
  teamId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type AuthUser = z.infer<typeof authUserSchema>;

/**
 * Auth session object returned by the auth hook
 */
export const authSessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
});

export type AuthSession = z.infer<typeof authSessionSchema>;

/**
 * Auth context returned by authenticate hook
 */
export const authContextSchema = z.object({
  user: authUserSchema,
  session: authSessionSchema,
});

export type AuthContext = z.infer<typeof authContextSchema>;

/**
 * Basic auth configuration - uses built-in user/session tables
 */
const basicAuthSchema = z.object({
  type: z.literal('basic'),
  /** Default admin email (required) */
  defaultEmail: z.string().email(),
  /** Default admin password (required - we don't auto-generate for security) */
  defaultPassword: z.string().min(8, 'Password must be at least 8 characters'),
  /** Session expiry in hours (default: 168 = 7 days) */
  sessionExpiryHours: z.number().int().positive().optional().default(168),
});

export type BasicAuthConfig = z.infer<typeof basicAuthSchema>;

/**
 * Custom auth configuration - user provides their own authenticate function
 */
const customAuthSchema = z.object({
  type: z.literal('custom'),
  /**
   * Authenticate function called on every request
   * Should return AuthContext if authenticated, null otherwise
   */
  authenticate: z.custom<(request: Request) => Promise<AuthContext | null>>(
    (val) => typeof val === 'function'
  ),
});

export type CustomAuthConfig = z.infer<typeof customAuthSchema>;

/**
 * No auth - disables authentication entirely (use for development only)
 */
const noAuthSchema = z.object({
  type: z.literal('none'),
});

export type NoAuthConfig = z.infer<typeof noAuthSchema>;

/**
 * Auth configuration - supports basic, custom, or no auth
 */
const authSchema = z.discriminatedUnion('type', [
  basicAuthSchema,
  customAuthSchema,
  noAuthSchema,
]);

export type AuthConfig = z.infer<typeof authSchema>;

export const llmopsConfigSchema = z.object({
  database: z.any(),
  basePath: z
    .string()
    .min(1, 'Base path is required and cannot be empty')
    .refine(
      (path) => path.startsWith('/'),
      'Base path must start with a forward slash'
    ),
  providers: providersSchema.refine((providers) => {
    const hasAtLeastOneProvider = Object.values(providers).some(
      (provider) => provider !== undefined
    );
    return hasAtLeastOneProvider;
  }, 'At least one provider must be configured'),
  /**
   * Authentication configuration
   * - 'basic': Built-in email/password auth with session management
   * - 'custom': Provide your own authenticate function
   * - 'none': Disable auth (development only)
   */
  auth: authSchema.optional(),
});

export type ValidatedLLMOpsConfig = z.infer<typeof llmopsConfigSchema>;

export function validateLLMOpsConfig(config: unknown): ValidatedLLMOpsConfig {
  const result = llmopsConfigSchema.safeParse(config);

  if (!result.success) {
    const errorMessages = result.error.issues
      .map((err: z.ZodIssue) => `${err.path.join('.')}: ${err.message}`)
      .join('\n');

    throw new Error(
      `LLMOps configuration validation failed:\n${errorMessages}`
    );
  }

  return result.data;
}
