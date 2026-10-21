import { getAccountScope, registerAccountTransition } from '../storage/accountScope';
import { AppState, Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

export const REMINDER_CHANNEL = 'event-reminders';
let channelAvailable = false;
let desiredOwner = getAccountScope();
let operation: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const result = operation.then(task, task);
  operation = result.catch(() => undefined);
  return result;
}
registerAccountTransition((next) => {
  desiredOwner = next;
  return serial(async () => {
    for (const request of await Notifications.getAllScheduledNotificationsAsync()) {
      if (request.identifier.startsWith('event-reminder:') &&
          (!next || request.content.data?.ownerId !== next)) {
        await Notifications.cancelScheduledNotificationAsync(request.identifier);
      }
    }
    for (const item of await Notifications.getPresentedNotificationsAsync()) {
      if (item.request.identifier.startsWith('event-reminder:') &&
          (!next || item.request.content.data?.ownerId !== next)) {
        await Notifications.dismissNotificationAsync(item.request.identifier);
      }
    }
  });
});

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: !!getAccountScope() && notification.request.content.data?.ownerId === getAccountScope(),
    shouldShowList: !!getAccountScope() && notification.request.content.data?.ownerId === getAccountScope(),
    shouldPlaySound: !!getAccountScope() && notification.request.content.data?.ownerId === getAccountScope(),
    shouldSetBadge: false,
  }),
});

export type ReminderNotification = {
  identifier: string;
  eventId: unknown;
};

export type NotificationResponseData = {
  key: string;
  ownerId: unknown;
  eventId: unknown;
  isDefaultAction: boolean;
};

export const notificationService = {
  async ensurePermission(): Promise<boolean> {
    if (Platform.OS === 'android' && Constants.appOwnership !== 'expo') {
      try {
        await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
          name: 'การเตือนกิจกรรมขอนแก่น',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
        });
        channelAvailable = true;
      } catch {
        channelAvailable = false;
      }
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  },

  async permissionGranted(): Promise<boolean> {
    return (await Notifications.getPermissionsAsync()).granted;
  },

  async list(eventId: string): Promise<ReminderNotification[]> {
    return (await Notifications.getAllScheduledNotificationsAsync())
      .filter(
        (notification) =>
          notification.identifier.startsWith('event-reminder:') &&
          notification.content.data?.eventId === eventId &&
          !!getAccountScope() && notification.content.data?.ownerId === getAccountScope(),
      )
      .map((notification) => ({
        identifier: notification.identifier,
        eventId: notification.content.data?.eventId,
      }));
  },

  async schedule(input: {
    identifier: string;
    eventId: string;
    date: Date;
    test: boolean;
    ownerId: string;
  }): Promise<string> {
    return serial(async () => {
    if (input.ownerId !== desiredOwner || input.ownerId !== getAccountScope()) {
      throw new Error('บัญชีเปลี่ยนแล้ว กรุณาเข้าสู่ระบบและตั้งเตือนใหม่');
    }
    await Notifications.cancelScheduledNotificationAsync(input.identifier);
    return Notifications.scheduleNotificationAsync({
      identifier: input.identifier,
      content: {
        title: input.test
          ? 'ทดสอบการเตือนกิจกรรม'
          : 'กิจกรรมของคุณจะเริ่มในอีก 30 นาที',
        body: 'แตะเพื่อดูรายละเอียดกิจกรรม',
        sound: 'default',
        data: { eventId: input.eventId, ownerId: input.ownerId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: input.date,
        ...(Platform.OS === 'android' && channelAvailable ? { channelId: REMINDER_CHANNEL } : {}),
      },
    });
    });
  },

  cancel(identifier: string): Promise<void> {
    return Notifications.cancelScheduledNotificationAsync(identifier);
  },

  responseData(
    response: Notifications.NotificationResponse | null,
  ): NotificationResponseData | null {
    if (!response) return null;
    const request = response.notification.request;
    return {
      key: `${request.identifier}:${response.notification.date}:${response.actionIdentifier}`,
      eventId: request.content.data?.eventId,
      ownerId: request.content.data?.ownerId,
      isDefaultAction:
        response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER,
    };
  },

  getInitialResponse(): Notifications.NotificationResponse | null {
    return Notifications.getLastNotificationResponse();
  },

  clearInitialResponse(): void {
    Notifications.clearLastNotificationResponse();
  },

  subscribeToResponses(
    listener: (response: Notifications.NotificationResponse) => void,
  ): () => void {
    const subscription =
      Notifications.addNotificationResponseReceivedListener(listener);
    return () => subscription.remove();
  },

  subscribeToRefresh(listener: () => void): () => void {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') listener();
    });
    const received = Notifications.addNotificationReceivedListener(() => listener());
    return () => {
      appState.remove();
      received.remove();
    };
  },

  async openSettings(): Promise<void> {
    await Linking.openSettings();
  },
};

export type NotificationService = typeof notificationService;
