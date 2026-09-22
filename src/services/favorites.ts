import AsyncStorage from '@react-native-async-storage/async-storage';

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

export async function toggleFavoritePoi(id: string): Promise<string[]> {
  const current = await getFavoritePoiIds();
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  await setFavoritePoiIds(next);
  return next;
}
