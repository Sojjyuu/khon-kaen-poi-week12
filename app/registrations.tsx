import { useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { CoverPhoto } from '../src/components/CoverPhoto';
import { useSession } from '../src/features/auth/session';
import { useRegistrations } from '../src/features/events/hooks/useRegistrations';
import { cancelRegistration } from '../src/features/events/registration';
import { formatEventTime } from '../src/repositories/eventRepository';

export default function Registrations() {
  const { session } = useSession();
  const { items, loading, error, refresh } = useRegistrations();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const cancel = (eventId: string) => Alert.alert('ยกเลิกการลงทะเบียน?', 'รายการนี้จะถูกนำออกจากกิจกรรมที่ลงทะเบียนแล้ว โดยรายการโปรดและการตั้งเตือนยังคงเดิม', [
    { text: 'กลับ', style: 'cancel' },
    { text: 'ยืนยันยกเลิก', style: 'destructive', onPress: () => {
      if (session.status !== 'authenticated' || busy) return;
      setBusy(true); setCancelError('');
      void cancelRegistration(eventId, session.token).then(refresh).catch(() => setCancelError('ยกเลิกไม่สำเร็จ กรุณาลองอีกครั้ง')).finally(() => setBusy(false));
    } },
  ]);
  return <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
    <FlatList data={items} keyExtractor={item => item.id} contentContainerStyle={styles.content}
      refreshing={loading} onRefresh={refresh}
      ListHeaderComponent={<><Text accessibilityRole="header" style={styles.title}>กิจกรรมที่ลงทะเบียนแล้ว</Text><Text style={styles.text}>รายการเข้าร่วมของบัญชีคุณ แยกจากกิจกรรมโปรด</Text>{!!cancelError && <Text accessibilityRole="alert" style={styles.error}>{cancelError}</Text>}</>}
      ListEmptyComponent={<><Text accessibilityRole={error ? 'alert' : 'text'} style={styles.text}>{loading ? 'กำลังโหลด…' : error || 'ยังไม่ได้ลงทะเบียนเข้าร่วมกิจกรรม'}</Text>{error ? <Action title="ลองใหม่" onPress={refresh} /> : !loading && <Action title="เลือกกิจกรรม" onPress={() => router.push('/events')} />}</>}
      renderItem={({ item }) => <View style={styles.card}>
        {item.event && <CoverPhoto poiId={item.event.poiId} title={item.event.title} height={160} />}
        <Text accessibilityRole="header" style={styles.subtitle}>{item.event?.title ?? 'กิจกรรมเดิมที่ไม่มีรายละเอียดแล้ว'}</Text>
        <Text style={styles.text}>ลงทะเบียนแล้ว</Text>
        {item.event && <Text style={styles.text}>{formatEventTime(item.event.startsAt)}</Text>}
        <Action title={expanded === item.id ? 'ซ่อนรายละเอียด' : 'ดูรายละเอียดการลงทะเบียน'} onPress={() => setExpanded(expanded === item.id ? null : item.id)} />
        {expanded === item.id && <><Text style={styles.text}>{item.event?.description ?? 'ไม่พบรายละเอียดกิจกรรมเดิม แต่การลงทะเบียนยังอยู่'}</Text><Text selectable style={styles.text}>รหัสลงทะเบียน: {item.id}</Text></>}
        <Action title="ยกเลิกการลงทะเบียน" disabled={busy} onPress={() => cancel(item.eventId)} />
      </View>} />
  </SafeAreaView>;
}
