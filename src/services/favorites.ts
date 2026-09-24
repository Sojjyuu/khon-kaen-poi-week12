import AsyncStorage from '@react-native-async-storage/async-storage';
import { toggleFavoriteIds } from '../features/favorites/toggleFavoriteIds';

const FAVORITES_KEY = '@khon-kaen-poi/favorites';

export async function getFavoritePoiIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export async function setFavoritePoiIds(ids: string[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids))));
}

let pendingToggle: Promise<unknown> = Promise.resolve();

export function toggleFavoritePoi(id: string): Promise<string[]> {
  // Read and write are one operation; parallel taps must not overwrite each other.
  const result = pendingToggle.then(async () => {
    const next = toggleFavoriteIds(await getFavoritePoiIds(), id);
    await setFavoritePoiIds(next);
    return next;
  });
  pendingToggle = result.catch(() => undefined);
  return result;
}
