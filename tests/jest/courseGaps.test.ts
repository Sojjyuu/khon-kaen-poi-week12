import { parseEvents } from '../../src/services/campusApi';
import { validateRegistration } from '../../src/features/events/registration';
import { loadEventFavorites, toggleEventFavorite } from '../../src/features/events/eventFavorites';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, expect, it, jest } from '@jest/globals';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: require('@jest/globals').jest.fn(),
    setItem: require('@jest/globals').jest.fn(),
  },
}));

beforeEach(() => { jest.clearAllMocks(); });

it('rejects malformed event payloads before displaying them', () => {
  expect(() => parseEvents([{ id: 'x', title: 'Incomplete' }])).toThrow();
});

it('validates registration before calling an API', () => {
  expect(validateRegistration('', 'a@example.com')).toBe('กรุณากรอกชื่อ');
  expect(validateRegistration('Alice', 'invalid')).toBe('อีเมลไม่ถูกต้อง');
  expect(validateRegistration('Alice', 'a@example.com')).toBeNull();
});

it('preserves both favorites after two rapid taps', async () => {
  let stored: string | null = null;
  jest.mocked(AsyncStorage.getItem).mockImplementation(async () => stored);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (_key, value) => { stored = value; });
  await Promise.all([toggleEventFavorite('event-a'), toggleEventFavorite('event-b')]);
  expect(await loadEventFavorites()).toEqual(['event-a', 'event-b']);
});
