export type CampusEvent = {
  id: string;
  title: string;
  startsAt: string;
  poiId: string;
  description: string;
};

export function isEventId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
}

export function isUserCreatedEventId(id: string) {
  return id.startsWith('local-');
}
