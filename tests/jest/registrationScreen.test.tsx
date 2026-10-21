import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import { router } from 'expo-router';
import Register from '../../app/register';
import { ApiError, requestJson } from '../../src/services/campusApi';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() }, useLocalSearchParams: () => ({ id: 'explore-kku' }) }));
jest.mock('../../src/features/auth/session', () => ({ useSession: () => ({ session: { status: 'authenticated', token: 'test-token' }, logout: jest.fn() }) }));
jest.mock('../../src/repositories/eventRepository', () => ({ eventRepository: { findById: async () => ({ id: 'explore-kku', title: 'เดินสำรวจ มข.', description: 'ตัวอย่าง', startsAt: '2030-10-01T09:00:00+07:00', poiId: 'kku' }) } }));
jest.mock('../../src/services/campusApi', () => ({ ...jest.requireActual<object>('../../src/services/campusApi'), requestJson: jest.fn() }));
it('registers the selected device event through API with its private snapshot', async () => {
  jest.mocked(requestJson).mockResolvedValue({ registrationId: 'reg-test' });
  const screen = await render(<Register />);
  await fireEvent.changeText(screen.getByLabelText('ชื่อ-นามสกุล'), 'ผู้ทดสอบ');
  await fireEvent.changeText(screen.getByLabelText('อีเมล'), 'test@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'ลงทะเบียนเข้าร่วมกิจกรรม' }));
  await waitFor(() => expect(screen.getByText('ลงทะเบียนเข้าร่วมสำเร็จแล้ว')).toBeTruthy());
  expect(screen.queryByRole('button', { name: 'ลงทะเบียนเข้าร่วมกิจกรรม' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'กลับไปดูกิจกรรมนี้' }));
  await waitFor(() => expect(router.replace).toHaveBeenCalledWith({ pathname: '/events/[id]', params: { id: 'explore-kku' } }));
  const [path, options, token] = jest.mocked(requestJson).mock.calls[0];
  expect(path).toBe('/events/explore-kku/registrations');
  expect(token).toBe('test-token');
  expect(JSON.parse(String(options?.body))).toMatchObject({ fullName: 'ผู้ทดสอบ', email: 'test@example.test', localEvent: { id: 'explore-kku', poiId: 'kku' } });
});


it('shows an HTTP diagnosis when the API fails instead of claiming the form is invalid', async () => {
  jest.mocked(requestJson).mockRejectedValueOnce(new ApiError(500, 'internal'));
  const screen = await render(<Register />);
  await fireEvent.changeText(screen.getByLabelText('ชื่อ-นามสกุล'), 'ผู้ทดสอบ');
  await fireEvent.changeText(screen.getByLabelText('อีเมล'), 'test@example.test');
  await fireEvent.press(screen.getByRole('button', { name: 'ลงทะเบียนเข้าร่วมกิจกรรม' }));
  await waitFor(() => expect(screen.getByText(/HTTP 500/)).toBeTruthy());
  expect(screen.queryByText('ลงทะเบียนเข้าร่วมสำเร็จแล้ว')).toBeNull();
  expect(screen.getByLabelText('ชื่อ-นามสกุล').props.value).toBe('ผู้ทดสอบ');
});
