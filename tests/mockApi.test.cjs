const { test } = require('node:test');
const assert = require('node:assert/strict');
const { fork } = require('node:child_process');
const path = require('node:path');

test('mock API enforces session and photo validation across the registration flow', async (t) => {
  const server = fork(path.join(__dirname, '../scripts/mock-campus-api.cjs'), {
    env: { ...process.env, PORT: '0', CAMPUS_TEST_EMAIL: 'student@example.test', CAMPUS_TEST_PASSWORD: 'disposable-only' },
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
  });
  t.after(() => server.kill());
  const { port } = await new Promise((resolve, reject) => {
    server.once('message', resolve);
    server.once('exit', (code) => reject(new Error(`API exited ${code}`)));
  });
  const url = `http://127.0.0.1:${port}`;
  const events = await fetch(`${url}/events`).then((res) => res.json());
  assert.equal(events.length, 1);
  const denied = await fetch(`${url}/events/api-event-1/registrations`, { method: 'POST', body: '{}' });
  assert.equal(denied.status, 401);
  const login = await fetch(`${url}/auth/login`, {
    method: 'POST', body: JSON.stringify({ email: 'student@example.test', password: 'disposable-only' }),
  }).then((res) => res.json());
  assert.ok(login.accessToken);
  const headers = { Authorization: `Bearer ${login.accessToken}` };
  const restored = await fetch(`${url}/auth/me`, { headers }).then((res) => res.json());
  assert.equal(restored.id, 'tester');
  const registration = await fetch(`${url}/events/api-event-1/registrations`, {
    method: 'POST', headers, body: JSON.stringify({ fullName: 'Student', email: 'student@example.test' }),
  }).then((res) => res.json());
  assert.match(registration.registrationId, /^reg-/);
  const again = await fetch(`${url}/events/api-event-1/registrations`, {
    method: 'POST', headers, body: JSON.stringify({ fullName: 'Student', email: 'student@example.test' }),
  }).then((res) => res.json());
  assert.equal(again.registrationId, registration.registrationId);
  const upload = `${url}/events/api-event-1/registrations/${registration.registrationId}/photo`;
  const form = new FormData();
  form.append('photo', new Blob([Buffer.from('89504e470d0a1a0a', 'hex')], { type: 'image/png' }), 'test.png');
  assert.equal((await fetch(upload, { method: 'POST', headers, body: form })).status, 200);
  const invalid = new FormData();
  invalid.append('photo', new Blob(['not an image'], { type: 'image/png' }), 'bad.png');
  assert.equal((await fetch(upload, { method: 'POST', headers, body: invalid })).status, 400);
});
