import { requestJson } from '../../services/campusApi';

export function validateRegistration(fullName: string, email: string): string | null {
  if (!fullName.trim()) return 'กรุณากรอกชื่อ';
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) return 'อีเมลไม่ถูกต้อง';
  return null;
}

export async function registerForEvent(eventId: string, fullName: string, email: string, token: string) {
  const error = validateRegistration(fullName, email);
  if (error) throw new Error(error);
  return requestJson(`/events/${encodeURIComponent(eventId)}/registrations`, {
    method: 'POST',
    body: JSON.stringify({ fullName: fullName.trim(), email: email.trim() }),
  }, token);
}
