import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { router } from 'expo-router';
import { AccountForm } from '../../src/features/auth/AccountForm';
import { SessionProvider } from '../../src/features/auth/session';
import { requestJson, ApiError } from '../../src/services/campusApi';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../../src/services/campusApi', () => ({
  ...jest.requireActual<object>('../../src/services/campusApi'),
  hasCampusApi: () => true,
  requestJson: jest.fn(),
}));
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
});

it('blocks mismatched passwords, then signs up and securely stores the session', async () => {
  const screen = await render(<SessionProvider><AccountForm mode="signup" /></SessionProvider>);
  await fireEvent.changeText(screen.getByLabelText('ชื่อที่ใช้แสดง'), 'Explorer');
  await fireEvent.changeText(screen.getByLabelText('อีเมล'), ' NEW@example.test ');
  await fireEvent.changeText(screen.getByLabelText('รหัสผ่าน'), 'temporary-secret');
  await fireEvent.changeText(screen.getByLabelText('ยืนยันรหัสผ่าน'), 'different-secret');
  await fireEvent.press(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
  expect(screen.getByText('รหัสผ่านทั้งสองช่องไม่ตรงกัน')).toBeTruthy();
  expect(requestJson).not.toHaveBeenCalled();
  jest.mocked(requestJson).mockResolvedValue({ accessToken: 'test-token', user: { id: 'one', name: 'Explorer' } });
  await fireEvent.changeText(screen.getByLabelText('ยืนยันรหัสผ่าน'), 'temporary-secret');
  await fireEvent.press(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
  await waitFor(() => expect(SecureStore.setItemAsync).toHaveBeenCalledWith('khonkaen/session-token', 'test-token'));
  expect(requestJson).toHaveBeenCalledWith('/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Explorer', email: 'new@example.test', password: 'temporary-secret' }) });
  expect(router.replace).toHaveBeenCalledWith('/events');
});

it('keeps the form and shows an actionable duplicate-email error', async () => {
  jest.mocked(requestJson).mockRejectedValue(new ApiError(409, 'duplicate'));
  const screen = await render(<SessionProvider><AccountForm mode="signup" /></SessionProvider>);
  await fireEvent.changeText(screen.getByLabelText('ชื่อที่ใช้แสดง'), 'Explorer');
  await fireEvent.changeText(screen.getByLabelText('อีเมล'), 'new@example.test');
  await fireEvent.changeText(screen.getByLabelText('รหัสผ่าน'), 'temporary-secret');
  await fireEvent.changeText(screen.getByLabelText('ยืนยันรหัสผ่าน'), 'temporary-secret');
  await fireEvent.press(screen.getByRole('button', { name: 'สมัครสมาชิก' }));
  await waitFor(() => expect(screen.getByText('อีเมลนี้สมัครแล้ว ลองเข้าสู่ระบบได้เลย')).toBeTruthy());
  expect(screen.getByLabelText('อีเมล').props.value).toBe('new@example.test');
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
});
