// Local classroom API only. Set credentials via environment variables; never use real accounts.
const http = require('node:http');
const { randomBytes, timingSafeEqual, scryptSync } = require('node:crypto');

const { openAccountStore } = require('../server/account-store.cjs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const dataFile = process.env.CAMPUS_DATA_FILE || path.join(__dirname, '../.local-data/accounts.json');
const ttl = Number(process.env.CAMPUS_SESSION_TTL_MS || 604800000);
if (!Number.isFinite(ttl) || ttl <= 0) throw new Error('Invalid session TTL');
const tokenKey = (token) => createHash('sha256').update(token).digest('hex');

const email = process.env.CAMPUS_TEST_EMAIL;
const password = process.env.CAMPUS_TEST_PASSWORD;
if (Boolean(email) !== Boolean(password)) {
  console.error('Set both CAMPUS_TEST_EMAIL and CAMPUS_TEST_PASSWORD, or neither to use signup.');
  process.exit(1);
}
const databaseFile = process.env.CAMPUS_DATABASE_FILE || `${dataFile.replace(/\.json$/, '')}.sqlite`;
const storage = openAccountStore(databaseFile, dataFile);
const saved = storage.load();
const accounts = new Map(saved.accounts.map(([key, value]) => [key, { ...value, hash: Buffer.from(value.hash, 'hex') }]));
const sessions = new Map(saved.sessions);
const registrations = new Map(saved.registrations);
function persist() {
  storage.save({
    accounts: [...accounts].map(([key, value]) => [key, { ...value, hash: value.hash.toString('hex') }]),
    sessions: [...sessions], registrations: [...registrations],
  });
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
if (email && !accounts.has(email.trim().toLowerCase())) {
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

function validPhoto(photo, max) {
  if (photo === null) return true;
  if (typeof photo !== 'string' || photo.length > Math.ceil(max * 4 / 3) + 32) return false;
  const match = /^data:image\/(jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/.exec(photo);
  if (!match) return false;
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > max || bytes.length < 8) return false;
  return match[1] === 'png' ? bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))
    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 && bytes.at(-2) === 255 && bytes.at(-1) === 217;
}
// Device-created events are private snapshots, never additions to the public catalog.
function validLocalEvent(event, id) {
  if (!/^(explore-|local-)[a-zA-Z0-9_-]+$/.test(id) || id.length > 80 || !event || typeof event !== 'object') return false;
  return event.id === id && typeof event.title === 'string' && event.title.trim().length > 0 && event.title.length <= 200 &&
    typeof event.description === 'string' && event.description.length <= 4000 &&
    typeof event.startsAt === 'string' && Number.isFinite(Date.parse(event.startsAt)) &&
    typeof event.poiId === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(event.poiId) &&
    (event.venue === undefined || (event.venue && Number.isFinite(event.venue.latitude) && Math.abs(event.venue.latitude) <= 90 &&
      Number.isFinite(event.venue.longitude) && Math.abs(event.venue.longitude) <= 180));
}

function validJourney(body) {
  return typeof body.title === 'string' && body.title.trim().length > 0 && body.title.length <= 100 &&
    typeof body.note === 'string' && body.note.length <= 4000 && typeof body.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(body.date) && Number.isFinite(Date.parse(body.date)) && new Date(body.date).toISOString().slice(0, 10) === body.date &&
    Array.isArray(body.poiIds) && body.poiIds.length <= 100 && body.poiIds.every(id => typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id)) && validPhoto(body.photo, 2_000_000);
}

