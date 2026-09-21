import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { eventRepository } from '../../../repositories/eventRepository';
import type { CampusEvent } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const result = await eventRepository.list();
      if (current !== generation.current) return;
      setEvents(result);
      setError('');
    } catch {
      if (current === generation.current) {
        setError('อ่านข้อมูลกิจกรรมไม่ได้ กรุณาลองอีกครั้ง');
      }
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
      return () => {
        generation.current += 1;
      };
    }, [reload]),
  );

  const createEvent = useCallback(async (title: string, startsAt: Date) => {
    const event = await eventRepository.create(title, startsAt);
    setEvents((current) => [...current, event]);
    return event;
  }, []);

  return { events, loading, error, reload, createEvent };
}
