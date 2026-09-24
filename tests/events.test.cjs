const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function compile(path, dependencies) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: (name) => {
    if (name in dependencies) return dependencies[name];
    throw new Error(`Unexpected dependency: ${name}`);
  } });
  return exports;
}

function setup(store = new Map()) {
  const types = compile('src/features/events/types.ts', {});
  const coordinates = compile('src/types/coordinates.ts', {});
  const storage = {
    read: async () => {
      const value = store.get('events');
      return value === undefined ? null : JSON.parse(value);
    },
    write: async (events) => store.set('events', JSON.stringify(events)),
  };
  const module = compile('src/repositories/eventRepository.ts', {
    '../data/pointsOfInterest': { pointsOfInterest: [{ id: 'kku', name: 'KKU' }] },
    '../features/events/types': types,
    '../storage/eventStorage': { eventStorage: storage },
    '../features/events/remoteEvents': { cachedRemoteEvents: async () => null },
    '../services/campusApi': { hasCampusApi: () => false },
    '../types/coordinates': coordinates,
  });
  return { repository: module.createEventRepository(storage), store };
}

test('repository preserves a selected instant after a new repository instance', async () => {
  const { repository, store } = setup();
  const selected = new Date('2030-04-15T14:45:00+07:00');
  const event = await repository.create(' นัดพบ ', selected);
  assert.equal(event.title, 'นัดพบ');
  assert.equal(event.startsAt, '2030-04-15T07:45:00.000Z');
  assert.equal((await setup(store).repository.findById(event.id)).startsAt, event.startsAt);
});

test('repository rejects invalid input without writing it', async () => {
  const { repository, store } = setup();
  await assert.rejects(repository.create(' ', new Date(Date.now() + 3_600_000)), /ชื่อกิจกรรม/);
  await assert.rejects(repository.create('test', new Date('invalid')), /อนาคต/);
  await assert.rejects(repository.create('test', new Date(Date.now() - 1_000)), /อนาคต/);
  assert.equal(store.size, 0);
});

test('event under 30 minutes is stored; reminder repository owns the cutoff rule', async () => {
  const { repository } = setup();
  const selected = new Date(Date.now() + 60_000);
  assert.equal((await repository.create('ใกล้เริ่ม', selected)).startsAt, selected.toISOString());
});

test('a manually selected venue survives restart and rejects impossible coordinates', async () => {
  const { repository, store } = setup();
  const startsAt = new Date(Date.now() + 3_600_000);
  await assert.rejects(repository.create('นัดพบ', startsAt, 'kku', { latitude: 999, longitude: 102 }), /พิกัด/);
  const event = await repository.create('นัดพบ', startsAt, 'kku', { latitude: 16.47, longitude: 102.82 });
  const restored = await setup(store).repository.findById(event.id);
  assert.equal(restored.venue.latitude, 16.47);
  assert.equal(restored.venue.longitude, 102.82);
});


test('only user-created events can be deleted', async () => {
  const { repository } = setup();
  const custom = await repository.create('ลบทดสอบ', new Date(Date.now() + 3_600_000));
  assert.equal(await repository.remove(custom.id), true);
  assert.equal(await repository.findById(custom.id), undefined);

  const seeded = (await repository.list()).find((event) => event.id.startsWith('explore-'));
  assert.ok(seeded);
  await assert.rejects(repository.remove(seeded.id), /กิจกรรมที่สร้างเอง/);
});
