import { requireAccount } from '../../src/features/auth/requireAccount';
import { Profiler, useCallback, useRef, useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Action, eventStyles as styles } from '../../src/components/EventUI';
import { VenuePicker } from '../../src/components/VenuePicker';
import { EventCard } from '../../src/features/events/components/EventCard';
import { useEvents } from '../../src/features/events/hooks/useEvents';
import type { CampusEvent } from '../../src/features/events/types';
import { formatEventTime } from '../../src/repositories/eventRepository';
import { logRender } from '../../src/services/performanceLogger';
import { useEventFavorites } from '../../src/features/events/FavoritesProvider';
import { pointsOfInterest } from '../../src/data/pointsOfInterest';
import type { Coordinates } from '../../src/types/coordinates';

function EventSeparator() {
  return <View style={{ height: 16 }} />;
}

export default function Events() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 2 : 1;
  const { poiId } = useLocalSearchParams<{ poiId?: string | string[] }>();
  const initialPoi = typeof poiId === 'string' && pointsOfInterest.some((poi) => poi.id === poiId) ? poiId : pointsOfInterest[0].id;
  const {
    events,
    loading,
    error,
    offline,
    updatedAt,
    reload,
    createEvent,
    removeEvent,
  } = useEvents();

  const [title, setTitle] = useState('');
  const [selectedPoiId, setSelectedPoiId] = useState(initialPoi);
  const [selectedVenue, setSelectedVenue] = useState<Coordinates | null>(null);
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date(Date.now() + 3_600_000);
    date.setSeconds(0, 0);
    return date;
  });
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { ids: favoriteIds, toggle } = useEventFavorites();
  const toggleFavorite = useCallback((id: string) => {
    void toggle(id).catch(() => Alert.alert('บันทึกรายการโปรดไม่ได้'));
  }, [toggle]);
  const saving = useRef(false);

  const openEvent = useCallback((id: string) => {
    router.push({ pathname: '/events/[id]', params: { id } });
  }, []);

  const create = useCallback(async () => {
    if (!requireAccount()) return;
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const event = await createEvent(title, startsAt, selectedPoiId, selectedVenue ?? undefined);
      Keyboard.dismiss();
      setTitle('');
      openEvent(event.id);
    } catch (caught) {
      Alert.alert(
        'สร้างกิจกรรมไม่ได้',
        caught instanceof Error ? caught.message : 'กรุณาลองอีกครั้ง',
      );
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }, [createEvent, openEvent, selectedPoiId, selectedVenue, startsAt, title]);

  const confirmDelete = useCallback(
    (event: CampusEvent) => {
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
                  await removeEvent(event.id);
                } catch (caught) {
                  Alert.alert(
                    'ลบกิจกรรมไม่ได้',
                    caught instanceof Error ? caught.message : 'กรุณาลองอีกครั้ง',
                  );
                } finally {
                  setDeletingId(null);
                }
              })();
            },
          },
        ],
      );
    },
    [removeEvent],
  );

  const renderEvent = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <View style={{ flex: 1 }}><EventCard
        deleting={deletingId === item.id}
        event={item}
        onDelete={confirmDelete}
        onOpen={openEvent}
        isFavorite={favoriteIds.includes(item.id)}
        onToggleFavorite={toggleFavorite}
      /></View>
    ),
    [confirmDelete, deletingId, favoriteIds, openEvent, toggleFavorite],
  );

  return (
    <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={{ flex: 1 }}
      >
        <Profiler id="EventList" onRender={logRender}>
          <FlatList
            key={columns}
            numColumns={columns}
            columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
            contentContainerStyle={styles.content}
            data={events}
            refreshing={loading && events.length > 0}
            onRefresh={() => void reload()}
            initialNumToRender={6}
            keyExtractor={(item) => item.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            maxToRenderPerBatch={6}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderEvent}
            windowSize={5}
            ItemSeparatorComponent={EventSeparator}
            ListEmptyComponent={
              !loading && !error ? (
                <View style={styles.card}>
                  <Text accessibilityLiveRegion="polite" style={styles.text}>ยังไม่มีกิจกรรม กรุณาลองโหลดอีกครั้ง</Text>
                  <Action title="ลองโหลดอีกครั้ง" onPress={() => void reload()} />
                </View>
              ) : null
            }
            ListHeaderComponent={
              <View style={{ gap: 16, marginBottom: 16 }}>
                <Text accessibilityRole="header" style={styles.title}>
                  นัดพบ แล้วออกสำรวจ
                </Text>
                <Text style={styles.text}>
                  สร้างกิจกรรม ตั้งเตือนก่อนเริ่ม 30 นาที และจัดการกิจกรรมส่วนตัวบนเครื่องนี้
                </Text>

                {loading && (
                  <Text accessibilityLiveRegion="polite" style={styles.text}>
                    กำลังโหลดกิจกรรม…
                  </Text>
                )}
                {offline && <Text accessibilityRole="alert" style={styles.error}>
                  ออฟไลน์: แสดงข้อมูลที่บันทึกไว้ล่าสุด {updatedAt ? new Date(updatedAt).toLocaleString('th-TH') : ''}
                </Text>}
                <Action title="ดูกิจกรรมที่บันทึก" onPress={() => router.push('/favorites')} />

                {!!error && (
                  <View
                    accessibilityLiveRegion="assertive"
                    accessibilityRole="alert"
                  >
                    <Text style={styles.error}>{error}</Text>
                    <Action title="ลองอีกครั้ง" onPress={() => void reload()} />
                  </View>
                )}

                <View style={styles.card}>
                  <Text accessibilityRole="header" style={styles.subtitle}>
                    สร้างกิจกรรมของคุณ
                  </Text>
                  <Text style={styles.text}>สถานที่: {pointsOfInterest.find((poi) => poi.id === selectedPoiId)?.name}</Text>
                  <FlatList horizontal data={pointsOfInterest} keyExtractor={(poi) => poi.id}
                    renderItem={({ item }) => <View style={{ marginRight: 8 }}><Action
                      title={selectedPoiId === item.id ? `✓ ${item.name}` : item.name}
                      onPress={() => { setSelectedPoiId(item.id); setSelectedVenue(null); }} /></View>} />
                  {(() => {
                    const selected = pointsOfInterest.find((poi) => poi.id === selectedPoiId);
                    if (!selected) return null;
                    const initial = { latitude: selected.latitude, longitude: selected.longitude };
                    return <>
                      <Text style={styles.text}>แตะแผนที่เพื่อย้ายหมุดสถานที่ (ใช้พิกัดของสถานที่ที่เลือกเป็นค่าเริ่มต้น)</Text>
                      <VenuePicker initial={initial} selected={selectedVenue ?? initial} onSelect={setSelectedVenue} />
                      <Text accessibilityLiveRegion="polite" style={styles.text}>
                        พิกัดหมุด: {(selectedVenue ?? initial).latitude.toFixed(5)}, {(selectedVenue ?? initial).longitude.toFixed(5)}
                      </Text>
                    </>;
                  })()}

                  <Text nativeID="event-title-label" style={styles.text}>
                    ชื่อกิจกรรม
                  </Text>
                  <TextInput
                    accessibilityLabel="ชื่อกิจกรรม"
                    accessibilityLabelledBy="event-title-label"
                    maxLength={100}
                    onChangeText={setTitle}
                    onSubmitEditing={() => void create()}
                    placeholder="เช่น เดินสำรวจมหาวิทยาลัย"
                    returnKeyType="done"
                    style={styles.input}
                    value={title}
                  />

                  <Text style={styles.text}>วันและเวลาเริ่มกิจกรรม (เวลาไทย)</Text>
                  <Text accessibilityLiveRegion="polite" style={styles.subtitle}>
                    {formatEventTime(startsAt.toISOString())}
                  </Text>

                  <Action
                    title="เลือกวันที่"
                    disabled={busy}
                    onPress={() => {
                      Keyboard.dismiss();
                      setPicker('date');
                    }}
                  />
                  <Action
                    title="เลือกเวลา"
                    disabled={busy}
                    onPress={() => {
                      Keyboard.dismiss();
                      setPicker('time');
                    }}
                  />

                  {picker && (
                    <View>
                      <DateTimePicker
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        is24Hour
                        mode={picker}
                        onChange={(change, selected) => {
                          if (Platform.OS === 'android') setPicker(null);
                          if (change.type === 'set' && selected) {
                            const next = new Date(selected);
                            next.setSeconds(0, 0);
                            setStartsAt(next);
                          }
                        }}
                        themeVariant="light"
                        timeZoneName="Asia/Bangkok"
                        value={startsAt}
                      />
                      {Platform.OS === 'ios' && (
                        <Action
                          title="เลือกเสร็จแล้ว"
                          onPress={() => setPicker(null)}
                        />
                      )}
                    </View>
                  )}

                  <Text style={styles.text}>
                    หากเริ่มในไม่ถึง 30 นาที จะบันทึกกิจกรรมได้ แต่ตั้งเตือนล่วงหน้า 30 นาทีไม่ได้
                  </Text>
                  <Action
                    title={busy ? 'กำลังบันทึก…' : 'สร้างกิจกรรม'}
                    onPress={() => void create()}
                    disabled={busy}
                  />
                </View>

                <Text accessibilityRole="header" style={styles.subtitle}>
                  รายการกิจกรรม
                </Text>
              </View>
            }
            ListFooterComponent={
              <View style={{ marginTop: 16 }}>
                <Action
                  title="กลับแผนที่ขอนแก่น"
                  onPress={() => router.replace('/')}
                />
              </View>
            }
          />
        </Profiler>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
