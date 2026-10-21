// Derive only a LAN endpoint. Public Expo tunnel hosts do not expose the API port.
export function resolveApiUrl(configured: string | undefined, hostUri: string | null | undefined, development: boolean): string {
  if (configured?.trim()) {
    try {
      const url = new URL(configured.trim());
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
      return url.toString().replace(/\/$/, '');
    } catch { return ''; }
  }
  if (!development || !hostUri) return '';
  try {
    const host = new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
    const parts = host.split('.').map(Number);
    const ipv4 = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255);
    const local = host === 'localhost' || (ipv4 && (parts[0] === 10 || parts[0] === 127 ||
      (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)));
    return local ? `http://${host}:4100` : '';
  } catch { return ''; }
}
