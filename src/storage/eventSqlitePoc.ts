import * as SQLite from 'expo-sqlite';

// Lab 7 proof of concept. The working event cache remains AsyncStorage.
export async function prepareEventTable() {
  const db = await SQLite.openDatabaseAsync('khonkaen-events-poc.db');
  await db.execAsync(`CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    starts_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  return db;
}
