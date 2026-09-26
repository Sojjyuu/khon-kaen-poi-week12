// Local classroom API only. Set credentials via environment variables; never use real accounts.
const http = require('node:http');
const { randomBytes, timingSafeEqual, scryptSync } = require('node:crypto');

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const dataFile = process.env.CAMPUS_DATA_FILE || path.join(__dirname, '../.local-data/accounts.json');
const ttl = Number(process.env.CAMPUS_SESSION_TTL_MS || 604800000);
if (!Number.isFinite(ttl) || ttl <= 0) throw new Error('Invalid session TTL');
const tokenKey = (token) => createHash('sha256').update(token).digest('hex');

const email = process.env.CAMPUS_TEST_EMAIL;
const password = process.env.CAMPUS_TEST_PASSWORD;
if (!email || !password) {
  console.error('Set CAMPUS_TEST_EMAIL and CAMPUS_TEST_PASSWORD for a disposable test account.');
  process.exit(1);
}
let saved = { accounts: [], sessions: [], registrations: [] };
if (fs.existsSync(dataFile)) saved = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
const accounts = new Map(saved.accounts.map(([key, value]) => [key, { ...value, hash: Buffer.from(value.hash, 'hex') }]));
const sessions = new Map(saved.sessions);
const registrations = new Map(saved.registrations);
function persist() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true, mode: 0o700 });
  const snapshot = {
    accounts: [...accounts].map(([key, value]) => [key, { ...value, hash: value.hash.toString('hex') }]),
    sessions: [...sessions], registrations: [...registrations],
  };
  fs.writeFileSync(`${dataFile}.tmp`, JSON.stringify(snapshot), { mode: 0o600 });
  fs.renameSync(`${dataFile}.tmp`, dataFile);
}
function addAccount(name, email, password, id = randomBytes(12).toString('hex')) {
  const salt = randomBytes(16).toString('hex');
  const account = { user: { id, name, email: email.trim().toLowerCase() }, salt, hash: scryptSync(password, salt, 64) };
  accounts.set(email.trim().toLowerCase(), account);
  return account;
}
function issueSession(account) {
  const accessToken = randomBytes(32).toString('hex');
  sessions.set(tokenKey(accessToken), { userId: account.user.id, expiresAt: Date.now() + ttl });
  persist();
  return { accessToken, user: account.user };
}
if (!accounts.has(email.trim().toLowerCase())) {
  addAccount('ผู้ทดสอบ', email, password, accounts.size === 0 ? 'tester' : randomBytes(12).toString('hex'));
  persist();
}
const events = [{ id: 'api-event-1', title: 'เดินสำรวจมหาวิทยาลัยขอนแก่น', description: 'กิจกรรมตัวอย่างจาก API สำหรับทดสอบ', startsAt: '2030-09-24T09:00:00+07:00', poiId: 'kku' }];

const port = Number(process.env.PORT || 4100);
const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(value));
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
    const sessionKey = tokenKey((req.headers.authorization || '').replace(/^Bearer /, ''));
    const session = sessions.get(sessionKey);
    const user = session && session.expiresAt > Date.now()
      ? [...accounts.values()].find(account => account.user.id === session.userId)?.user : undefined;
    const photoRoute = path.match(/^\/events\/([\w-]+)\/registrations\/([\w-]+)\/photo$/);
    if (req.method === 'POST' && photoRoute) {
      if (!user) return json(res, 401, { error: 'unauthorized' });
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(res, 400, { error: 'invalid-fields' });
    if (req.method === 'POST' && path === '/auth/register') {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 80 ||
          typeof body.email !== 'string' || body.email.length > 254 || !/^\S+@\S+\.\S+$/.test(body.email.trim()) ||
          typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
        return json(res, 400, { error: 'invalid-fields' });
      }
      const address = body.email.trim().toLowerCase();
      if (accounts.has(address)) return json(res, 409, { error: 'email-exists' });
      return json(res, 201, issueSession(addAccount(body.name.trim(), address, body.password)));
    }
    if (req.method === 'POST' && path === '/auth/login') {
      const account = typeof body.email === 'string' ? accounts.get(body.email.trim().toLowerCase()) : null;
      if (!account || typeof body.password !== 'string' || body.password.length > 128 ||
          !timingSafeEqual(account.hash, scryptSync(body.password, account.salt, 64))) return json(res, 401, { error: 'invalid-credentials' });
      return json(res, 200, issueSession(account));
    }
    if (!user) return json(res, 401, { error: 'unauthorized' });
    if (req.method === 'POST' && path === '/auth/logout') {
      sessions.delete(sessionKey); persist(); return json(res, 200, { ok: true });
    }
    if (req.method === 'POST' && path === '/auth/profile') {
      if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 80) return json(res, 400, { error: 'invalid-name' });
      user.name = body.name.trim(); persist(); return json(res, 200, user);
    }
    if (req.method === 'GET' && path === '/auth/me') return json(res, 200, user);
    const registrationId = path.match(/^\/events\/([\w-]+)\/registrations$/)?.[1];
    if (req.method === 'POST' && registrationId) {
      if (!events.some((item) => item.id === registrationId)) return json(res, 404, { error: 'not-found' });
      if (typeof body.fullName !== 'string' || !body.fullName.trim() || !/^\S+@\S+\.\S+$/.test(body.email)) return json(res, 400, { error: 'invalid-fields' });
      const key = `${user.id}/${registrationId}`;
      if (!registrations.has(key)) registrations.set(key, `reg-${randomBytes(6).toString('hex')}`);
      persist();
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
