const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// Execute the production service with a fake native boundary; no mobile device required.
function setup({ granted = true } = {}) {
  const calls = [];
  const pending = new Map();
  const event = { id: 'demo', startsAt: new Date(Date.now() + 3600000).toISOString() };
  const notifications = {
    setNotificationHandler: () => {},
    AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { DATE: 'date' }, DEFAULT_ACTION_IDENTIFIER: 'default',
    setNotificationChannelAsync: async () => { calls.push('channel'); },
    getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
    requestPermissionsAsync: async () => { calls.push('permission'); return { granted }; },
    getAllScheduledNotificationsAsync: async () => [...pending.values()],
    cancelScheduledNotificationAsync: async id => { pending.delete(id); },
    scheduleNotificationAsync: async request => { pending.set(request.identifier, request); return request.identifier; },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/services/reminders.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, { exports, require: name => {
    if (name === 'react-native') return { Platform: { OS: 'android' } };
    if (name === 'expo-notifications') return notifications;
    if (name === '../data/events') return {
      getEvent: async id => id === event.id ? event : undefined,
      isEventId: id => typeof id === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(id),
    };
    throw Error(name);
  } });
  return { service: exports, event, pending, calls };
}

test('channel precedes permission; trigger is 30 minutes before event; payload only contains ID', async () => {
  const { service, event, pending, calls } = setup();
  const id = await service.scheduleEventReminder('demo');
  assert.deepEqual(calls, ['channel', 'permission']);
  assert.equal(pending.get(id).trigger.date.getTime(), Date.parse(event.startsAt) - 1800000);
  assert.equal(JSON.stringify(pending.get(id).content.data), '{"eventId":"demo"}');
});
test('denied permission and past times do not schedule', async () => {
  const denied = setup({ granted: false });
  await assert.rejects(denied.service.scheduleEventReminder('demo'), /notification-permission-denied/);
  assert.equal(denied.pending.size, 0);
  const past = setup(); past.event.startsAt = new Date().toISOString();
  await assert.rejects(past.service.scheduleEventReminder('demo'), /เลยเวลา/);
  assert.equal(past.calls.length, 0);
});
test('repeated scheduling is deduplicated; demo preserves main; cancellation removes both', async () => {
  const { service, pending } = setup();
  await Promise.all([service.scheduleEventReminder('demo'), service.scheduleEventReminder('demo')]);
  assert.equal(pending.size, 1);
  await service.scheduleEventReminder('demo', true);
  assert.equal(pending.size, 2);
  await service.cancelEventReminder('demo');
  assert.equal(pending.size, 0);
});
test('missing event cannot schedule, malformed payload and non-default actions cannot navigate', async () => {
  const { service } = setup();
  await assert.rejects(service.scheduleEventReminder('deleted'), /ไม่พบ/);
  const response = (data, actionIdentifier = 'default') => ({ actionIdentifier, notification: { request: { content: { data } } } });
  for (const data of [undefined, {}, { eventId: 42 }, { eventId: '../../settings' }, { eventId: ['demo'] }]) {
    assert.equal(service.responseEventId(response(data)), null);
  }
  assert.equal(service.responseEventId(response({ eventId: 'demo' }, 'dismiss')), null);
  assert.equal(service.responseEventId(response({ eventId: 'demo' })), 'demo');
  // Syntactically valid deleted IDs navigate to the detail page's not-found fallback.
  assert.equal(service.responseEventId(response({ eventId: 'deleted' })), 'deleted');
});
