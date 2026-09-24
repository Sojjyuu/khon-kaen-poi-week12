import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { ApiError, requestJson } from '../../services/campusApi';

const KEY = 'khonkaen/session-token';
type User = { id: string; name: string };
type Session = { status: 'loading' | 'anonymous' } | { status: 'authenticated'; token: string; user: User };
type SessionContext = {
  session: Session;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
};
const Context = createContext<SessionContext | null>(null);

function isUser(value: unknown): value is User {
  return !!value && typeof value === 'object' &&
    typeof (value as User).id === 'string' && typeof (value as User).name === 'string';
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(KEY);
        if (!token) { if (active) setSession({ status: 'anonymous' }); return; }
        const user = await requestJson('/auth/me', {}, token);
        if (!isUser(user)) throw new Error('ข้อมูลผู้ใช้ไม่ถูกต้อง');
        if (active) setSession({ status: 'authenticated', token, user });
      } catch (error) {
        if (error instanceof ApiError && [401, 403].includes(error.status)) await SecureStore.deleteItemAsync(KEY);
        if (active) setSession({ status: 'anonymous' });
      }
    })();
    return () => { active = false; };
  }, []);
  const login = useCallback(async (email: string, password: string) => {
    const result = await requestJson('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (!result || typeof result !== 'object') throw new Error('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
    const { accessToken, user } = result as { accessToken?: unknown; user?: unknown };
    if (typeof accessToken !== 'string' || !isUser(user)) throw new Error('ข้อมูลเข้าสู่ระบบไม่ถูกต้อง');
    await SecureStore.setItemAsync(KEY, accessToken);
    setSession({ status: 'authenticated', token: accessToken, user });
  }, []);
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(KEY);
    setSession({ status: 'anonymous' });
  }, []);
  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error('SessionProvider is required');
  return value;
}
