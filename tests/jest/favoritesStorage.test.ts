import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { getFavoritePoiIds, toggleFavoritePoi } from '../../src/services/favorites';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: require('@jest/globals').jest.fn(),
    setItem: require('@jest/globals').jest.fn(),
  },
}));

const getItem = jest.mocked(AsyncStorage.getItem);
const setItem = jest.mocked(AsyncStorage.setItem);

beforeEach(() => {
  let saved: string | null = null;
  getItem.mockImplementation(async () => {
    // Make parallel reads overlap so a lost update is observable.
    await Promise.resolve();
    return saved;
  });
  setItem.mockImplementation(async (_key: string, value: string) => {
    await Promise.resolve();
    saved = value;
  });
});

it('keeps both favorites when two changes happen together', async () => {
  await Promise.all([toggleFavoritePoi('poi-a'), toggleFavoritePoi('poi-b')]);
  expect(await getFavoritePoiIds()).toEqual(['poi-a', 'poi-b']);
});

it('returns an empty list when storage contains malformed JSON', async () => {
  getItem.mockResolvedValueOnce('{broken');
  expect(await getFavoritePoiIds()).toEqual([]);
});
