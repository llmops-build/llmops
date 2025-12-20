import { LLMOpsError } from '@/error';
import type { Database, UserRoleType } from '@/schemas';
import type { Kysely } from 'kysely';
import { randomUUID } from 'node:crypto';
import z from 'zod';

const createNewUser = z.object({
  email: z.string().email(),
  passwordHash: z.string().min(1),
  name: z.string().optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional().default('admin'),
});

const updateUser = z.object({
  userId: z.uuidv4(),
  email: z.string().email().optional(),
  name: z.string().optional(),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  isActive: z.boolean().optional(),
  lastLoginAt: z.date().optional(),
});

const getUserById = z.object({
  userId: z.uuidv4(),
});

const getUserByEmail = z.object({
  email: z.string().email(),
});

const deleteUser = z.object({
  userId: z.uuidv4(),
});

const listUsers = z.object({
  limit: z.number().int().positive().optional(),
  offset: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const createUserDataLayer = (db: Kysely<Database>) => {
  return {
    createNewUser: async (params: z.infer<typeof createNewUser>) => {
      const value = await createNewUser.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { email, passwordHash, name, role } = value.data;

      return db
        .insertInto('users')
        .values({
          id: randomUUID(),
          email,
          passwordHash,
          name,
          role: role as UserRoleType,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .returningAll()
        .executeTakeFirst();
    },

    updateUser: async (params: z.infer<typeof updateUser>) => {
      const value = await updateUser.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId, email, name, role, isActive, lastLoginAt } = value.data;

      const updateData: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (email !== undefined) updateData.email = email;
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (lastLoginAt !== undefined)
        updateData.lastLoginAt = lastLoginAt.toISOString();

      return db
        .updateTable('users')
        .set(updateData)
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();
    },

    getUserById: async (params: z.infer<typeof getUserById>) => {
      const value = await getUserById.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId } = value.data;

      return db
        .selectFrom('users')
        .selectAll()
        .where('id', '=', userId)
        .executeTakeFirst();
    },

    getUserByEmail: async (params: z.infer<typeof getUserByEmail>) => {
      const value = await getUserByEmail.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { email } = value.data;

      return db
        .selectFrom('users')
        .selectAll()
        .where('email', '=', email)
        .executeTakeFirst();
    },

    deleteUser: async (params: z.infer<typeof deleteUser>) => {
      const value = await deleteUser.safeParseAsync(params);
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { userId } = value.data;

      return db
        .deleteFrom('users')
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();
    },

    listUsers: async (params?: z.infer<typeof listUsers>) => {
      const value = await listUsers.safeParseAsync(params || {});
      if (!value.success) {
        throw new LLMOpsError(`Invalid parameters: ${value.error.message}`);
      }
      const { limit = 100, offset = 0, isActive } = value.data;

      let query = db
        .selectFrom('users')
        .selectAll()
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      if (isActive !== undefined) {
        query = query.where('isActive', '=', isActive);
      }

      return query.execute();
    },

    countUsers: async () => {
      const result = await db
        .selectFrom('users')
        .select(db.fn.countAll().as('count'))
        .executeTakeFirst();
      return Number(result?.count ?? 0);
    },

    /**
     * Update the last login timestamp for a user
     */
    updateLastLogin: async (userId: string) => {
      const value = await getUserById.safeParseAsync({ userId });
      if (!value.success) {
        throw new LLMOpsError(`Invalid userId: ${value.error.message}`);
      }

      return db
        .updateTable('users')
        .set({
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();
    },

    /**
     * Update user password
     */
    updateUserPassword: async (userId: string, passwordHash: string) => {
      const value = await getUserById.safeParseAsync({ userId });
      if (!value.success) {
        throw new LLMOpsError(`Invalid userId: ${value.error.message}`);
      }

      return db
        .updateTable('users')
        .set({
          passwordHash,
          updatedAt: new Date().toISOString(),
        })
        .where('id', '=', userId)
        .returningAll()
        .executeTakeFirst();
    },
  };
};
