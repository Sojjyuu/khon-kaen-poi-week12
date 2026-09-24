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

export type PhotoDraft = { uri: string; mimeType?: string | null; fileSize?: number; fileName?: string | null };

function photoType(photo: PhotoDraft): string | null {
  if (photo.mimeType) return photo.mimeType.toLowerCase();
  const name = photo.fileName ?? photo.uri.split('?')[0];
  if (/\.jpe?g$/i.test(name)) return 'image/jpeg';
  if (/\.png$/i.test(name)) return 'image/png';
  return null;
}

export function validatePhoto(photo: PhotoDraft): string | null {
  if (!['image/jpeg', 'image/png'].includes(photoType(photo) ?? '')) return 'เลือกรูป JPEG หรือ PNG เท่านั้น';
  if (photo.fileSize !== undefined && (photo.fileSize === 0 || photo.fileSize > 3_000_000)) return 'เลือกรูปขนาดไม่เกิน 3 MB';
  return null;
}

export async function uploadRegistrationPhoto(eventId: string, registrationId: string, photo: PhotoDraft, token: string) {
  const error = validatePhoto(photo);
  if (error) throw new Error(error);
  const body = new FormData();
  body.append('photo', {
    uri: photo.uri,
    name: photo.fileName ?? 'event-photo.jpg',
    type: photoType(photo),
  } as unknown as Blob);
  return requestJson(`/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(registrationId)}/photo`, {
    method: 'POST', body,
  }, token);
}
