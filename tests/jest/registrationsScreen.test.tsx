import { Alert } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import Registrations from '../../app/registrations';
import { useRegistrations } from '../../src/features/events/hooks/useRegistrations';
import { cancelRegistration } from '../../src/features/events/registration';

jest.mock('@react-native-async-storage/async-storage', () => jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../../src/components/CoverPhoto', () => ({ CoverPhoto: () => null }));
jest.mock('../../src/features/auth/session', () => ({ useSession: () => ({ session: { status: 'authenticated', token: 'test-token' } }) }));
jest.mock('../../src/features/events/hooks/useRegistrations', () => ({ useRegistrations: jest.fn() }));
jest.mock('../../src/features/events/registration', () => ({ cancelRegistration: jest.fn() }));
const refresh = jest.fn();
it('shows saved details and cancels only after confirmation, then refreshes', async () => {
  jest.mocked(useRegistrations).mockReturnValue({ items: [{ id: 'reg-1', eventId: 'local-1', event: { id: 'local-1', title: 'เดินเที่ยว', description: 'พบกันที่ประตู', startsAt: '2030-01-01', poiId: 'kku' } }], loading: false, error: '', refresh });
  jest.mocked(cancelRegistration).mockResolvedValue(undefined);
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const screen = await render(<Registrations />);
  await fireEvent.press(screen.getByRole('button', { name: 'ดูรายละเอียดการลงทะเบียน' }));
  expect(screen.getByText('พบกันที่ประตู')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'ยกเลิกการลงทะเบียน' }));
  expect(cancelRegistration).not.toHaveBeenCalled();
  await act(async () => { alert.mock.calls[0][2]?.find(button => button.text === 'ยืนยันยกเลิก')?.onPress?.(); });
  await waitFor(() => expect(refresh).toHaveBeenCalled());
  expect(cancelRegistration).toHaveBeenCalledWith('local-1', 'test-token');
  alert.mockRestore();
});
it('offers retry when history cannot load rather than showing an empty success', async () => {
  jest.mocked(useRegistrations).mockReturnValue({ items: [], loading: false, error: 'โหลดไม่ได้', refresh });
  const screen = await render(<Registrations />);
  expect(screen.getByText('โหลดไม่ได้')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'ลองใหม่' }));
  expect(refresh).toHaveBeenCalled();
});
