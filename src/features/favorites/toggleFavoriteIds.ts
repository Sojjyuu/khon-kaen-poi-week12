export function toggleFavoriteIds(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}
