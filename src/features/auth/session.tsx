import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AppState } from 'react-native';
import { setAccountScope } from '../../storage/accountScope';
import { ApiError, onUnauthorized, requestJson } from '../../services/campusApi';

const KEY = 'khonkaen/session-token';
type User = { id: string; name: string; email?: string };
type Session = { status: 'loading' | 'anonymous' } | { status: 'authenticated'; token: string; user: User };
type SessionContext = {
  session: Session;
  login(email: string, password: string): Promise<void>;
  signup(name: string, email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  updateProfile(name: string): Promise<void>;
};
const Context = createContext<SessionContext | null>(null);

function isUser(value: unknown): value is User {
  return !!value && typeof value === 'object' &&
    typeof (value as User).id === 'string' && typeof (value as User).name === 'string';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  const currentToken = useRef<string | null>(null);
  const publish = useCallback((next: Session) => {
    currentToken.current = next.status === 'authenticated' ? next.token : null;
    setAccountScope(next.status === 'authenticated' ? next.user.id : null);
    setSession(next);
  }, []);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(KEY);
        if (!token) { if (active) publish({ status: 'anonymous' }); return; }
        const user = await requestJson('/auth/me', { signal: controller.signal }, token);
        if (!isUser(user)) throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง');
        if (active) publish({ status: 'authenticated', token, user });
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) await SecureStore.deleteItemAsync(KEY).catch(() => undefined);
        if (active) publish({ status: 'anonymous' });
      } finally { clearTimeout(timer); }
    })();
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [publish]);
  const authenticate = useCallback(async (path: string, fields: Record<string, string>) => {
    const result = await requestJson(path, { method: 'POST', body: JSON.stringify(fields) });
    if (!result || typeof result !== 'object') throw new Error('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
    const { accessToken, user } = result as { accessToken?: unknown; user?: unknown };
    if (typeof accessToken !== 'string' || !isUser(user)) throw new Error('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
    await SecureStore.setItemAsync(KEY, accessToken);
    publish({ status: 'authenticated', token: accessToken, user });
  }, [publish]);
  const login = useCallback((email: string, password: string) => authenticate('/auth/login', { email, password }), [authenticate]);
  const signup = useCallback((name: string, email: string, password: string) => authenticate('/auth/register', { name, email, password }), [authenticate]);
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY);
    const token = session.status === 'authenticated' ? session.token : undefined;
    publish({ status: 'anonymous' });
    if (token) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try { await requestJson('/auth/logout', { method: 'POST', body: '{}', signal: controller.signal }, token); }
      catch { /* Local logout succeeds offline; server session expires automatically. */ }
      finally { clearTimeout(timer); }
    }
  }, [session, publish]);
  useEffect(() => {
    if (session.status !== 'authenticated') return;
    const unsubscribe = onUnauthorized((token) => {
      if (token !== session.token) return;
      publish({ status: 'anonymous' });
      void SecureStore.deleteItemAsync(KEY).catch(() => undefined);
    });
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void requestJson('/auth/me', {}, session.token).catch(() => undefined);
    });
    return () => { unsubscribe(); subscription.remove(); };
  }, [session, publish]);
  const updateProfile = useCallback(async (name: string) => {
    if (session.status !== 'authenticated') throw new Error('กรุณาเข้าสู่ระบบ');
    const user = await requestJson('/auth/profile', { method: 'POST', body: JSON.stringify({ name }) }, session.token);
    if (!isUser(user)) throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง');
    if (currentToken.current === session.token) publish({ ...session, user });
  }, [session, publish]);
  const value = useMemo(() => ({ session, login, signup, logout, updateProfile }), [session, login, signup, logout, updateProfile]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider is required');
  return value;
}
