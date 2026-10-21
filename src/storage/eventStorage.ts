import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CampusEvent } from '../features/events/types';

import { accountKey, getAccountScope } from './accountScope';

const EVENT_STORAGE_KEY = 'khonkaen.events.v1';

export function createAccountEventStorage(userId: string | null = getAccountScope()) {
 const key = accountKey(EVENT_STORAGE_KEY, userId);
 return {
  async read(): Promise<unknown> {
    const value = await AsyncStorage.getItem(key);
    return value === null ? null : JSON.parse(value);
  },

  async write(events: CampusEvent[]): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(events));
  },
};
}
export const eventStorage = createAccountEventStorage();

export type EventStorage = typeof eventStorage;
