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
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Action, eventStyles as styles } from '../../src/components/EventUI';
import { EventCard } from '../../src/features/events/components/EventCard';
import { useEvents } from '../../src/features/events/hooks/useEvents';
import type { CampusEvent } from '../../src/features/events/types';
import { formatEventTime } from '../../src/repositories/eventRepository';
import { logRender } from '../../src/services/performanceLogger';

export default function Events() {
  const { events, loading, error, reload, createEvent } = useEvents();
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState(() => {
    const date = new Date(Date.now() + 3_600_000);
    date.setSeconds(0, 0);
    return date;
  });
  const [picker, setPicker] = useState<'date' | 'time' | null>(null);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  const openEvent = useCallback((id: string) => {
    router.push({ pathname: '/events/[id]', params: { id } });
  }, []);

  const create = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    setBusy(true);
    try {
      const event = await createEvent(title, startsAt);
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
  }, [createEvent, openEvent, startsAt, title]);

  const renderEvent = useCallback(
    ({ item }: { item: CampusEvent }) => (
      <EventCard event={item} onOpen={openEvent} />
    ),
    [openEvent],
  );

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
        style={{ flex: 1 }}
      >
        <Profiler id="EventList" onRender={logRender}>
          <FlatList
            contentContainerStyle={styles.content}
            data={events}
            initialNumToRender={6}
            keyExtractor={(item) => item.id}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            maxToRenderPerBatch={6}
            removeClippedSubviews={Platform.OS === 'android'}
            renderItem={renderEvent}
            windowSize={5}
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            ListEmptyComponent={
              !loading && !error ? (
                <Text accessibilityLiveRegion="polite" style={styles.text}>
                  ยังไม่มีกิจกรรม
                </Text>
              ) : null
            }
            ListHeaderComponent={
              <View style={{ gap: 16, marginBottom: 16 }}>
                <Text accessibilityRole="header" style={styles.title}>
                  นัดพบ แล้วออกสำรวจ
                </Text>
                <Text style={styles.text}>
                  กิจกรรมตัวอย่างสำหรับ Lab 11 • เตือนบนเครื่องนี้ก่อนเริ่ม 30 นาที
                </Text>
                {loading && (
                  <Text accessibilityLiveRegion="polite" style={styles.text}>
                    กำลังโหลดกิจกรรม…
                  </Text>
                )}
                {!!error && (
                  <View accessibilityLiveRegion="assertive" accessibilityRole="alert">
                    <Text style={styles.error}>{error}</Text>
                    <Action title="ลองอีกครั้ง" onPress={() => void reload()} />
                  </View>
                )}
                <View style={styles.card}>
                  <Text accessibilityRole="header" style={styles.subtitle}>
                    สร้างกิจกรรมของคุณ
                  </Text>
                  <Text style={styles.text}>สถานที่: มหาวิทยาลัยขอนแก่น</Text>
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
                  <Action title="เลือกวันที่" disabled={busy} onPress={() => { Keyboard.dismiss(); setPicker('date'); }} />
                  <Action title="เลือกเวลา" disabled={busy} onPress={() => { Keyboard.dismiss(); setPicker('time'); }} />
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
                      {Platform.OS === 'ios' && <Action title="เลือกเสร็จแล้ว" onPress={() => setPicker(null)} />}
                    </View>
                  )}
                  <Text style={styles.text}>
                    หากเริ่มในไม่ถึง 30 นาที จะบันทึกกิจกรรมได้ แต่ตั้งเตือนล่วงหน้า 30 นาทีไม่ได้
                  </Text>
                  <Action title={busy ? 'กำลังบันทึก…' : 'สร้างกิจกรรม'} onPress={() => void create()} disabled={busy} />
                </View>
                <Text accessibilityRole="header" style={styles.subtitle}>
                  รายการกิจกรรม
                </Text>
              </View>
            }
            ListFooterComponent={
              <View style={{ marginTop: 16 }}>
                <Action title="กลับแผนที่ขอนแก่น" onPress={() => router.replace('/')} />
              </View>
            }
          />
        </Profiler>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
