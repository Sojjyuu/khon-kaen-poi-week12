import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { listJourneys, saveJourney, type Journey } from '../src/features/journeys/api';
import { chooseAccountPhoto } from '../src/services/accountPhoto';
import { getFavoritePoiIds } from '../src/services/favorites';
import { pointsOfInterest } from '../src/data/pointsOfInterest';
function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
export default function JourneyScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const { session } = useSession();
  const token = session.status === 'authenticated' ? session.token : '';
  const [draft, setDraft] = useState<Journey>(() => ({ id: id || `trip-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, title: '', date: today(), note: '', photo: null, poiIds: [] }));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const load = async () => {
      if (id) {
        const found = (await listJourneys(token, controller.signal)).find(trip => trip.id === id);
        if (!found) throw new Error('ไม่พบบันทึกนี้');
        if (active) setDraft(found);
      } else {
        const poiIds = await getFavoritePoiIds();
        if (active) setDraft(value => ({ ...value, poiIds }));
      }
      if (active) { setReady(true); setError(''); }
    };
    void load().catch(error => { if (active) setError(error instanceof Error ? error.message : 'โหลดไม่ได้'); });
    return () => { active = false; controller.abort(); };
  }, [id, token, revision]);
  const change = (fields: Partial<Journey>) => setDraft(value => ({ ...value, ...fields }));
  async function submit() {
    if (lock.current || !ready) return;
    lock.current = true; setBusy(true); setError('');
    try { await saveJourney(draft, token); router.replace('/journeys'); }
    catch (error) { setError(error instanceof Error ? error.message : 'บันทึกไม่สำเร็จ'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>{id ? 'เรื่องราวของทริป' : 'บันทึกทริปใหม่'}</Text>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {!ready ? <>{error ? <Action title="ลองโหลดใหม่" onPress={() => setRevision(value => value + 1)} /> : <ActivityIndicator />}</> : <>
        <Text style={styles.text}>ชื่อทริป</Text><TextInput accessibilityLabel="ชื่อทริป" value={draft.title} onChangeText={title => change({ title })} maxLength={100} editable={!busy} style={styles.input} />
        <Text style={styles.text}>วันเดินทาง (ค.ศ. ปี-เดือน-วัน)</Text><TextInput accessibilityLabel="วันเดินทาง" value={draft.date} onChangeText={date => change({ date })} placeholder="2026-09-28" maxLength={10} editable={!busy} style={styles.input} />
        <Text style={styles.text}>เรื่องราว / โน้ต</Text><TextInput accessibilityLabel="โน้ตการเดินทาง" multiline value={draft.note} onChangeText={note => change({ note })} maxLength={4000} editable={!busy} style={[styles.input, { minHeight: 120, textAlignVertical: 'top' }]} />
        {draft.photo && <Image source={{ uri: draft.photo }} style={{ width: '100%', aspectRatio: 1.3, borderRadius: 20 }} accessibilityLabel="ภาพการเดินทาง" />}
        <Action title="เลือกรูปทริป" disabled={busy} variant="secondary" onPress={() => {
          if (lock.current) return; lock.current = true; setBusy(true);
          void chooseAccountPhoto(2_000_000).then(photo => { if (photo) change({ photo }); }).catch(error => setError(error instanceof Error ? error.message : 'เลือกรูปไม่ได้')).finally(() => { lock.current = false; setBusy(false); });
        }} />
        {draft.photo && <Action title="นำรูปออก" disabled={busy} variant="secondary" onPress={() => change({ photo: null })} />}
        <Text accessibilityRole="header" style={styles.subtitle}>สถานที่ในทริป</Text>
        <Text style={styles.text}>เริ่มต้นจากรายการสถานที่ที่อยากไป เลือกเพิ่มหรือนำออกได้</Text>
        <View style={{ gap: 8 }}>{pointsOfInterest.map(poi => <Action key={poi.id} disabled={busy} variant={draft.poiIds.includes(poi.id) ? 'primary' : 'secondary'} title={`${draft.poiIds.includes(poi.id) ? '✓ ' : '+ '}${poi.name}`} onPress={() => change({ poiIds: draft.poiIds.includes(poi.id) ? draft.poiIds.filter(value => value !== poi.id) : [...draft.poiIds, poi.id] })} />)}</View>
        <Action title={busy ? 'กำลังบันทึก…' : 'บันทึกทริป'} disabled={busy} onPress={() => void submit()} />
      </>}
    </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
