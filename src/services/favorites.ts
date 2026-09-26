import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleFavoriteIds } from '../features/favorites/toggleFavoriteIds';

import { accountKey } from '../storage/accountScope';

const FAVORITES_KEY = '@khon-kaen-poi/favorites';

export async function getFavoritePoiIds(key = accountKey(FAVORITES_KEY)): Promise<string[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function setFavoritePoiIds(ids: string[], key = accountKey(FAVORITES_KEY)) {
  await AsyncStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))));
}

let pendingToggle: Promise<unknown> = Promise.resolve();

export function toggleFavoritePoi(id: string): Promise<string[]> {
  const key = accountKey(FAVORITES_KEY);
  // Read and write are one operation; parallel taps must not overwrite each other.
  const result = pendingToggle.then(async () => {
    const next = toggleFavoriteIds(await getFavoritePoiIds(key), id);
    await setFavoritePoiIds(next, key);
    return next;
  });
  pendingToggle = result.catch(() => undefined);
  return result;
}
