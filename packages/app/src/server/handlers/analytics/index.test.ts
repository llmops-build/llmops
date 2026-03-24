import { describe, test, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import analyticsApp from './index';

/**
 * Mock db that captures calls to getCostSummary
 */
function createMockDb(overrides: Record<string, unknown> = {}) {
  return {
    getTotalCost: vi.fn().mockResolvedValue(undefined),
    getCostSummary: vi.fn().mockResolvedValue([]),
    getRequestStats: vi.fn().mockResolvedValue(undefined),
    listRequests: vi.fn().mockResolvedValue([]),
    getRequestByRequestId: vi.fn().mockResolvedValue(undefined),
    getCostByModel: vi.fn().mockResolvedValue([]),
    getCostByProvider: vi.fn().mockResolvedValue([]),
    getDailyCosts: vi.fn().mockResolvedValue([]),
    getDistinctTags: vi.fn().mockResolvedValue([]),
    batchInsertRequests: vi.fn().mockResolvedValue(undefined),
    insertRequest: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

/**
 * Creates a test Hono app that mounts the analytics handler
 * with a mock db injected via middleware
 */
function createTestApp(mockDb: ReturnType<typeof createMockDb>) {
  const app = new Hono();
  app.use('*', async (c, next) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    c.set('telemetryStore' as any, mockDb as any);
    await next();
  });
  app.route('/analytics', analyticsApp);
  return app;
}

const VALID_DATE_RANGE = 'startDate=2026-01-01&endDate=2026-01-31';

describe('GET /analytics/costs/summary - tagKeys parameter', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDb = createMockDb();
    app = createTestApp(mockDb);
  });

  test('passes parsed tagKeys array to getCostSummary when valid JSON provided', async () => {
    const tagKeys = JSON.stringify(['orgId', 'teamName']);
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}`
    );

    expect(res.status).toBe(200);
    expect(mockDb.getCostSummary).toHaveBeenCalledOnce();

    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toEqual(['orgId', 'teamName']);
    expect(args.groupBy).toBe('tags');
  });

  test('passes single tagKey correctly', async () => {
    const tagKeys = JSON.stringify(['orgId']);
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toEqual(['orgId']);
  });

  test('handles tagKeys with special characters (commas, spaces)', async () => {
    const tagKeys = JSON.stringify(['org,Id', 'team name', 'key:with:colons']);
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toEqual([
      'org,Id',
      'team name',
      'key:with:colons',
    ]);
  });

  test('does not pass tagKeys when parameter is omitted', async () => {
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=model`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toBeUndefined();
  });

  test('ignores invalid JSON for tagKeys', async () => {
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=not-valid-json`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toBeUndefined();
  });

  test('filters out empty strings from tagKeys array', async () => {
    const tagKeys = JSON.stringify(['orgId', '', 'teamName', '']);
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toEqual(['orgId', 'teamName']);
  });

  test('ignores tagKeys when value is not an array', async () => {
    const tagKeys = JSON.stringify({ key: 'value' });
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}`
    );

    expect(res.status).toBe(200);
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toBeUndefined();
  });

  test('passes all filter params alongside tagKeys', async () => {
    const tagKeys = JSON.stringify(['orgId']);
    const configId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const tagsFilter = encodeURIComponent(JSON.stringify({ env: ['prod'] }));
    const url = `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=tags&tagKeys=${encodeURIComponent(tagKeys)}&configId=${configId}&tags=${tagsFilter}`;
    const res = await app.request(url);

    expect(res.status).toBe(200);
    expect(mockDb.getCostSummary).toHaveBeenCalledOnce();
    const args = mockDb.getCostSummary.mock.calls[0][0];
    expect(args.tagKeys).toEqual(['orgId']);
    expect(args.configId).toBe(configId);
    expect(args.groupBy).toBe('tags');
  });
});

describe('GET /analytics/costs/summary - general behavior', () => {
  let mockDb: ReturnType<typeof createMockDb>;
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    mockDb = createMockDb();
    app = createTestApp(mockDb);
  });

  test('returns 200 with empty array when no data', async () => {
    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}`
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  test('returns data from getCostSummary', async () => {
    const mockData = [
      { groupKey: 'gpt-4', totalCost: 5000000, requestCount: 10 },
      { groupKey: 'claude-3', totalCost: 3000000, requestCount: 5 },
    ];
    mockDb.getCostSummary.mockResolvedValue(mockData);

    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=model`
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(mockData);
  });

  test('returns 500 when getCostSummary throws', async () => {
    mockDb.getCostSummary.mockRejectedValue(new Error('DB error'));

    const res = await app.request(
      `/analytics/costs/summary?${VALID_DATE_RANGE}&groupBy=model`
    );

    expect(res.status).toBe(500);
  });

  test('returns 400 for missing date range', async () => {
    const res = await app.request(`/analytics/costs/summary`);
    expect(res.status).toBe(400);
  });
});
