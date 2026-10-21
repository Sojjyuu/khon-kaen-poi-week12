let owner: string | null = null;
export function setAccountScope(userId: string | null) { owner = userId; }
export function getAccountScope() { return owner; }
export function accountKey(key: string, userId = owner) {
  return `${key}/account/${userId === null ? 'guest' : encodeURIComponent(userId)}`;
}

const transitions = new Set<(next: string | null) => Promise<void>>();
export function registerAccountTransition(handler: (next: string | null) => Promise<void>) {
  transitions.add(handler);
  return () => transitions.delete(handler);
}
export async function prepareAccountChange(next: string | null) {
  await Promise.all([...transitions].map((handler) => handler(next)));
}
