import AsyncStorage from '@react-native-async-storage/async-storage';
import { pointsOfInterest } from './pointsOfInterest';

export type CampusEvent = {
  id: string;
  title: string;
  startsAt: string;
  poiId: string;
  description: string;
};
const KEY = 'khonkaen.events.v1';
let initialization: Promise<CampusEvent[]> | undefined;

export function isEventId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

export function getEvents(): Promise<CampusEvent[]> {
  if (!initialization) {
    initialization = (async () => {
      const saved = await AsyncStorage.getItem(KEY);
      if (saved !== null) {
        const parsed: unknown = JSON.parse(saved);
        if (!Array.isArray(parsed) || !parsed.every((e) =>
          e && isEventId(e.id) && typeof e.title === 'string' &&
          typeof e.description === 'string' && typeof e.startsAt === 'string' &&
          Number.isFinite(Date.parse(e.startsAt)) && pointsOfInterest.some(p => p.id === e.poiId))) {
          throw new Error('ข้อมูลกิจกรรมในเครื่องไม่ถูกต้อง');
        }
        return parsed as CampusEvent[];
      }
      // Seed once, then persist absolute instants so restarting never moves reminders.
      const events = pointsOfInterest.slice(0, 3).map((poi, index) => ({
        id: `explore-${poi.id}`,
        title: `เดินสำรวจ${poi.name}`,
        poiId: poi.id,
        startsAt: new Date(Date.now() + (index + 1) * 86400000).toISOString(),
        description: 'กิจกรรมตัวอย่างสำหรับ Lab 11 ไม่ใช่กำหนดการจริงของสถานที่ นัดพบและเดินสำรวจจุดสำคัญด้วยกัน',
      }));
      await AsyncStorage.setItem(KEY, JSON.stringify(events));
      return events;
    })().catch(error => { initialization = undefined; throw error; });
  }
  return initialization;
}

export async function getEvent(id: unknown) {
  if (!isEventId(id)) return undefined;
  return (await getEvents()).find(event => event.id === id);
}

export async function addEvent(title: string, startsAt: Date) {
  if (!title.trim() || title.trim().length > 100) {
    throw new Error('กรอกชื่อกิจกรรม 1–100 ตัวอักษร');
  }
  if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
    throw new Error('กรุณาเลือกวันและเวลาเริ่มกิจกรรมในอนาคต');
  }
  const events = await getEvents();
  const event: CampusEvent = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    startsAt: startsAt.toISOString(),
    poiId: pointsOfInterest[0].id,
    description: 'กิจกรรมส่วนตัวที่สร้างบนเครื่องนี้',
  };
  const next = [...events, event];
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  initialization = Promise.resolve(next);
  return event;
}

export function isUserCreatedEvent(event: Pick<CampusEvent, 'id'> | string) {
  const id = typeof event === 'string' ? event : event.id;
  return id.startsWith('local-');
}

export async function deleteEvent(id: unknown) {
  if (!isEventId(id)) {
    throw new Error('รหัสกิจกรรมไม่ถูกต้อง');
  }
  if (!isUserCreatedEvent(id)) {
    throw new Error('ลบได้เฉพาะกิจกรรมที่สร้างเอง');
  }

  const events = await getEvents();
  const exists = events.some(event => event.id === id);
  if (!exists) return false;

  const next = events.filter(event => event.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  initialization = Promise.resolve(next);
  return true;
}

export function formatEventTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }) + ' น. (เวลาไทย)';
}
