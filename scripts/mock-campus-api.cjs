// Local classroom API only. Set credentials via environment variables; never use real accounts.
const http = require('node:http');
const { randomBytes, timingSafeEqual } = require('node:crypto');

const email = process.env.CAMPUS_TEST_EMAIL;
const password = process.env.CAMPUS_TEST_PASSWORD;
if (!email || !password) {
  console.error('Set CAMPUS_TEST_EMAIL and CAMPUS_TEST_PASSWORD for a disposable test account.');
  process.exit(1);
}
const token = randomBytes(32).toString('hex');
const user = { id: 'tester', name: 'ผู้ทดสอบ' };
const events = [{ id: 'api-event-1', title: 'เดินสำรวจมหาวิทยาลัยขอนแก่น', description: 'กิจกรรมตัวอย่างจาก API สำหรับทดสอบ', startsAt: '2030-09-24T09:00:00+07:00', poiId: 'kku' }];
const registrations = new Map();
const port = Number(process.env.PORT || 4100);
const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
};
const equal = (a, b) => {
  const first = Buffer.from(String(a)); const second = Buffer.from(String(b));
  return first.length === second.length && timingSafeEqual(first, second);
};

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/events') return json(res, 200, events);
    const eventId = path.match(/^\/events\/([\w-]+)$/)?.[1];
    if (req.method === 'GET' && eventId) {
      const event = events.find((item) => item.id === eventId);
      return json(res, event ? 200 : 404, event || { error: 'not-found' });
    }
    let body = {};
    if (req.method === 'POST') {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 8_192) return json(res, 413, { error: 'too-large' });
      }
      try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'invalid-json' }); }
    }
    if (req.method === 'POST' && path === '/auth/login') {
      return equal(body.email, email) && equal(body.password, password)
        ? json(res, 200, { accessToken: token, user }) : json(res, 401, { error: 'invalid-credentials' });
    }
    if (req.headers.authorization !== `Bearer ${token}`) return json(res, 401, { error: 'unauthorized' });
    if (req.method === 'GET' && path === '/auth/me') return json(res, 200, user);
    const registrationId = path.match(/^\/events\/([\w-]+)\/registrations$/)?.[1];
    if (req.method === 'POST' && registrationId) {
      if (!events.some((item) => item.id === registrationId)) return json(res, 404, { error: 'not-found' });
      if (typeof body.fullName !== 'string' || !body.fullName.trim() || !/^\S+@\S+\.\S+$/.test(body.email)) return json(res, 400, { error: 'invalid-fields' });
      const key = `${user.id}/${registrationId}`;
      if (!registrations.has(key)) registrations.set(key, `reg-${randomBytes(6).toString('hex')}`);
      return json(res, 200, { registrationId: registrations.get(key) });
    }
    return json(res, 404, { error: 'not-found' });
  } catch { return json(res, 500, { error: 'internal' }); }
});
server.listen(port, '0.0.0.0', () => console.log(`Test API listening on port ${port}. Use only on a trusted development network.`));
