import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL:
    window.location.origin +
    (window.bootstrapData?.basePath === '/'
      ? ''
      : window.bootstrapData?.basePath),
});
