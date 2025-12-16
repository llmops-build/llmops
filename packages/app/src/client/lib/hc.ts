import type { APIType } from '@server/types/api';
import { hc as _hc } from 'hono/client';
import ky from 'ky';

const instance = ky.create({
  retry: 0,
  timeout: 150 * 1000, // 2.5 minutes timeout for API requests (AI operations can take time)
});

const url = new URL(
  (window.bootstrapData?.basePath === '/'
    ? ''
    : window.bootstrapData?.basePath) + '/api',
  window.location.origin
);

export const hc = _hc<APIType>(url.origin + url.pathname, {
  fetch: instance,
});
