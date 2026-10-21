import AsyncStorage from '@react-native-async-storage/async-storage';

import { accountKey } from '../../storage/accountScope';

const KEY = 'khonkaen.event-favorites.v1';

export async function loadEventFavorites(key = accountKey(KEY)): Promise<string[]> {
  try {
    const stored = await AsyncStorage.getItem(key);
    if (!stored) return [];
    const ids: unknown = JSON.parse(stored);
    return Array.isArray(ids) && ids.every((id) => typeof id === 'string') ? ids : [];
  } catch {
    return [];
  }
}

let queue: Promise<unknown> = Promise.resolve();
export function toggleEventFavorite(id: string): Promise<string[]> {
  const key = accountKey(KEY);
  const next = queue.then(async () => {
    const ids = await loadEventFavorites(key);
    const updated = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
    await AsyncStorage.setItem(key, JSON.stringify(updated));
    return updated;
  });
  queue = next.catch(() => undefined);
  return next;
}
