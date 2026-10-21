import Constants from 'expo-constants';
import { resolveApiUrl } from './apiConfig';
import type { CampusEvent } from '../features/events/types';
import { isCoordinates } from '../types/coordinates';

function apiUrl() {
  return resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, Constants.expoConfig?.hostUri, __DEV__);
}

export function hasCampusApi() {
  return Boolean(apiUrl());
}

export class ApiConnectionError extends Error {}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const unauthorizedListeners = new Set<(token: string) => void>();
export function onUnauthorized(listener: (token: string) => void) {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}

export async function requestJson(path: string, options: RequestInit = {}, token?: string): Promise<unknown> {
  const baseUrl = apiUrl();
  if (!baseUrl) throw new ApiConnectionError('ยังไม่ได้ตั้งค่าการเชื่อมต่อระบบบัญชี');
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort);
  if (options.signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 12000);
  try {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    signal: controller.signal,
    headers: {
      Accept: 'application/json',
      ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401 && token) unauthorizedListeners.forEach(listener => listener(token));
  if (!response.ok) throw new ApiError(response.status, `เซิร์ฟเวอร์ตอบกลับ ${response.status}`);
  return await response.json();
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) throw new ApiConnectionError('เชื่อมต่อเกินเวลา กรุณาตรวจว่า API ยังเปิดอยู่และใช้ Wi-Fi เดียวกัน');
    if (error instanceof TypeError) throw new ApiConnectionError('ติดต่อระบบบัญชีไม่ได้ กรุณาเปิด API และเชื่อมต่อ Wi-Fi เดียวกับคอมพิวเตอร์');
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
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
    typeof event.poiId === 'string' && (event.venue === undefined || isCoordinates(event.venue));
}

export async function fetchCampusEvents(signal?: AbortSignal): Promise<CampusEvent[]> {
  return parseEvents(await requestJson('/events', { signal }));
}

export async function fetchCampusEvent(id: string, signal?: AbortSignal): Promise<CampusEvent> {
  const result = await requestJson(`/events/${encodeURIComponent(id)}`, { signal });
  if (!isCampusEvent(result)) throw new Error('ข้อมูลกิจกรรมจากเซิร์ฟเวอร์ไม่ถูกต้อง');
  return result;
}
