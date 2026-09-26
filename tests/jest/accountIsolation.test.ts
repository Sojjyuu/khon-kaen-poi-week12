import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { setAccountScope } from '../../src/storage/accountScope';
import { getFavoritePoiIds, toggleFavoritePoi } from '../../src/services/favorites';
import { loadEventFavorites, toggleEventFavorite } from '../../src/features/events/eventFavorites';
import { eventRepository } from '../../src/repositories/eventRepository';

jest.mock('@react-native-async-storage/async-storage', () => ({ __esModule: true, default: { getItem: require('@jest/globals').jest.fn(), setItem: require('@jest/globals').jest.fn() } }));
beforeEach(() => {
  const data = new Map<string, string>();
  jest.mocked(AsyncStorage.getItem).mockImplementation(async key => data.get(key) ?? null);
  jest.mocked(AsyncStorage.setItem).mockImplementation(async (key, value) => { data.set(key, value); });
});
it('isolates queued trip and favorite writes when switching accounts, and restores the original account', async () => {
  setAccountScope('alice');
  const pending = toggleFavoritePoi('kku');
  const favorite = toggleEventFavorite('explore-kku');
  setAccountScope('bob');
  await Promise.all([pending, favorite]);
  expect(await getFavoritePoiIds()).toEqual([]);
  expect(await loadEventFavorites()).toEqual([]);
  await toggleFavoritePoi('bueng-kaen-nakhon');
  setAccountScope(null);
  expect(await getFavoritePoiIds()).toEqual([]);
  setAccountScope('alice');
  expect(await getFavoritePoiIds()).toEqual(['kku']);
  expect(await loadEventFavorites()).toEqual(['explore-kku']);
});
it('does not leak cached private events across accounts or to guests', async () => {
  setAccountScope('event-alice');
  const event = await eventRepository.create('Private trip', new Date(Date.now() + 86400000), 'kku');
  setAccountScope('event-bob');
  expect((await eventRepository.list()).some(item => item.id === event.id)).toBe(false);
  expect(await eventRepository.remove(event.id)).toBe(false);
  setAccountScope(null);
  expect((await eventRepository.list()).some(item => item.id === event.id)).toBe(false);
  setAccountScope('event-alice');
  expect((await eventRepository.list()).some(item => item.id === event.id)).toBe(true);
});