const server = http.createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (req.method === 'GET' && path === '/health') return json(res, 200, { ok: true, apiVersion: 'registration-snapshots-v2' });
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
    if (req.method === 'POST' || req.method === 'PUT') {
      const raw = await readBody(req, 3_000_000);
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
      if (body.bio !== undefined && (typeof body.bio !== 'string' || body.bio.length > 300)) return json(res, 400, { error: 'invalid-bio' });
      if (body.photo !== undefined && !validPhoto(body.photo, 500_000)) return json(res, 400, { error: 'invalid-photo' });
      user.name = body.name.trim();
      if (body.bio !== undefined) user.bio = body.bio.trim();
      if (body.photo !== undefined) user.photo = body.photo;
      persist(); return json(res, 200, user);
    }
    if (req.method === 'GET' && path === '/registrations') {
      const prefix = `${user.id}/`;
      return json(res, 200, [...registrations].filter(([key]) => key.startsWith(prefix)).map(([key, id]) => {
        const eventId = key.slice(prefix.length);
        return { id, eventId, event: storage.getRegistrationEvent(user.id, eventId) || events.find(event => event.id === eventId) || null };
      }));
    }
    const canceledEventId = path.match(/^\/registrations\/([\w-]{1,80})$/)?.[1];
    if (req.method === 'DELETE' && canceledEventId) {
      registrations.delete(`${user.id}/${canceledEventId}`);
      persist();
      storage.deleteRegistrationEvent(user.id, canceledEventId);
      return json(res, 200, { ok: true });
    }
    if (req.method === 'GET' && path === '/auth/me') return json(res, 200, user);
    if (req.method === 'GET' && path === '/journeys') return json(res, 200, storage.listJourneys(user.id));
    const journeyId = path.match(/^\/journeys\/([a-zA-Z0-9-]{1,80})$/)?.[1];
    if (journeyId && req.method === 'PUT') {
      if (!validJourney(body)) return json(res, 400, { error: 'invalid-journey' });
      const trip = { id: journeyId, title: body.title.trim(), note: body.note.trim(), date: body.date, photo: body.photo, poiIds: [...new Set(body.poiIds)] };
      storage.saveJourney(user.id, trip); return json(res, 200, trip);
    }
    if (journeyId && req.method === 'DELETE') {
      storage.deleteJourney(user.id, journeyId); return json(res, 200, { ok: true });
    }
    const registrationId = path.match(/^\/events\/([\w-]+)\/registrations$/)?.[1];
    if (req.method === 'POST' && registrationId) {
      const publicEvent = events.some((item) => item.id === registrationId);
      if (!publicEvent && !body.localEvent) return json(res, 404, { error: 'not-found' });
      if (!publicEvent && !validLocalEvent(body.localEvent, registrationId)) return json(res, 400, { error: 'invalid-event' });
      if (typeof body.fullName !== 'string' || !body.fullName.trim() || body.fullName.length > 200 ||
          typeof body.email !== 'string' || body.email.length > 254 || !/^\S+@\S+\.\S+$/.test(body.email.trim())) return json(res, 400, { error: 'invalid-fields' });
      if (!publicEvent) {
        const { id, title, description, startsAt, poiId, venue } = body.localEvent;
        storage.saveRegistrationEvent(user.id, { id, title, description, startsAt, poiId, ...(venue ? { venue } : {}) });
      }
      const key = `${user.id}/${registrationId}`;
      if (!registrations.has(key)) registrations.set(key, `reg-${randomBytes(6).toString('hex')}`);
      persist();
      return json(res, 200, { registrationId: registrations.get(key) });
    }
    return json(res, 404, { error: 'not-found' });
  } catch (error) {
    // Log only error category/code, never tokens, names, email, request bodies or SQL values.
    console.error('[API request failed]', error?.name || 'Error', error?.code || 'NO_CODE');
    return json(res, 500, { error: 'internal' });
  }
});
server.on('close', () => storage.close());
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `API port ${port} is busy. Stop the previous API before npm start.` : 'API could not start. Check database path and permissions.');
  storage.close(); process.exit(1);
});
server.listen(port, '0.0.0.0', () => {
  const address = server.address();
  console.log(`Test API listening on port ${address.port}. Use only on a trusted development network.`);
  if (process.send) process.send({ port: address.port });
});
