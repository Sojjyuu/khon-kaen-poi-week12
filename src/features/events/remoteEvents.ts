import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CampusEvent } from './types';
import { fetchCampusEvents, hasCampusApi, parseEvents } from '../../services/campusApi';

const KEY = 'khonkaen.remote-events.v1';
type Cached = { events: CampusEvent[]; updatedAt: string };
export type RemoteSnapshot = Cached & { offline: boolean };

export async function cachedRemoteEvents(): Promise<Cached | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    const { events, updatedAt } = data as Partial<Cached>;
    if (typeof updatedAt !== 'string') return null;
    return { events: parseEvents(events), updatedAt };
  } catch { return null; }
}

export async function refreshRemoteEvents(signal?: AbortSignal): Promise<RemoteSnapshot | null> {
  if (!hasCampusApi()) return null;
  try {
    const events = await fetchCampusEvents(signal);
    const snapshot: Cached = { events, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEY, JSON.stringify(snapshot));
    return { ...snapshot, offline: false };
  } catch (error) {
    if (signal?.aborted) throw error;
    const cached = await cachedRemoteEvents();
    if (cached) return { ...cached, offline: true };
    throw error;
  }
}
