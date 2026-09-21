import { eventRepository } from './eventRepository';
import { isEventId } from '../features/events/types';
import {
  notificationService,
  type NotificationResponseData,
} from '../services/notificationService';

export type ReminderSnapshot = {
  permissionGranted: boolean;
  mainScheduled: boolean;
  testScheduled: boolean;
  count: number;
};

let operation: Promise<unknown> = Promise.resolve();
function serial<T>(task: () => Promise<T>): Promise<T> {
  const result = operation.then(task, task);
  operation = result.catch(() => undefined);
  return result;
}

function validResponse(data: NotificationResponseData | null): string | null {
  if (!data?.isDefaultAction || !isEventId(data.eventId)) return null;
  return data.eventId;
}

export const reminderRepository = {
  async snapshot(eventId: string): Promise<ReminderSnapshot> {
    const [reminders, permissionGranted] = await Promise.all([
      notificationService.list(eventId),
      notificationService.permissionGranted(),
    ]);
    return {
      permissionGranted,
      mainScheduled: reminders.some((item) => item.identifier.endsWith(':main')),
      testScheduled: reminders.some((item) => item.identifier.endsWith(':test')),
      count: reminders.length,
    };
  },

  schedule(eventId: string, test = false): Promise<string> {
    return serial(async () => {
      const event = await eventRepository.findById(eventId);
      if (!event) throw new Error('ไม่พบกิจกรรมนี้');
      if (!test && Date.parse(event.startsAt) - 1_800_000 <= Date.now()) {
        throw new Error(
          'เลยเวลาเตือนแล้ว กรุณาเลือกกิจกรรมที่เริ่มอีกมากกว่า 30 นาที',
        );
      }
      if (!(await notificationService.ensurePermission())) {
        throw new Error('notification-permission-denied');
      }
      const date = test
        ? new Date(Date.now() + 15_000)
        : new Date(Date.parse(event.startsAt) - 1_800_000);
      if (date.getTime() <= Date.now()) throw new Error('เลยเวลาเตือนแล้ว');
      return notificationService.schedule({
        identifier: `event-reminder:${event.id}:${test ? 'test' : 'main'}`,
        eventId: event.id,
        date,
        test,
      });
    });
  },

  cancel(eventId: string): Promise<void> {
    return serial(async () => {
      const reminders = await notificationService.list(eventId);
      for (const reminder of reminders) {
        await notificationService.cancel(reminder.identifier);
      }
    });
  },

  openSettings: notificationService.openSettings,
  subscribeToRefresh: notificationService.subscribeToRefresh,

  initialNavigationIntent(): { key: string; eventId: string } | null {
    const data = notificationService.responseData(
      notificationService.getInitialResponse(),
    );
    const eventId = validResponse(data);
    return data && eventId ? { key: data.key, eventId } : null;
  },

  clearInitialNavigationIntent(): void {
    notificationService.clearInitialResponse();
  },

  subscribeToNavigationIntents(
    listener: (intent: { key: string; eventId: string }) => void,
  ): () => void {
    return notificationService.subscribeToResponses((response) => {
      const data = notificationService.responseData(response);
      const eventId = validResponse(data);
      if (data && eventId) listener({ key: data.key, eventId });
    });
  },
};

export function responseEventId(
  response: Parameters<typeof notificationService.responseData>[0],
) {
  return validResponse(notificationService.responseData(response));
}
