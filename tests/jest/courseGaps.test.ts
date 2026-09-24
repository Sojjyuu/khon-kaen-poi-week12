import { ApiError, parseEvents, requestJson } from '../../src/services/campusApi';
import { validatePhoto, validateRegistration } from '../../src/features/events/registration';
import { loadEventFavorites, toggleEventFavorite } from '../../src/features/events/eventFavorites';
import { refreshRemoteEvents } from '../../src/features/events/remoteEvents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { afterEach, beforeEach, expect, it, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: require('@jest/globals').jest.fn(),
    setItem: require('@jest/globals').jest.fn(),
  },
}));

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
beforeEach(() => {
  jest.mocked(AsyncStorage.getItem).mockReset();
  jest.mocked(AsyncStorage.setItem).mockReset();
  process.env.EXPO_PUBLIC_API_URL = 'https://example.test';
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
});

it('rejects malformed event payloads before displaying them', () => {
  expect(() => parseEvents([{ id: 'x', title: 'Incomplete' }])).toThrow();
});

it('validates registration before calling an API', () => {
  expect(validateRegistration('', 'a@example.com')).toBe('กรุณากรอกชื่อ');
  expect(validateRegistration('Alice', 'invalid')).toBe('อีเมลไม่ถูกต้อง');
  expect(validateRegistration('Alice', 'a@example.com')).toBeNull();
});

it('rejects oversized or unsupported photos and accepts a camera JPEG URI', () => {
  expect(validatePhoto({ uri: 'file:///photo.webp', mimeType: 'image/webp', fileSize: 10 })).toBe('เลือกรูป JPEG หรือ PNG เท่านั้น');
  expect(validatePhoto({ uri: 'file:///photo.jpg', mimeType: 'image/jpeg', fileSize: 3_000_001 })).toBe('เลือกรูปขนาดไม่เกิน 3 MB');
  expect(validatePhoto({ uri: 'file:///photo.jpg', fileSize: 300_000 })).toBeNull();
});

it('preserves both favorites after two rapid taps', async () => {
  let stored: string | null = null;
  jest.mocked(AsyncStorage.getItem).mockImplementation(async () => stored);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => { stored = value; });
  await Promise.all([toggleEventFavorite('event-a'), toggleEventFavorite('event-b')]);
  expect(await loadEventFavorites()).toEqual(['event-a', 'event-b']);
});

it('checks HTTP status before reading JSON and forwards the session token', async () => {
  const response = { ok: false, status: 401, json: jest.fn() };
  const fetchMock = jest.fn(async () => response);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  await expect(requestJson('/auth/me', {}, 'test-token')).rejects.toMatchObject({ status: 401 } satisfies Partial<ApiError>);
  expect(response.json).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledWith('https://example.test/auth/me', expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
  }));
});

it('distinguishes API 404/500 from a malformed JSON response', async () => {
  for (const status of [404, 500]) {
    globalThis.fetch = jest.fn(async () => ({ ok: false, status })) as unknown as typeof fetch;
    await expect(requestJson('/events/missing')).rejects.toMatchObject({ status });
  }
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } })) as unknown as typeof fetch;
  await expect(requestJson('/events')).rejects.toThrow('invalid JSON');
});

it('keeps cached events and updatedAt when network is unavailable', async () => {
  const cached = { events: [{ id: 'api-one', title: 'กิจกรรม', description: 'สำรวจ', startsAt: '2030-01-02T09:00:00Z', poiId: 'kku' }], updatedAt: '2026-09-24T00:00:00Z' };
  jest.mocked(AsyncStorage.getItem).mockResolvedValueOnce(JSON.stringify(cached));
  globalThis.fetch = jest.fn(async () => { throw new Error('offline'); }) as unknown as typeof fetch;
  await expect(refreshRemoteEvents()).resolves.toEqual({ ...cached, offline: true });
  expect(AsyncStorage.setItem).not.toHaveBeenCalled();
});

it('reports invalid JSON and rejects malformed response arrays', async () => {
  globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => [{ id: 'bad' }] })) as unknown as typeof fetch;
  await expect(refreshRemoteEvents()).rejects.toThrow('ข้อมูลกิจกรรมจากเซิร์ฟเวอร์ไม่ถูกต้อง');
});
