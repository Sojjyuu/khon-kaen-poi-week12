import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { eventRepository } from '../../../repositories/eventRepository';
import {
  reminderRepository,
  type ReminderSnapshot,
} from '../../../repositories/reminderRepository';
import type { CampusEvent } from '../types';

const EMPTY_REMINDERS: ReminderSnapshot = {
  permissionGranted: false,
  mainScheduled: false,
  testScheduled: false,
  count: 0,
};

export function useEventDetail(eventId: string | null) {
  const [event, setEvent] = useState<CampusEvent>();
  const [reminders, setReminders] = useState(EMPTY_REMINDERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const [record, snapshot] = await Promise.all([
        eventRepository.findById(eventId),
        eventId
          ? reminderRepository.snapshot(eventId)
          : Promise.resolve(EMPTY_REMINDERS),
      ]);
      if (current !== generation.current) return;
      setEvent(record);
      setReminders(snapshot);
      setError('');
    } catch {
      if (current === generation.current) {
        setError(
          'โหลดข้อมูลหรือสถานะการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง',
        );
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [eventId]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void refresh();
      return () => {
        generation.current += 1;
      };
    }, [refresh]),
  );

  useEffect(() => reminderRepository.subscribeToRefresh(() => void refresh()), [refresh]);

  const schedule = useCallback(
    async (test = false) => {
      if (!eventId) return;
      await reminderRepository.schedule(eventId, test);
      await refresh();
    },
    [eventId, refresh],
  );

  const cancel = useCallback(async () => {
    if (!eventId) return;
    await reminderRepository.cancel(eventId);
    await refresh();
  }, [eventId, refresh]);

  return {
    event,
    reminders,
    loading,
    error,
    refresh,
    schedule,
    cancel,
    openSettings: reminderRepository.openSettings,
  };
}
