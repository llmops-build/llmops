import type { APIType } from '@server/types/api';
import { hc as _hc } from 'hono/client';
import ky from 'ky';
import { getAPIBaseEndpoint } from './api-base';

const instance = ky.create({
  retry: 0,
  timeout: 150 * 1000, // 2.5 minutes timeout for API requests (AI operations can take time)
});

const url = new URL(getAPIBaseEndpoint(), window.location.origin);

export const hc = _hc<APIType>(url.origin + url.pathname, {
  fetch: instance,
});
