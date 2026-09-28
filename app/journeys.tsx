import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { deleteJourney, listJourneys, type Journey } from '../src/features/journeys/api';
export default function JourneysScreen() {
  const { session } = useSession();
  const token = session.status === 'authenticated' ? session.token : '';
  const [trips, setTrips] = useState<Journey[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useFocusEffect(useCallback(() => {
    if (!token) return;
    const controller = new AbortController();
    setBusy(true); setError('');
    void listJourneys(token, controller.signal).then(items => { if (!controller.signal.aborted) setTrips(items); })
      .catch(() => { if (!controller.signal.aborted) setError('โหลดบันทึกไม่ได้ ตรวจการเชื่อมต่อแล้วลองใหม่'); })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  // A refresh increments revision to restart this focused request.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, revision]));
  return <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}><FlatList
    data={trips} keyExtractor={item => item.id} contentContainerStyle={styles.content}
    refreshing={busy} onRefresh={() => setRevision(value => value + 1)}
    ListHeaderComponent={<View style={{ gap: 12 }}><Text accessibilityRole="header" style={styles.title}>บันทึกการเดินทาง</Text>
      <Text style={styles.text}>เก็บเรื่องราวและรูปของทริปไว้กับบัญชีคุณ</Text>
      <Action title="สร้างบันทึกทริป" onPress={() => router.push('/journey')} />
      {error ? <><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Action title="ลองโหลดใหม่" onPress={() => setRevision(value => value + 1)} /></> : null}
    </View>}
    ListEmptyComponent={busy ? <ActivityIndicator /> : <Text style={styles.text}>ยังไม่มีบันทึกการเดินทาง</Text>}
    renderItem={({ item }) => <View style={styles.card}>
      {item.photo && <Image source={{ uri: item.photo }} style={{ width: '100%', aspectRatio: 1.6, borderRadius: 16 }} accessibilityLabel={`ภาพทริป ${item.title}`} />}
      <Text style={styles.subtitle}>{item.title}</Text><Text style={styles.text}>{item.date} · {item.poiIds.length} สถานที่</Text>
      <Text style={styles.text} numberOfLines={3}>{item.note || 'ยังไม่มีบันทึกข้อความ'}</Text>
      <Action title="อ่าน / แก้ไขทริป" onPress={() => router.push({ pathname: '/journey', params: { id: item.id } })} />
      <Action title="ลบทริป" variant="danger" onPress={() => Alert.alert('ลบทริปนี้?', item.title, [
        { text: 'ยกเลิก', style: 'cancel' }, { text: 'ลบ', style: 'destructive', onPress: () => {
          void deleteJourney(item.id, token).then(() => setRevision(value => value + 1)).catch(() => setError('ลบไม่ได้ กรุณาลองใหม่'));
        } },
      ])} />
    </View>}
  /></SafeAreaView>;
}
