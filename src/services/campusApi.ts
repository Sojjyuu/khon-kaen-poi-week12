import type { CampusEvent } from '../features/events/types';

const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');

export function hasCampusApi() {
  return Boolean(baseUrl);
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requestJson(path: string, options: RequestInit = {}, token?: string): Promise<unknown> {
  if (!baseUrl) throw new Error('ยังไม่ได้ตั้งค่า EXPO_PUBLIC_API_URL');
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!response.ok) throw new ApiError(response.status, `เซิร์ฟเวอร์ตอบกลับ ${response.status}`);
  return response.json();
}

export function parseEvents(payload: unknown): CampusEvent[] {
  if (!Array.isArray(payload) || !payload.every(isCampusEvent)) {
    throw new Error('ข้อมูลกิจกรรมจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  }
  return payload;
}

export function isCampusEvent(value: unknown): value is CampusEvent {
  if (typeof value !== 'object' || value === null) return false;
  const event = value as Record<string, unknown>;
  return typeof event.id === 'string' && /^[\w-]{1,80}$/.test(event.id) &&
    typeof event.title === 'string' && typeof event.description === 'string' &&
    typeof event.startsAt === 'string' && Number.isFinite(Date.parse(event.startsAt)) &&
    typeof event.poiId === 'string';
}

export async function fetchCampusEvents(signal?: AbortSignal): Promise<CampusEvent[]> {
  return parseEvents(await requestJson('/events', { signal }));
}

export async function fetchCampusEvent(id: string, signal?: AbortSignal): Promise<CampusEvent> {
  const result = await requestJson(`/events/${encodeURIComponent(id)}`, { signal });
  if (!isCampusEvent(result)) throw new Error('ข้อมูลกิจกรรมจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  return result;
}
