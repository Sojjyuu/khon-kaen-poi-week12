// Compatibility exports retained for the Week 11 tests and documentation.
export { REMINDER_CHANNEL } from './notificationService';
export { responseEventId } from '../repositories/reminderRepository';
import { notificationService } from './notificationService';
import { reminderRepository } from '../repositories/reminderRepository';

export const ensureNotificationPermission = notificationService.ensurePermission;
export const getReminders = notificationService.list;
export const cancelEventReminder = reminderRepository.cancel;
export const scheduleEventReminder = reminderRepository.schedule;
