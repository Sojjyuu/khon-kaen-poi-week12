import { useCallback, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addEvent, CampusEvent, deleteEvent, formatEventTime, getEvents, isUserCreatedEvent } from '../../src/data/events';
import { pointsOfInterest } from '../../src/data/pointsOfInterest';
import { Action, eventStyles as s } from '../../src/components/EventUI';
import { cancelEventReminder } from '../../src/services/reminders';

export default function Events() {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date(Date.now() + 3600000);
    date.setSeconds(0, 0);
    return date;
  });
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    getEvents().then(result => { setEvents(result); setError(''); })
      .catch(() => setError('อ่านข้อมูลกิจกรรมไม่ได้ กรุณาลองอีกครั้ง'))
      .finally(() => setLoading(false));
  }, []);
  useFocusEffect(load);
  const create = async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const event = await addEvent(title, startsAt);
      Keyboard.dismiss(); setTitle('');
      router.push({ pathname: '/events/[id]', params: { id: event.id } });
    } catch (e) { Alert.alert('สร้างกิจกรรมไม่ได้', e instanceof Error ? e.message : 'กรุณาลองอีกครั้ง'); }
    finally { saving.current = false; setBusy(false); }
  };
  const remove = (event: CampusEvent) => {
    if (!isUserCreatedEvent(event)) return;
    Alert.alert(
      'ลบกิจกรรมนี้?',
      `“${event.title}” จะถูกลบออกจากเครื่อง และการแจ้งเตือนของกิจกรรมนี้จะถูกยกเลิกด้วย`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบกิจกรรม',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setDeletingId(event.id);
              try {
                await cancelEventReminder(event.id).catch(() => undefined);
                await deleteEvent(event.id);
                load();
              } catch (e) {
                Alert.alert('ลบกิจกรรมไม่ได้', e instanceof Error ? e.message : 'กรุณาลองอีกครั้ง');
              } finally {
                setDeletingId(null);
              }
            })();
          },
        },
      ],
    );
  };
  return <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={100}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Text style={s.title}>นัดพบ แล้วออกสำรวจ</Text>
        <Text style={s.text}>กิจกรรมตัวอย่างสำหรับ Lab 11 • เตือนบนเครื่องนี้ก่อนเริ่ม 30 นาที</Text>
        {loading && <Text style={s.text}>กำลังโหลดกิจกรรม…</Text>}
        {!!error && <View><Text style={s.error}>{error}</Text><Action title="ลองอีกครั้ง" onPress={load} /></View>}
        <View style={s.card}>
          <Text style={s.subtitle}>สร้างกิจกรรมของคุณ</Text>
          <Text style={s.text}>สถานที่: มหาวิทยาลัยขอนแก่น</Text>
          <Text style={s.text}>ชื่อกิจกรรม</Text>
          <TextInput accessibilityLabel="ชื่อกิจกรรม" style={s.input} value={title} onChangeText={setTitle} maxLength={100} placeholder="เช่น เดินสำรวจมหาวิทยาลัย" />
          <Text style={s.text}>วันและเวลาเริ่มกิจกรรม (เวลาไทย)</Text>
          <Text style={s.subtitle}>{formatEventTime(startsAt.toISOString())}</Text>
          <Action title="เลือกวันที่" disabled={busy} onPress={() => { Keyboard.dismiss(); setPicker('date'); }} />
          <Action title="เลือกเวลา" disabled={busy} onPress={() => { Keyboard.dismiss(); setPicker('time'); }} />
          {picker && <View>
            <DateTimePicker value={startsAt} mode={picker} display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              timeZoneName="Asia/Bangkok" is24Hour themeVariant="light"
              onChange={(change, selected) => {
                if (Platform.OS === 'android') setPicker(null);
                if (change.type === 'set' && selected) {
                  const next = new Date(selected);
                  next.setSeconds(0, 0);
                  setStartsAt(next);
                }
              }} />
            {Platform.OS === 'ios' && <Action title="เลือกเสร็จแล้ว" onPress={() => setPicker(null)} />}
          </View>}
          <Text style={s.text}>บันทึกแล้วกดตั้งเตือนในหน้ารายละเอียด หากเริ่มในไม่ถึง 30 นาที จะบันทึกกิจกรรมได้แต่ตั้งเตือนล่วงหน้า 30 นาทีไม่ได้</Text>
          <Action title={busy ? 'กำลังบันทึก…' : 'สร้างกิจกรรม'} onPress={() => void create()} disabled={busy} />
        </View>
        <Text style={s.subtitle}>รายการกิจกรรม</Text>
        {events.map(event => <View key={event.id} style={s.card}>
          {isUserCreatedEvent(event) && <Text style={s.text}>★ กิจกรรมของคุณ • ลบได้</Text>}
          <Text style={s.subtitle}>{event.title}</Text>
          <Text style={s.text}>{formatEventTime(event.startsAt)}</Text>
          <Text style={s.text}>⌖ {pointsOfInterest.find(p => p.id === event.poiId)?.name}</Text>
          <Action title="ดูรายละเอียด / ตั้งเตือน" onPress={() => router.push({ pathname: '/events/[id]', params: { id: event.id } })} />
          {isUserCreatedEvent(event) && (
            <Action
              title={deletingId === event.id ? 'กำลังลบ…' : 'ลบกิจกรรมนี้'}
              disabled={deletingId === event.id}
              onPress={() => remove(event)}
            />
          )}
        </View>)}
        <Action title="กลับแผนที่ขอนแก่น" onPress={() => router.replace('/')} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
