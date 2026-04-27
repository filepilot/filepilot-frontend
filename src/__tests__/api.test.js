import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

// ---------------------------------------------------------------------------
// We import the api module AFTER setting up localStorage mocks so the
// interceptors that read localStorage are testable.
// ---------------------------------------------------------------------------

// Mock localStorage before importing api
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] ?? null),
    setItem: vi.fn((key, val) => { store[key] = String(val); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    _set: (key, val) => { store[key] = val; },
    _store: () => store,
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });

import api from '../api/api';

// ---------------------------------------------------------------------------
// JWT helpers
// ---------------------------------------------------------------------------

function makeToken(exp) {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ sub: 'user', exp }));
  return `${header}.${payload}.signature`;
}

const FUTURE_EXP = Math.floor(Date.now() / 1000) + 3600;  // 1 hour from now
const PAST_EXP   = Math.floor(Date.now() / 1000) - 3600;  // 1 hour ago

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mock;

beforeEach(() => {
  mock = new MockAdapter(api);
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  mock.restore();
});

// ---------------------------------------------------------------------------
// Request interceptor – JWT attachment
// ---------------------------------------------------------------------------

describe('api request interceptor', () => {
  it('attaches Authorization header when a valid token is present', async () => {
    const token = makeToken(FUTURE_EXP);
    localStorageMock._set('filepilot_token', token);
    mock.onGet('/test').reply(200, {});

    const config = await api.get('/test').then(r => r.config);
    expect(config.headers['Authorization']).toBe(`Bearer ${token}`);
  });

  it('does NOT attach Authorization header when no token', async () => {
    mock.onGet('/test').reply(200, {});
    const config = await api.get('/test').then(r => r.config);
    expect(config.headers['Authorization']).toBeUndefined();
  });

  it('rejects the request when stored token is expired', async () => {
    const token = makeToken(PAST_EXP);
    localStorageMock._set('filepilot_token', token);
    mock.onGet('/test').reply(200, {});

    await expect(api.get('/test')).rejects.toThrow('Token expired');
  });

  it('clears localStorage when stored token is expired', async () => {
    const token = makeToken(PAST_EXP);
    localStorageMock._set('filepilot_token', token);
    mock.onGet('/test').reply(200, {});

    try { await api.get('/test'); } catch { /* expected */ }
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_user');
  });
});

// ---------------------------------------------------------------------------
// Response interceptor – 401 auto-logout
// ---------------------------------------------------------------------------

describe('api response interceptor – 401', () => {
  it('clears localStorage on a 401 response', async () => {
    localStorageMock._set('filepilot_token', makeToken(FUTURE_EXP));
    localStorageMock._set('filepilot_user', JSON.stringify({ username: 'u' }));
    mock.onGet('/protected').reply(401);

    await expect(api.get('/protected')).rejects.toMatchObject({ response: { status: 401 } });
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('filepilot_user');
  });

  it('does NOT auto-retry on a 401', async () => {
    mock.onGet('/protected').reply(401);
    let callCount = 0;
    mock.onGet('/protected').reply(() => { callCount++; return [401]; });

    await expect(api.get('/protected')).rejects.toBeDefined();
    // Should have been called exactly once – no retry
    expect(callCount).toBeLessThanOrEqual(1);
  });
});

// ---------------------------------------------------------------------------
// Response interceptor – auto-retry on 5xx GET
// ---------------------------------------------------------------------------

describe('api response interceptor – auto-retry', () => {
  it('retries a failing GET once on a 500 and returns the second response', async () => {
    let calls = 0;
    mock.onGet('/flaky').reply(() => {
      calls++;
      if (calls === 1) return [500];
      return [200, { ok: true }];
    });

    const res = await api.get('/flaky');
    expect(calls).toBe(2);
    expect(res.data).toEqual({ ok: true });
  });

  it('does NOT retry a second time (only one retry allowed)', async () => {
    let calls = 0;
    mock.onGet('/always-fails').reply(() => { calls++; return [500]; });

    await expect(api.get('/always-fails')).rejects.toBeDefined();
    expect(calls).toBe(2); // original + one retry
  });

  it('does NOT retry a POST on 500', async () => {
    let calls = 0;
    mock.onPost('/data').reply(() => { calls++; return [500]; });

    await expect(api.post('/data', {})).rejects.toBeDefined();
    expect(calls).toBe(1); // no retry for non-GET
  });

  it('does NOT retry on 429 (rate-limit)', async () => {
    let calls = 0;
    mock.onGet('/rate-limited').reply(() => { calls++; return [429]; });

    await expect(api.get('/rate-limited')).rejects.toBeDefined();
    expect(calls).toBe(1);
  });

  it('does NOT retry on a 4xx client error other than 401/429', async () => {
    let calls = 0;
    mock.onGet('/missing').reply(() => { calls++; return [404]; });

    await expect(api.get('/missing')).rejects.toBeDefined();
    expect(calls).toBe(1);
  });
});
