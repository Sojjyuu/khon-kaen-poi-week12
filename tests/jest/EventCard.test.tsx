import { fireEvent, render } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import { EventCard } from '../../src/features/events/components/EventCard';
import type { CampusEvent } from '../../src/features/events/types';

jest.mock('../../src/repositories/eventRepository', () => ({
  formatEventTime: () => 'วันนัดหมาย',
}));

const event: CampusEvent = {
  id: 'local-event-1',
  title: 'เที่ยวขอนแก่น',
  description: 'กิจกรรมทดสอบ',
  poiId: 'kku',
  startsAt: '2026-11-10T09:00:00+07:00',
};

it('opens the selected event and exposes delete for a personal event', async () => {
  const onOpen = jest.fn();
  const onDelete = jest.fn();
  const screen = await render(<EventCard event={event} onOpen={onOpen} onDelete={onDelete} />);

  expect(screen.getByText('เที่ยวขอนแก่น')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'ดูรายละเอียดและตั้งเตือน' }));
  expect(onOpen).toHaveBeenCalledWith('local-event-1');
  await fireEvent.press(screen.getByRole('button', { name: 'ลบกิจกรรมนี้' }));
  expect(onDelete).toHaveBeenCalledWith(event);
});

it('does not offer delete on a sample event', async () => {
  const screen = await render(<EventCard event={{ ...event, id: 'explore-poi-1' }} onOpen={jest.fn()} onDelete={jest.fn()} />);
  expect(screen.queryByRole('button', { name: 'ลบกิจกรรมนี้' })).toBeNull();
});

it('shows the venue preview and keeps actions usable when the photo fails', async () => {
  const onOpen = jest.fn();
  const screen = await render(<EventCard event={event} onOpen={onOpen} onDelete={jest.fn()} />);
  const photo = screen.getByLabelText('รูปสถานที่ มหาวิทยาลัยขอนแก่น');
  expect(photo.props.source.uri).toContain('Sithan_Gate');
  await fireEvent(photo, 'error', { nativeEvent: { error: 'offline' } });
  expect(screen.getByText('ยังแสดงรูปไม่ได้')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'ดูรายละเอียดและตั้งเตือน' }));
  expect(onOpen).toHaveBeenCalledWith(event.id);
});
