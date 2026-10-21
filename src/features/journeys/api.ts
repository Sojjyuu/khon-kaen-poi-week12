import { requestJson } from '../../services/campusApi';
export type Journey = { id: string; title: string; date: string; note: string; photo: string | null; poiIds: string[] };
export function validJourney(value: unknown): value is Journey {
  if (!value || typeof value !== 'object') return false;
  const item = value as Journey;
  return typeof item.id === 'string' && typeof item.title === 'string' && typeof item.note === 'string' &&
    typeof item.date === 'string' && Array.isArray(item.poiIds) && item.poiIds.every(id => typeof id === 'string') &&
    (item.photo === null || (typeof item.photo === 'string' && /^data:image\/(jpeg|png);base64,/.test(item.photo)));
}
export function validateJourneyForm(title: string, date: string) {
  if (!title.trim() || title.length > 100) return 'กรอกชื่อทริป 1–100 ตัวอักษร';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) return 'กรอกวันที่ ค.ศ. ที่มีอยู่จริง เช่น 2026-09-28';
  return null;
}
export async function listJourneys(token: string, signal?: AbortSignal) {
  const data = await requestJson('/journeys', { signal }, token);
  if (!Array.isArray(data) || !data.every(validJourney)) throw new Error('ข้อมูลบันทึกการเดินทางไม่ถูกต้อง');
  return data;
}
export async function saveJourney(trip: Journey, token: string) {
  const error = validateJourneyForm(trip.title, trip.date);
  if (error) throw new Error(error);
  const data = await requestJson(`/journeys/${encodeURIComponent(trip.id)}`, { method: 'PUT', body: JSON.stringify(trip) }, token);
  if (!validJourney(data)) throw new Error('ข้อมูลบันทึกการเดินทางไม่ถูกต้อง');
  return data;
}
export async function deleteJourney(id: string, token: string) {
  await requestJson(`/journeys/${encodeURIComponent(id)}`, { method: 'DELETE' }, token);
}
