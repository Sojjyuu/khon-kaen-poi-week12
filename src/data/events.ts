// Compatibility exports for Week 11 imports. Week 12 code uses the repository directly.
export { formatEventTime } from '../repositories/eventRepository';
export { isEventId, type CampusEvent } from '../features/events/types';
import { eventRepository } from '../repositories/eventRepository';

export const getEvents = eventRepository.list;
export const getEvent = eventRepository.findById;
export const addEvent = eventRepository.create;
