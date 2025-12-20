import { LLMOpsError } from '@/error';
import type { Database } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createSession = z.object({
  userId: z.string().uuid(),
  token: z.string().min(1),
  expiresAt: z.date(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
});

const getSessionByToken = z.object({
  token: z.string().min(1),
});

const getSessionById = z.object({
  sessionId: z.string().uuid(),
});

const deleteSession = z.object({
  sessionId: z.string().uuid(),
});

const deleteSessionByToken = z.object({
  token: z.string().min(1),
});

const deleteUserSessions = z.object({
  userId: z.string().uuid(),
});

const listUserSessions = z.object({
  userId: z.string().uuid(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
});

export const createSessionDataLayer = (db: Kysely<Database>) => {
  return {
    createSession: async (params: z.infer<typeof createSession>) => {
      const value = await createSession.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId, token, expiresAt, userAgent, ipAddress } = value.data;

      return db
        .insertInto('sessions')
        .values({
          id: randomUUID(),
          userId,
          token,
          expiresAt: expiresAt.toISOString(),
          userAgent,
          ipAddress,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    getSessionByToken: async (params: z.infer<typeof getSessionByToken>) => {
      const value = await getSessionByToken.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { token } = value.data;

      return db
        .selectFrom('sessions')
        .selectAll()
        .where('token', '=', token)
        .executeTakeFirst();
    },

    getSessionById: async (params: z.infer<typeof getSessionById>) => {
      const value = await getSessionById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { sessionId } = value.data;

      return db
        .selectFrom('sessions')
        .selectAll()
        .where('id', '=', sessionId)
        .executeTakeFirst();
    },

    /**
     * Get session with user data (for auth middleware)
     */
    getSessionWithUser: async (params: z.infer<typeof getSessionByToken>) => {
      const value = await getSessionByToken.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { token } = value.data;

      return db
        .selectFrom('sessions')
        .innerJoin('users', 'users.id', 'sessions.userId')
        .select([
          'sessions.id as sessionId',
          'sessions.token',
          'sessions.expiresAt',
          'sessions.createdAt as sessionCreatedAt',
          'users.id as userId',
          'users.email',
          'users.name',
          'users.role',
          'users.isActive',
          'users.teamId',
        ])
        .where('sessions.token', '=', token)
        .executeTakeFirst();
    },

    deleteSession: async (params: z.infer<typeof deleteSession>) => {
      const value = await deleteSession.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { sessionId } = value.data;

      return db
        .deleteFrom('sessions')
        .where('id', '=', sessionId)
        .returningAll()
        .executeTakeFirst();
    },

    deleteSessionByToken: async (
      params: z.infer<typeof deleteSessionByToken>
    ) => {
      const value = await deleteSessionByToken.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { token } = value.data;

      return db
        .deleteFrom('sessions')
        .where('token', '=', token)
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Delete all sessions for a user (useful for logout all)
     */
    deleteUserSessions: async (params: z.infer<typeof deleteUserSessions>) => {
      const value = await deleteUserSessions.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId } = value.data;

      const result = await db
        .deleteFrom('sessions')
        .where('userId', '=', userId)
        .execute();

      return result.length;
    },

    listUserSessions: async (params: z.infer<typeof listUserSessions>) => {
      const value = await listUserSessions.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId, limit = 100, offset = 0 } = value.data;

      return db
        .selectFrom('sessions')
        .selectAll()
        .where('userId', '=', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset)
        .execute();
    },

    /**
     * Clean up expired sessions
     */
    deleteExpiredSessions: async () => {
      const now = new Date();
      const result = await db
        .deleteFrom('sessions')
        .where('expiresAt', '<', now)
        .execute();

      return result.length;
    },

    countUserSessions: async (userId: string) => {
      const result = await db
        .selectFrom('sessions')
        .select(db.fn.countAll().as('count'))
        .where('userId', '=', userId)
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },
  };
};
