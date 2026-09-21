const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = (path) => fs.readFileSync(path, 'utf8');

test('screens do not directly access storage or notification device APIs', () => {
  const screens = ['app/events/index.tsx', 'app/events/[id].tsx', 'src/screens/PoiExplorerScreen.tsx'].map(read).join('\n');
  assert.doesNotMatch(screens, /AsyncStorage|expo-notifications/);
});

test('event list uses virtualization, stable renderer and a memoized row', () => {
  const screen = read('app/events/index.tsx');
  const row = read('src/features/events/components/EventCard.tsx');
  assert.match(screen, /<FlatList/);
  assert.match(screen, /renderEvent = useCallback/);
  assert.match(screen, /initialNumToRender=/);
  assert.match(row, /memo\(/);
});

test('accessibility fixes include headings, live regions, touch size and reduced motion', () => {
  const files = ['app/events/index.tsx', 'app/events/[id].tsx', 'src/components/EventUI.tsx', 'src/components/PoiMap.tsx'].map(read).join('\n');
  assert.match(files, /accessibilityRole="header"/);
  assert.match(files, /accessibilityLiveRegion=/);
  assert.match(files, /minHeight: 48/);
  assert.match(files, /useReduceMotion/);
});
