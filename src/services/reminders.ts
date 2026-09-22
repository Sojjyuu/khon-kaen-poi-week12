import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getEvent, isEventId } from '../data/events';

export const REMINDER_CHANNEL = 'event-reminders';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'การเตือนกิจกรรมขอนแก่น', importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

export function responseEventId(response: Notifications.NotificationResponse | null) {
  if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return null;
  const id: unknown = response.notification.request.content.data?.eventId;
  return isEventId(id) ? id : null;
}

// The OS persists notification identifier + content.data.eventId together, including after restart.
// Read the OS queue rather than a second store that could drift after delivery/cancellation.
export async function getReminders(eventId: string) {
  return (await Notifications.getAllScheduledNotificationsAsync()).filter(n =>
    n.identifier.startsWith('event-reminder:') && n.content.data?.eventId === eventId);
}

let operation: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const result = operation.then(task, task);
  operation = result.catch(() => undefined);
  return result;
}

export function cancelEventReminder(eventId: string) {
  return serial(async () => {
    for (const reminder of await getReminders(eventId)) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  });
}

export function scheduleEventReminder(eventId: string, test = false) {
  return serial(async () => {
    const event = await getEvent(eventId);
    if (!event) throw new Error('ไม่พบกิจกรรมนี้');
    if (!test && Date.parse(event.startsAt) - 1800000 <= Date.now()) {
      throw new Error('เลยเวลาเตือนแล้ว กรุณาเลือกกิจกรรมที่เริ่มอีกมากกว่า 30 นาที');
    }
    if (!await ensureNotificationPermission()) throw new Error('notification-permission-denied');
    const date = test ? new Date(Date.now() + 15000) : new Date(Date.parse(event.startsAt) - 1800000);
    if (date.getTime() <= Date.now()) throw new Error('เลยเวลาเตือนแล้ว');
    const identifier = `event-reminder:${event.id}:${test ? 'test' : 'main'}`;
    // Separate test identifier so a demo never replaces the actual 30-minute reminder.
    await Notifications.cancelScheduledNotificationAsync(identifier);
    return Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: test ? 'ทดสอบการเตือนกิจกรรม' : 'กิจกรรมของคุณจะเริ่มในอีก 30 นาที',
        body: 'แตะเพื่อดูรายละเอียดกิจกรรม', sound: 'default',
        data: { eventId: event.id },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: REMINDER_CHANNEL },
    });
  });
}
