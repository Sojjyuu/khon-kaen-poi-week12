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

function setup({ granted = true, expoGo = false } = {}) {
  const scope = compile('src/storage/accountScope.ts', {});
  scope.setAccountScope('alice');
  const calls = [];
  const pending = new Map();
  const event = { id: 'demo', startsAt: new Date(Date.now() + 3_600_000).toISOString() };
  const notifications = {
    getPresentedNotificationsAsync: async () => [],
    dismissNotificationAsync: async () => {},
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
    '../storage/accountScope': scope,
    'react-native': {
      Platform: { OS: 'android' },
      Linking: { openSettings: async () => {} },
      AppState: { addEventListener: () => ({ remove() {} }) },
    },
    'expo-notifications': notifications,
    'expo-constants': { __esModule: true, default: { appOwnership: expoGo ? 'expo' : 'standalone' } },
  });
  const types = compile('src/features/events/types.ts', {});
  const repositoryModule = compile('src/repositories/reminderRepository.ts', {
    '../storage/accountScope': scope,
    './eventRepository': { eventRepository: { findById: async (id) => id === event.id ? event : undefined } },
    '../features/events/types': types,
    '../services/notificationService': notificationModule,
  });
  return { scope, notifications, repository: repositoryModule.reminderRepository, responseEventId: repositoryModule.responseEventId, event, pending, calls };
}

test('channel precedes permission; trigger is 30 minutes before event; payload contains event and account IDs', async () => {
  const { repository, event, pending, calls } = setup();
  const id = await repository.schedule('demo');
  assert.deepEqual(calls, ['channel', 'permission']);
  assert.equal(pending.get(id).trigger.date.getTime(), Date.parse(event.startsAt) - 1_800_000);
  assert.equal(JSON.stringify(pending.get(id).content.data), '{"eventId":"demo","ownerId":"alice"}');
});

test('Expo Go skips unavailable Android notification channel', async () => {
  const { repository, pending, calls } = setup({ expoGo: true });
  const id = await repository.schedule('demo');
  assert.deepEqual(calls, ['permission']);
  assert.equal(pending.get(id).trigger.channelId, undefined);
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
  assert.equal(responseEventId(response({ eventId: 'demo', ownerId: 'alice' })), 'demo');
  assert.equal(responseEventId(response({ eventId: 'deleted', ownerId: 'alice' })), 'deleted');
});


test('logout cancels only reminders and rejects work queued by the old account', async () => {
  const { repository, pending, scope, responseEventId } = setup();
  await repository.schedule('demo');
  pending.set('other-feature', { identifier: 'other-feature', content: { data: {} } });
  const queued = repository.schedule('demo', true);
  const rejected = assert.rejects(queued, /บัญชีเปลี่ยน/);
  await scope.prepareAccountChange(null);
  scope.setAccountScope(null);
  await rejected;
  assert.deepEqual([...pending.keys()], ['other-feature']);
  await scope.prepareAccountChange('bob');
  scope.setAccountScope('bob');
  assert.equal(responseEventId({ actionIdentifier: 'default', notification: { date: 1,
    request: { identifier: 'event-reminder:alice:demo:main', content: { data: { eventId: 'demo', ownerId: 'alice' } } } } }), null);
  await repository.schedule('demo');
  assert.equal([...pending.values()].find(x => x.identifier !== 'other-feature').content.data.ownerId, 'bob');
});
