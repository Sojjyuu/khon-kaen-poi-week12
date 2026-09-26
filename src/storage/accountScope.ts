let owner: string | null = null;
export function setAccountScope(userId: string | null) { owner = userId; }
export function getAccountScope() { return owner; }
export function accountKey(key: string, userId = owner) {
  return `${key}/account/${userId === null ? 'guest' : encodeURIComponent(userId)}`;
}
