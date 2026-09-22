export const REMINDER_CHANNEL = 'event-reminders';

export type ReminderNotification = {
  identifier: string;
  eventId: unknown;
};

export type NotificationResponseData = {
  key: string;
  eventId: unknown;
  isDefaultAction: boolean;
};

const unsupported = () =>
  new Error('การแจ้งเตือนแบบ local notification ใช้ได้บน iOS/Android เท่านั้น');

export const notificationService = {
  async ensurePermission(): Promise<boolean> {
    return false;
  },

  async permissionGranted(): Promise<boolean> {
    return false;
  },

  async list(_eventId: string): Promise<ReminderNotification[]> {
    return [];
  },

  async schedule(_input: {
    identifier: string;
    eventId: string;
    date: Date;
    test: boolean;
  }): Promise<string> {
    throw unsupported();
  },

  async cancel(_identifier: string): Promise<void> {
    return;
  },

  responseData(_response: unknown): NotificationResponseData | null {
    return null;
  },

  getInitialResponse(): null {
    return null;
  },

  clearInitialResponse(): void {},

  subscribeToResponses(_listener: (response: unknown) => void): () => void {
    return () => {};
  },

  subscribeToRefresh(_listener: () => void): () => void {
    return () => {};
  },

  async openSettings(): Promise<void> {
    throw unsupported();
  },
};

export type NotificationService = typeof notificationService;
