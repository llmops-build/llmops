import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  basePath:
    window.bootstrapData?.basePath === '/'
      ? '/api/auth'
      : window.bootstrapData?.basePath + '/api/auth',
});
