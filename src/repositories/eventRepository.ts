import { pointsOfInterest } from '../data/pointsOfInterest';
import { isEventId, type CampusEvent } from '../features/events/types';
import { eventStorage, type EventStorage } from '../storage/eventStorage';

function isCampusEvent(value: unknown): value is CampusEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<CampusEvent>;
  return (
    isEventId(event.id) &&
    typeof event.title === 'string' &&
    typeof event.description === 'string' &&
    typeof event.startsAt === 'string' &&
    Number.isFinite(Date.parse(event.startsAt)) &&
    pointsOfInterest.some((poi) => poi.id === event.poiId)
  );
}

export function createEventRepository(storage: EventStorage = eventStorage) {
  let cache: Promise<CampusEvent[]> | undefined;

  async function load(): Promise<CampusEvent[]> {
    if (!cache) {
      cache = (async () => {
        const saved = await storage.read();
        if (saved !== null) {
          if (!Array.isArray(saved) || !saved.every(isCampusEvent)) {
            throw new Error('ข้อมูลกิจกรรมในเครื่องไม่ถูกต้อง');
          }
          return saved;
        }

        const seeded = pointsOfInterest.slice(0, 3).map((poi, index) => ({
          id: `explore-${poi.id}`,
          title: `เดินสำรวจ${poi.name}`,
          poiId: poi.id,
          startsAt: new Date(Date.now() + (index + 1) * 86_400_000).toISOString(),
          description:
            'กิจกรรมตัวอย่างสำหรับ Lab 11 ไม่ใช่กำหนดการจริงของสถานที่ นัดพบและเดินสำรวจจุดสำคัญด้วยกัน',
        }));
        await storage.write(seeded);
        return seeded;
      })().catch((error) => {
        cache = undefined;
        throw error;
      });
    }
    return cache;
  }

  return {
    list: load,

    async findById(id: unknown): Promise<CampusEvent | undefined> {
      if (!isEventId(id)) return undefined;
      return (await load()).find((event) => event.id === id);
    },

    async create(title: string, startsAt: Date): Promise<CampusEvent> {
      if (!title.trim() || title.trim().length > 100) {
        throw new Error('กรอกชื่อกิจกรรม 1–100 ตัวอักษร');
      }
      if (!Number.isFinite(startsAt.getTime()) || startsAt.getTime() <= Date.now()) {
        throw new Error('กรุณาเลือกวันและเวลาเริ่มกิจกรรมในอนาคต');
      }

      const events = await load();
      const event: CampusEvent = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title.trim(),
        startsAt: startsAt.toISOString(),
        poiId: pointsOfInterest[0].id,
        description: 'กิจกรรมส่วนตัวที่สร้างบนเครื่องนี้',
      };
      const next = [...events, event];
      await storage.write(next);
      cache = Promise.resolve(next);
      return event;
    },
  };
}

export const eventRepository = createEventRepository();

export function formatEventTime(iso: string) {
  return (
    new Date(iso).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' น. (เวลาไทย)'
  );
}
