import AsyncStorage from '@react-native-async-storage/async-storage';

import type { CampusEvent } from '../features/events/types';

const EVENT_STORAGE_KEY = 'khonkaen.events.v1';

export const eventStorage = {
  async read(): Promise<unknown> {
    const value = await AsyncStorage.getItem(EVENT_STORAGE_KEY);
    return value === null ? null : JSON.parse(value);
  },

  async write(events: CampusEvent[]): Promise<void> {
    await AsyncStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
  },
};

export type EventStorage = typeof eventStorage;
