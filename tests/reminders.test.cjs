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

function setup({ granted = true } = {}) {
  const calls = [];
  const pending = new Map();
  const event = { id: 'demo', startsAt: new Date(Date.now() + 3_600_000).toISOString() };
  const notifications = {
    setNotificationHandler: () => {},
    AndroidImportance: { HIGH: 4 },
    SchedulableTriggerInputTypes: { DATE: 'date' },
    DEFAULT_ACTION_IDENTIFIER: 'default',
    setNotificationChannelAsync: async () => { calls.push('channel'); },
    getPermissionsAsync: async () => ({ granted: false, canAskAgain: true }),
    requestPermissionsAsync: async () => { calls.push('permission'); return { granted }; },
    getAllScheduledNotificationsAsync: async () => [...pending.values()],
    cancelScheduledNotificationAsync: async (id) => { pending.delete(id); },
    scheduleNotificationAsync: async (request) => {
      pending.set(request.identifier, { identifier: request.identifier, content: request.content, trigger: request.trigger });
      return request.identifier;
    },
    getLastNotificationResponse: () => null,
    clearLastNotificationResponse: () => {},
    addNotificationResponseReceivedListener: () => ({ remove() {} }),
    addNotificationReceivedListener: () => ({ remove() {} }),
  };
  const notificationModule = compile('src/services/notificationService.ts', {
    'react-native': {
      Platform: { OS: 'android' },
      Linking: { openSettings: async () => {} },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    'expo-notifications': notifications,
  });
  const types = compile('src/features/events/types.ts', {});
  const repositoryModule = compile('src/repositories/reminderRepository.ts', {
    './eventRepository': { eventRepository: { findById: async (id) => id === event.id ? event : undefined } },
    '../features/events/types': types,
    '../services/notificationService': notificationModule,
  });
  return { repository: repositoryModule.reminderRepository, responseEventId: repositoryModule.responseEventId, event, pending, calls };
}

test('channel precedes permission; trigger is 30 minutes before event; payload only contains ID', async () => {
  const { repository, event, pending, calls } = setup();
  const id = await repository.schedule('demo');
  assert.deepEqual(calls, ['channel', 'permission']);
  assert.equal(pending.get(id).trigger.date.getTime(), Date.parse(event.startsAt) - 1_800_000);
  assert.equal(JSON.stringify(pending.get(id).content.data), '{"eventId":"demo"}');
});

test('denied permission and past events do not schedule', async () => {
  const denied = setup({ granted: false });
  await assert.rejects(denied.repository.schedule('demo'), /notification-permission-denied/);
  assert.equal(denied.pending.size, 0);
  const past = setup();
  past.event.startsAt = new Date().toISOString();
  await assert.rejects(past.repository.schedule('demo'), /เลยเวลา/);
  assert.equal(past.calls.length, 0);
});

test('repeated schedule is deduplicated; test reminder is separate; cancel removes both', async () => {
  const { repository, pending } = setup();
  await Promise.all([repository.schedule('demo'), repository.schedule('demo')]);
  assert.equal(pending.size, 1);
  await repository.schedule('demo', true);
  assert.equal(pending.size, 2);
  await repository.cancel('demo');
  assert.equal(pending.size, 0);
});

test('missing event cannot schedule and malformed response cannot navigate', async () => {
  const { repository, responseEventId } = setup();
  await assert.rejects(repository.schedule('deleted'), /ไม่พบ/);
  const response = (data, actionIdentifier = 'default') => ({
    actionIdentifier,
    notification: { date: 1, request: { identifier: 'notice', content: { data } } },
  });
  for (const data of [undefined, {}, { eventId: 42 }, { eventId: '../../settings' }, { eventId: ['demo'] }]) {
    assert.equal(responseEventId(response(data)), null);
  }
  assert.equal(responseEventId(response({ eventId: 'demo' }, 'dismiss')), null);
  assert.equal(responseEventId(response({ eventId: 'demo' })), 'demo');
  assert.equal(responseEventId(response({ eventId: 'deleted' })), 'deleted');
});
