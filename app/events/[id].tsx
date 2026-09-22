import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  findNodeHandle,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Action, eventStyles as styles } from '../../src/components/EventUI';
import { pointsOfInterest } from '../../src/data/pointsOfInterest';
import { useEventDetail } from '../../src/features/events/hooks/useEventDetail';
import {
  isEventId,
  isUserCreatedEventId,
} from '../../src/features/events/types';
import { formatEventTime } from '../../src/repositories/eventRepository';

export default function EventDetail() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const eventId = isEventId(id) ? id : null;
  const {
    event,
    reminders,
    loading,
    error,
    refresh,
    schedule,
    cancel,
    remove,
    openSettings,
  } = useEventDetail(eventId);

  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const statusRef = useRef<Text>(null);

  useEffect(() => {
    if (loading || (event && !error)) return;
    const timer = setTimeout(() => {
      const node = findNodeHandle(statusRef.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 150);
    return () => clearTimeout(timer);
  }, [error, event, loading]);

  const act = async (mode: 'schedule' | 'test' | 'cancel') => {
    if (!eventId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      if (mode === 'cancel') await cancel();
      else await schedule(mode === 'test');

      Alert.alert(
        mode === 'cancel' ? 'ยกเลิกการเตือนแล้ว' : 'ตั้งการแจ้งเตือนแล้ว',
        mode === 'test'
          ? 'รอประมาณ 15 วินาที แล้วแตะ notification เพื่อเปิดหน้านี้'
          : mode === 'schedule'
            ? 'ระบบจะเตือนก่อนกิจกรรม 30 นาที'
            : 'ยกเลิกทั้งการเตือนกิจกรรมและการทดสอบของกิจกรรมนี้',
      );
    } catch (caught) {
      if (
        caught instanceof Error &&
        caught.message === 'notification-permission-denied'
      ) {
        Alert.alert(
          'ยังไม่ได้อนุญาตการแจ้งเตือน',
          'เปิดการแจ้งเตือนในการตั้งค่า แล้วกลับมากดตั้งเตือนอีกครั้ง',
          [
            { text: 'ไว้ก่อน', style: 'cancel' },
            {
              text: 'เปิดการตั้งค่า',
              onPress: () => {
                void openSettings().catch(() =>
                  Alert.alert('เปิดการตั้งค่าไม่ได้'),
                );
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'ดำเนินการไม่สำเร็จ',
          caught instanceof Error ? caught.message : 'กรุณาลองอีกครั้ง',
        );
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const confirmDelete = () => {
    if (!event || !isUserCreatedEventId(event.id) || busyRef.current) return;
    Alert.alert(
      'ลบกิจกรรมนี้?',
      `“${event.title}” จะถูกลบออกจากเครื่อง และการแจ้งเตือนจะถูกยกเลิกด้วย`,
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
                await remove();
                router.replace('/events');
              } catch (caught) {
                Alert.alert(
                  'ลบกิจกรรมไม่ได้',
                  caught instanceof Error ? caught.message : 'กรุณาลองอีกครั้ง',
                );
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

  const poi = pointsOfInterest.find((item) => item.id === event?.poiId);

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <Text accessibilityLiveRegion="polite" style={styles.text}>
            กำลังโหลด…
          </Text>
        ) : error ? (
          <View style={styles.card}>
            <Text
              ref={statusRef}
              accessibilityLiveRegion="assertive"
              accessibilityRole="alert"
              style={styles.error}
            >
              {error}
            </Text>
            <Action title="ลองอีกครั้ง" onPress={() => void refresh()} />
          </View>
        ) : !event ? (
          <View style={styles.card}>
            <Text
              ref={statusRef}
              accessibilityLiveRegion="assertive"
              accessibilityRole="header"
              style={styles.title}
            >
              ไม่พบกิจกรรม
            </Text>
            <Text style={styles.text}>
              ลิงก์ไม่ถูกต้อง หรือกิจกรรมนี้ไม่มีอยู่ในเครื่องแล้ว
            </Text>
          </View>
        ) : (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {event.title}
            </Text>

            <View style={styles.card}>
              <Text style={styles.subtitle}>{formatEventTime(event.startsAt)}</Text>
              <Text style={styles.text}>⌖ {poi?.name}</Text>
              <Text style={styles.text}>{poi?.address}</Text>
              <Text style={styles.text}>{event.description}</Text>
            </View>

            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.subtitle}>
                การแจ้งเตือน
              </Text>
              <Text style={styles.text}>
                สิทธิ์แจ้งเตือน:{' '}
                {reminders.permissionGranted ? 'อนุญาตแล้ว' : 'ยังไม่ได้อนุญาต'}
              </Text>
              <Text accessibilityLiveRegion="polite" style={styles.text}>
                {reminders.mainScheduled
                  ? '✓ ตั้งเตือนก่อนเริ่ม 30 นาทีแล้ว'
                  : 'ยังไม่มีการเตือนกิจกรรมที่รอส่ง'}
              </Text>

              {reminders.mainScheduled && (
                <Text style={styles.text}>
                  เวลาเตือน:{' '}
                  {formatEventTime(
                    new Date(
                      Date.parse(event.startsAt) - 1_800_000,
                    ).toISOString(),
                  )}
                </Text>
              )}

              {reminders.testScheduled && (
                <Text style={styles.text}>มีการแจ้งเตือนทดสอบรอส่ง</Text>
              )}

              <Action
                title={
                  busy
                    ? 'กำลังดำเนินการ…'
                    : reminders.mainScheduled
                      ? 'ตั้งเวลาเตือนใหม่'
                      : 'เตือนก่อนกิจกรรม 30 นาที'
                }
                disabled={busy}
                onPress={() => void act('schedule')}
              />
              <Action
                title="ยกเลิกการเตือนทั้งหมดของกิจกรรมนี้"
                disabled={busy || reminders.count === 0}
                onPress={() => void act('cancel')}
              />
            </View>

            <View style={styles.card}>
              <Text accessibilityRole="header" style={styles.subtitle}>
                ทดลองรับ notification
              </Text>
              <Text style={styles.text}>
                ส่งการเตือนทดสอบใน 15 วินาที ใช้ทดสอบขณะเปิดแอปหรือกลับไปหน้าจอหลัก ไม่เปลี่ยนเวลาเตือนจริง
              </Text>
              <Action
                title="ทดสอบแจ้งเตือนใน 15 วินาที"
                disabled={busy}
                onPress={() => void act('test')}
              />
            </View>

            {isUserCreatedEventId(event.id) && (
              <View style={styles.card}>
                <Text accessibilityRole="header" style={styles.subtitle}>
                  จัดการกิจกรรม
                </Text>
                <Text style={styles.text}>
                  กิจกรรมนี้สร้างบนเครื่องนี้ จึงสามารถลบออกได้
                </Text>
                <Action
                  title={busy ? 'กำลังดำเนินการ…' : 'ลบกิจกรรมนี้'}
                  disabled={busy}
                  variant="danger"
                  onPress={confirmDelete}
                />
              </View>
            )}
          </>
        )}

        <Action
          title="กลับรายการกิจกรรม"
          onPress={() => router.replace('/events')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
