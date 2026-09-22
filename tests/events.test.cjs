const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function repository(store) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/data/events.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (name.includes('async-storage')) return { __esModule: true, default: {
      getItem: async key => store.get(key) ?? null,
      setItem: async (key, value) => { store.set(key, value); },
    } };
    if (name === './pointsOfInterest') return { pointsOfInterest: [{ id: 'kku', name: 'KKU' }] };
    throw Error(name);
  } });
  return exports;
}

test('custom calendar time is preserved exactly, including after repository restart', async () => {
  const store = new Map();
  const events = repository(store);
  const selected = new Date('2030-04-15T14:45:00+07:00');
  const event = await events.addEvent(' นัดพบ ', selected);
  assert.equal(event.title, 'นัดพบ');
  assert.equal(event.startsAt, '2030-04-15T07:45:00.000Z');
  assert.equal((await repository(store).getEvent(event.id)).startsAt, event.startsAt);
});

test('reject blank title, invalid date and past time without saving', async () => {
  const store = new Map();
  const events = repository(store);
  await assert.rejects(events.addEvent(' ', new Date(Date.now() + 3600000)), /ชื่อกิจกรรม/);
  await assert.rejects(events.addEvent('test', new Date('invalid')), /อนาคต/);
  await assert.rejects(events.addEvent('test', new Date(Date.now() - 1000)), /อนาคต/);
  assert.equal(store.size, 0);
});

test('allow a future event under 30 minutes; reminder service separately enforces its cutoff', async () => {
  const events = repository(new Map());
  const selected = new Date(Date.now() + 60000);
  assert.equal((await events.addEvent('ใกล้เริ่ม', selected)).startsAt, selected.toISOString());
});


test('delete only user-created events and keep seeded events protected', async () => {
  const store = new Map();
  const events = repository(store);
  const custom = await events.addEvent('ลบทดสอบ', new Date(Date.now() + 3600000));
  assert.equal(await events.deleteEvent(custom.id), true);
  assert.equal(await events.getEvent(custom.id), undefined);

  const seeded = (await events.getEvents()).find(event => event.id.startsWith('explore-'));
  assert.ok(seeded);
  await assert.rejects(events.deleteEvent(seeded.id), /กิจกรรมที่สร้างเอง/);
});
