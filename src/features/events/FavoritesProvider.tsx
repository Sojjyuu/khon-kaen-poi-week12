import { requireAccount } from '../auth/requireAccount';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadEventFavorites, toggleEventFavorite } from './eventFavorites';

type FavoritesContext = { ids: string[]; ready: boolean; toggle(id: string): Promise<void> };
const Context = createContext<FavoritesContext | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    void loadEventFavorites().then((stored) => {
      if (active) { setIds(stored); setReady(true); }
    }).catch(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const toggle = useCallback(async (id: string) => {
    if (!requireAccount()) return;
    const updated = await toggleEventFavorite(id);
    setIds(updated);
  }, []);
  const value = useMemo(() => ({ ids, ready, toggle }), [ids, ready, toggle]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useEventFavorites() {
  const value = useContext(Context);
  if (!value) throw new Error('FavoritesProvider is required');
  return value;
}
