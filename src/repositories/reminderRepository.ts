import { isEventId } from '../features/events/types';
import {
  notificationService,
  type NotificationResponseData,
  type NotificationService,
} from '../services/notificationService';
import { eventRepository } from './eventRepository';

export type ReminderSnapshot = {
  permissionGranted: boolean;
  mainScheduled: boolean;
  testScheduled: boolean;
  count: number;
};

type EventRepositoryLike = Pick<typeof eventRepository, 'findById'>;

function validResponse(data: NotificationResponseData | null): string | null {
  if (!data?.isDefaultAction || !isEventId(data.eventId)) return null;
  return data.eventId;
}

export function createReminderRepository(
  events: EventRepositoryLike = eventRepository,
  device: NotificationService = notificationService,
) {
  let operation: Promise<unknown> = Promise.resolve();

  function serial<T>(task: () => Promise<T>): Promise<T> {
    const result = operation.then(task, task);
    operation = result.catch(() => undefined);
    return result;
  }

  return {
    async snapshot(eventId: string): Promise<ReminderSnapshot> {
      const [reminders, permissionGranted] = await Promise.all([
        device.list(eventId),
        device.permissionGranted(),
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
        const event = await events.findById(eventId);
        if (!event) throw new Error('ไม่พบกิจกรรมนี้');
        if (!test && Date.parse(event.startsAt) - 1_800_000 <= Date.now()) {
          throw new Error(
            'เลยเวลาเตือนแล้ว กรุณาเลือกกิจกรรมที่เริ่มอีกมากกว่า 30 นาที',
          );
        }
        if (!(await device.ensurePermission())) {
          throw new Error('notification-permission-denied');
        }
        const date = test
          ? new Date(Date.now() + 15_000)
          : new Date(Date.parse(event.startsAt) - 1_800_000);
        if (date.getTime() <= Date.now()) throw new Error('เลยเวลาเตือนแล้ว');
        return device.schedule({
          identifier: `event-reminder:${event.id}:${test ? 'test' : 'main'}`,
          eventId: event.id,
          date,
          test,
        });
      });
    },

    cancel(eventId: string): Promise<void> {
      return serial(async () => {
        const reminders = await device.list(eventId);
        for (const reminder of reminders) {
          await device.cancel(reminder.identifier);
        }
      });
    },

    openSettings: device.openSettings,
    subscribeToRefresh: device.subscribeToRefresh,

    initialNavigationIntent(): { key: string; eventId: string } | null {
      const data = device.responseData(device.getInitialResponse());
      const eventId = validResponse(data);
      return data && eventId ? { key: data.key, eventId } : null;
    },

    clearInitialNavigationIntent(): void {
      device.clearInitialResponse();
    },

    subscribeToNavigationIntents(
      listener: (intent: { key: string; eventId: string }) => void,
    ): () => void {
      return device.subscribeToResponses((response) => {
        const data = device.responseData(response);
        const eventId = validResponse(data);
        if (data && eventId) listener({ key: data.key, eventId });
      });
    },
  };
}

export const reminderRepository = createReminderRepository();

export function responseEventId(
  response: Parameters<typeof notificationService.responseData>[0],
) {
  return validResponse(notificationService.responseData(response));
}
