import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { eventRepository } from '../../../repositories/eventRepository';
import { reminderRepository } from '../../../repositories/reminderRepository';
import type { CampusEvent } from '../types';
import { cachedRemoteEvents, refreshRemoteEvents } from '../remoteEvents';
import { hasCampusApi } from '../../../services/campusApi';

export function useEvents() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [remote, setRemote] = useState<CampusEvent[]>([]);
  const [offline, setOffline] = useState(false);
  const [updatedAt, setUpdatedAt] = useState('');
  const generation = useRef(0);

  const reload = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);
    try {
      const [result, cached] = await Promise.all([eventRepository.list(), cachedRemoteEvents()]);
      if (current !== generation.current) return;
      setEvents(result);
      if (cached) { setRemote(cached.events); setUpdatedAt(cached.updatedAt); }
      if (hasCampusApi()) {
        try {
          const snapshot = await refreshRemoteEvents();
          if (snapshot && current === generation.current) {
            setRemote(snapshot.events);
            setOffline(snapshot.offline);
            setUpdatedAt(snapshot.updatedAt);
          }
        } catch {
          if (current === generation.current) {
            setOffline(true);
            setError('เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กำลังแสดงข้อมูลที่เก็บไว้');
          }
          return;
        }
      }
      if (current !== generation.current) return;
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

  const createEvent = useCallback(async (title: string, startsAt: Date, poiId?: string) => {
    const event = await eventRepository.create(title, startsAt, poiId);
    setEvents((current) => [...current, event]);
    return event;
  }, []);

  const removeEvent = useCallback(async (id: string) => {
    await reminderRepository.cancel(id);
    const removed = await eventRepository.remove(id);
    if (removed) {
      setEvents((current) => current.filter((event) => event.id !== id));
    }
    return removed;
  }, []);

  const allEvents = [...events, ...remote.filter((item) => !events.some((local) => local.id === item.id))];
  return { events: allEvents, loading, error, offline, updatedAt, reload, createEvent, removeEvent };
}
