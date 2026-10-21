import { toggleFavoriteIds } from '../../src/features/favorites/toggleFavoriteIds';
import { expect, it } from '@jest/globals';

it('adds an id and removes it on the next toggle without changing the input', () => {
  const initial = ['poi-a'];
  const added = toggleFavoriteIds(initial, 'poi-b');
  expect(added).toEqual(['poi-a', 'poi-b']);
  expect(initial).toEqual(['poi-a']);
  expect(toggleFavoriteIds(added, 'poi-b')).toEqual(['poi-a']);
});
