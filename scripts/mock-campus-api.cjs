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
async function readBody(req, maxBytes) {
  const chunks = [];
  let length = 0;
  for await (const chunk of req) {
    length += chunk.length;
    if (length > maxBytes) return null;
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/events') return json(res, 200, events);
    const eventId = path.match(/^\/events\/([\w-]+)$/)?.[1];
    if (req.method === 'GET' && eventId) {
      const event = events.find((item) => item.id === eventId);
      return json(res, event ? 200 : 404, event || { error: 'not-found' });
    }
    const photoRoute = path.match(/^\/events\/([\w-]+)\/registrations\/([\w-]+)\/photo$/);
    if (req.method === 'POST' && photoRoute) {
      if (req.headers.authorization !== `Bearer ${token}`) return json(res, 401, { error: 'unauthorized' });
      if (registrations.get(`${user.id}/${photoRoute[1]}`) !== photoRoute[2]) return json(res, 404, { error: 'not-found' });
      const boundary = /^multipart\/form-data; boundary=(?:"([\w-]{1,70})"|([\w-]{1,70}))/.exec(req.headers['content-type'] || '');
      if (!boundary) return json(res, 415, { error: 'invalid-content-type' });
      const payload = await readBody(req, 3_100_000);
      if (!payload) return json(res, 413, { error: 'too-large' });
      const headerEnd = payload.indexOf('\r\n\r\n');
      const finalBoundary = payload.indexOf(`\r\n--${boundary[1] || boundary[2]}`, headerEnd + 4);
      if (headerEnd < 0 || finalBoundary < 0) return json(res, 400, { error: 'invalid-multipart' });
      const header = payload.subarray(0, headerEnd).toString('utf8');
      const bytes = payload.subarray(headerEnd + 4, finalBoundary);
      const declared = /Content-Type: (image\/jpeg|image\/png)/i.exec(header)?.[1]?.toLowerCase();
      const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      const png = bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
      if (!/name="photo"/.test(header) || bytes.length === 0 || bytes.length > 3_000_000 ||
          !((declared === 'image/jpeg' && jpeg) || (declared === 'image/png' && png))) {
        return json(res, 400, { error: 'invalid-photo' });
      }
      return json(res, 200, { photoId: `photo-${randomBytes(6).toString('hex')}` });
    }
    let body = {};
    if (req.method === 'POST') {
      const raw = await readBody(req, 8_192);
      if (!raw) return json(res, 413, { error: 'too-large' });
      try { body = JSON.parse(raw.toString('utf8')); } catch { return json(res, 400, { error: 'invalid-json' }); }
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
server.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`Test API listening on port ${address.port}. Use only on a trusted development network.`);
  if (process.send) process.send({ port: address.port });
});
