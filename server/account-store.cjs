const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

// One local API process owns this database. JSON import is atomic and never deletes the source.
function openAccountStore(filename, legacyFile) {
  if (filename !== ':memory:') fs.mkdirSync(path.dirname(filename), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(filename);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS accounts(email TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(digest TEXT PRIMARY KEY, data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS registrations(owner_event TEXT PRIMARY KEY, id TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS registration_events(owner TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,id));
    CREATE TABLE IF NOT EXISTS journeys(owner TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,id));
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
  function save(snapshot) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec('DELETE FROM accounts; DELETE FROM sessions; DELETE FROM registrations;');
      const account = db.prepare('INSERT INTO accounts VALUES (?,?)');
      const session = db.prepare('INSERT INTO sessions VALUES (?,?)');
      const registration = db.prepare('INSERT INTO registrations VALUES (?,?)');
      for (const [key, value] of snapshot.accounts) account.run(key, JSON.stringify(value));
      for (const [key, value] of snapshot.sessions) session.run(key, JSON.stringify(value));
      for (const [key, value] of snapshot.registrations) registration.run(key, value);
      db.prepare("INSERT OR REPLACE INTO metadata VALUES ('initialized','1')").run();
      db.exec('COMMIT');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
  try {
    if (!db.prepare("SELECT value FROM metadata WHERE key='initialized'").get()) {
      const existing = db.prepare('SELECT COUNT(*) AS n FROM accounts').get().n;
      if (existing) throw new Error('Existing database is missing migration metadata; stop to protect data.');
      const imported = legacyFile && fs.existsSync(legacyFile)
        ? JSON.parse(fs.readFileSync(legacyFile, 'utf8')) : { accounts: [], sessions: [], registrations: [] };
      if (!['accounts', 'sessions', 'registrations'].every(key => Array.isArray(imported[key]))) throw new Error('Invalid legacy account file');
      for (const entry of imported.accounts) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !entry[1]?.user?.id || typeof entry[1].salt !== 'string' || !/^[a-f0-9]{128}$/.test(entry[1].hash)) throw new Error('Invalid legacy account record');
      }
      save(imported);
    }
  } catch (error) { db.close(); throw error; }
  return {
    load: () => ({
      accounts: db.prepare('SELECT * FROM accounts').all().map(row => [row.email, JSON.parse(row.data)]),
      sessions: db.prepare('SELECT * FROM sessions').all().map(row => [row.digest, JSON.parse(row.data)]),
      registrations: db.prepare('SELECT * FROM registrations').all().map(row => [row.owner_event, row.id]),
    }),
    save,
    getRegistrationEvent: (owner, id) => { const row = db.prepare('SELECT data FROM registration_events WHERE owner=? AND id=?').get(owner, id); return row ? JSON.parse(row.data) : null; },
    deleteRegistrationEvent: (owner, id) => db.prepare('DELETE FROM registration_events WHERE owner=? AND id=?').run(owner, id),
    saveRegistrationEvent: (owner, event) => db.prepare('INSERT INTO registration_events VALUES (?,?,?) ON CONFLICT(owner,id) DO UPDATE SET data=excluded.data').run(owner, event.id, JSON.stringify(event)),

    listJourneys: owner => db.prepare("SELECT data FROM journeys WHERE owner=? ORDER BY json_extract(data, '$.date') DESC").all(owner).map(row => JSON.parse(row.data)),
    saveJourney: (owner, trip) => db.prepare('INSERT INTO journeys VALUES (?,?,?) ON CONFLICT(owner,id) DO UPDATE SET data=excluded.data').run(owner, trip.id, JSON.stringify(trip)),
    deleteJourney: (owner, id) => db.prepare('DELETE FROM journeys WHERE owner=? AND id=?').run(owner, id),
    close: () => db.close(),
  };
}
module.exports = { openAccountStore };
