import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, ScrollView, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CampusEvent, deleteEvent, formatEventTime, getEvent, isEventId, isUserCreatedEvent } from '../../src/data/events';
import { pointsOfInterest } from '../../src/data/pointsOfInterest';
import { cancelEventReminder, getReminders, scheduleEventReminder } from '../../src/services/reminders';
import { Action, eventStyles as s } from '../../src/components/EventUI';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const eventId = isEventId(id) ? id : null;
  const [event, setEvent] = useState<CampusEvent>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminders, setReminders] = useState<Notifications.NotificationRequest[]>([]);
  const [permission, setPermission] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const [record, pending, status] = await Promise.all([
        getEvent(eventId), eventId ? getReminders(eventId) : Promise.resolve([]), Notifications.getPermissionsAsync(),
      ]);
      if (current !== generation.current) return;
      setEvent(record); setReminders(pending); setPermission(status.granted ? 'อนุญาตแล้ว' : 'ยังไม่ได้อนุญาต'); setError('');
    } catch { if (current === generation.current) setError('โหลดข้อมูลหรือสถานะการแจ้งเตือนไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { if (current === generation.current) setLoading(false); }
  }, [eventId]);
  useFocusEffect(useCallback(() => { setLoading(true); void refresh(); return () => { generation.current++; }; }, [refresh]));
  useEffect(() => {
    const app = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    const received = Notifications.addNotificationReceivedListener(() => { void refresh(); });
    return () => { app.remove(); received.remove(); };
  }, [refresh]);
  const act = async (mode: 'schedule' | 'test' | 'cancel') => {
    if (!eventId || busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try {
      if (mode === 'cancel') await cancelEventReminder(eventId);
      else await scheduleEventReminder(eventId, mode === 'test');
      Alert.alert(mode === 'cancel' ? 'ยกเลิกการเตือนแล้ว' : 'ตั้งการแจ้งเตือนแล้ว',
        mode === 'test' ? 'รอประมาณ 15 วินาที แล้วแตะ notification เพื่อเปิดหน้านี้' :
        mode === 'schedule' ? 'ระบบจะเตือนก่อนกิจกรรม 30 นาที' : 'ยกเลิกทั้งการเตือนกิจกรรมและการทดสอบของกิจกรรมนี้');
    } catch (e) {
      if (e instanceof Error && e.message === 'notification-permission-denied') {
        Alert.alert('ยังไม่ได้อนุญาตการแจ้งเตือน', 'เปิดการแจ้งเตือนในการตั้งค่า แล้วกลับมากดตั้งเตือนอีกครั้ง', [
          { text: 'ไว้ก่อน', style: 'cancel' }, { text: 'เปิดการตั้งค่า', onPress: () => { void Linking.openSettings().catch(() => Alert.alert('เปิดการตั้งค่าไม่ได้')); } },
        ]);
      } else Alert.alert('ดำเนินการไม่สำเร็จ', e instanceof Error ? e.message : 'กรุณาลองอีกครั้ง');
    } finally { await refresh(); busyRef.current = false; setBusy(false); }
  };
  const removeEvent = () => {
    if (!event || !isUserCreatedEvent(event) || busyRef.current) return;
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
              busyRef.current = true;
              setBusy(true);
              try {
                await cancelEventReminder(event.id).catch(() => undefined);
                await deleteEvent(event.id);
                router.replace('/events');
              } catch (e) {
                Alert.alert('ลบกิจกรรมไม่ได้', e instanceof Error ? e.message : 'กรุณาลองอีกครั้ง');
              } finally {
                busyRef.current = false;
                setBusy(false);
              }
            })();
          },
        },
      ],
    );
  };
  const main = reminders.some(n => n.identifier.endsWith(':main'));
  const test = reminders.some(n => n.identifier.endsWith(':test'));
  const poi = pointsOfInterest.find(p => p.id === event?.poiId);
  return <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
    <ScrollView contentContainerStyle={s.content}>
      {loading ? <Text style={s.text}>กำลังโหลด…</Text> : error ? <View style={s.card}>
        <Text style={s.error}>{error}</Text><Action title="ลองอีกครั้ง" onPress={() => void refresh()} />
      </View> : !event ? <View style={s.card}>
        <Text style={s.title}>ไม่พบกิจกรรม</Text><Text style={s.text}>ลิงก์ไม่ถูกต้อง หรือกิจกรรมนี้ไม่มีอยู่ในเครื่องแล้ว</Text>
      </View> : <>
        <Text style={s.title}>{event.title}</Text>
        <View style={s.card}>
          <Text style={s.subtitle}>{formatEventTime(event.startsAt)}</Text>
          <Text style={s.text}>⌖ {poi?.name}</Text><Text style={s.text}>{poi?.address}</Text>
          <Text style={s.text}>{event.description}</Text>
        </View>
        <View style={s.card}>
          <Text style={s.subtitle}>การแจ้งเตือน</Text>
          <Text style={s.text}>สิทธิ์แจ้งเตือน: {permission}</Text>
          <Text style={s.text}>{main ? '✓ ตั้งเตือนก่อนเริ่ม 30 นาทีแล้ว' : 'ยังไม่มีการเตือนกิจกรรมที่รอส่ง'}</Text>
          {main && <Text style={s.text}>เวลาเตือน: {formatEventTime(new Date(Date.parse(event.startsAt) - 1800000).toISOString())}</Text>}
          {test && <Text style={s.text}>มีการแจ้งเตือนทดสอบรอส่ง</Text>}
          <Action title={busy ? 'กำลังดำเนินการ…' : main ? 'ตั้งเวลาเตือนใหม่' : 'เตือนก่อนกิจกรรม 30 นาที'} disabled={busy} onPress={() => void act('schedule')} />
          <Action title="ยกเลิกการเตือนทั้งหมดของกิจกรรมนี้" disabled={busy || !reminders.length} onPress={() => void act('cancel')} />
        </View>
        <View style={s.card}>
          <Text style={s.subtitle}>ทดลองรับ notification</Text>
          <Text style={s.text}>ส่งการเตือนทดสอบใน 15 วินาที ใช้ทดสอบขณะเปิดแอปหรือกลับไปหน้าจอหลัก ไม่เปลี่ยนเวลาเตือนจริง</Text>
          <Action title="ทดสอบแจ้งเตือนใน 15 วินาที" disabled={busy} onPress={() => void act('test')} />
        </View>
        {isUserCreatedEvent(event) && (
          <View style={s.card}>
            <Text style={s.subtitle}>จัดการกิจกรรม</Text>
            <Text style={s.text}>กิจกรรมนี้สร้างบนเครื่องนี้ จึงสามารถลบออกได้</Text>
            <Action title={busy ? 'กำลังดำเนินการ…' : 'ลบกิจกรรมนี้'} disabled={busy} onPress={removeEvent} />
          </View>
        )}
      </>}
      <Action title="กลับรายการกิจกรรม" onPress={() => router.replace('/events')} />
    </ScrollView>
  </SafeAreaView>;
}
