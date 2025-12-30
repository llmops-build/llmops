import { describe, expect, it, beforeEach } from 'vitest';
import {
  basicAuth,
  BasicAuthClient,
  createBasicAuthClient,
  AuthFeatureNotAvailableError,
} from '../src/lib/auth';

describe('basicAuth', () => {
  it('should create a basic auth config with valid credentials', () => {
    const config = basicAuth({
      username: 'admin@example.com',
      password: 'secure-password',
    });

    expect(config.type).toBe('basic');
    expect(config.defaultUser).toBe('admin@example.com');
    expect(config.defaultPassword).toBe('secure-password');
  });

  it('should throw if username is empty', () => {
    expect(() =>
      basicAuth({
        username: '',
        password: 'password',
      })
    ).toThrow('basicAuth: username is required');
  });

  it('should throw if password is empty', () => {
    expect(() =>
      basicAuth({
        username: 'admin@example.com',
        password: '',
      })
    ).toThrow('basicAuth: password is required');
  });

  it('should return a frozen config object', () => {
    const config = basicAuth({
      username: 'admin@example.com',
      password: 'password',
    });

    expect(Object.isFrozen(config)).toBe(true);
  });
});

describe('BasicAuthClient', () => {
  let client: BasicAuthClient;
  const config = basicAuth({
    username: 'admin@example.com',
    password: 'password',
  });

  beforeEach(() => {
    client = new BasicAuthClient(config);
  });

  describe('when not authenticated', () => {
    it('should return false for isAuthenticated', async () => {
      expect(await client.isAuthenticated()).toBe(false);
    });

    it('should return null for getSession', async () => {
      expect(await client.getSession()).toBeNull();
    });

    it('should return null for getCurrentUser', async () => {
      expect(await client.getCurrentUser()).toBeNull();
    });

    it('should return null for getRole', async () => {
      expect(await client.getRole()).toBeNull();
    });

    it('should return false for hasPermission', async () => {
      expect(
        await client.hasPermission({ resource: 'configs', action: 'create' })
      ).toBe(false);
    });

    it('should return empty array for getPermissions', async () => {
      expect(await client.getPermissions()).toEqual([]);
    });
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      client.setAuthenticated(true);
    });

    it('should return true for isAuthenticated', async () => {
      expect(await client.isAuthenticated()).toBe(true);
    });

    it('should return a pseudo-session for getSession', async () => {
      const session = await client.getSession();
      expect(session).not.toBeNull();
      expect(session?.id).toBe('basic-auth-session');
      expect(session?.userId).toBe('basic-auth-user');
      expect(session?.expiresAt).toBeInstanceOf(Date);
      expect(session?.createdAt).toBeInstanceOf(Date);
    });

    it('should return a pseudo-user for getCurrentUser', async () => {
      const user = await client.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.id).toBe('basic-auth-user');
      expect(user?.email).toBe('admin@example.com');
      expect(user?.name).toBe('Admin');
      expect(user?.role).toBe('admin');
      expect(user?.emailVerified).toBe(true);
      expect(user?.banned).toBe(false);
    });

    it('should return admin for getRole', async () => {
      expect(await client.getRole()).toBe('admin');
    });

    it('should return true for hasPermission (admin has all permissions)', async () => {
      expect(
        await client.hasPermission({ resource: 'configs', action: 'create' })
      ).toBe(true);
      expect(
        await client.hasPermission({ resource: 'users', action: 'delete' })
      ).toBe(true);
      expect(await client.hasPermission({ resource: '*', action: '*' })).toBe(
        true
      );
    });

    it('should return wildcard permissions for getPermissions', async () => {
      const permissions = await client.getPermissions();
      expect(permissions).toEqual([
        { resource: '*', action: '*', allowed: true },
      ]);
    });
  });

  describe('enterprise-only features', () => {
    it('should throw AuthFeatureNotAvailableError for getUser', async () => {
      await expect(client.getUser('user-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
      await expect(client.getUser('user-id')).rejects.toThrow(
        'The "getUser" feature is not available with "basic" auth'
      );
    });

    it('should throw AuthFeatureNotAvailableError for listUsers', async () => {
      await expect(client.listUsers()).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for createUser', async () => {
      await expect(
        client.createUser({
          email: 'test@example.com',
          name: 'Test',
          password: 'password',
        })
      ).rejects.toThrow(AuthFeatureNotAvailableError);
    });

    it('should throw AuthFeatureNotAvailableError for updateUser', async () => {
      await expect(
        client.updateUser('user-id', { name: 'New Name' })
      ).rejects.toThrow(AuthFeatureNotAvailableError);
    });

    it('should throw AuthFeatureNotAvailableError for deleteUser', async () => {
      await expect(client.deleteUser('user-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for setRole', async () => {
      await expect(client.setRole('user-id', 'admin')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for banUser', async () => {
      await expect(client.banUser('user-id', 'reason')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for unbanUser', async () => {
      await expect(client.unbanUser('user-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for listUserSessions', async () => {
      await expect(client.listUserSessions('user-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for revokeSession', async () => {
      await expect(client.revokeSession('session-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });

    it('should throw AuthFeatureNotAvailableError for revokeAllSessions', async () => {
      await expect(client.revokeAllSessions('user-id')).rejects.toThrow(
        AuthFeatureNotAvailableError
      );
    });
  });
});

describe('createBasicAuthClient', () => {
  it('should create a BasicAuthClient instance', () => {
    const config = basicAuth({
      username: 'admin@example.com',
      password: 'password',
    });
    const client = createBasicAuthClient(config);

    expect(client).toBeInstanceOf(BasicAuthClient);
    expect(client.type).toBe('basic');
  });
});

describe('AuthFeatureNotAvailableError', () => {
  it('should have correct name and message', () => {
    const error = new AuthFeatureNotAvailableError('listUsers', 'basic');

    expect(error.name).toBe('AuthFeatureNotAvailableError');
    expect(error.message).toBe(
      'The "listUsers" feature is not available with "basic" auth. ' +
        'Upgrade to @llmops/enterprise for full auth functionality.'
    );
  });
});
