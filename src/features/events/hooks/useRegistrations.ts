import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSession } from '../../auth/session';
import { listRegistrations, type EventRegistration } from '../registration';

export function useRegistrations() {
  const { session } = useSession();
  const token = session.status === 'authenticated' ? session.token : undefined;
  const [items, setItems] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    const controller = new AbortController();
    setItems([]); setError(''); setLoading(true);
    if (!token) { setLoading(false); return () => controller.abort(); }
    void listRegistrations(token, controller.signal).then(value => {
      if (!controller.signal.aborted) setItems(value);
    }).catch(() => {
      if (!controller.signal.aborted) setError('โหลดการลงทะเบียนไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองใหม่');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
    // Revision explicitly requests a fresh server read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, revision]));
  return { items, loading, error, refresh: () => setRevision(value => value + 1) };
}
