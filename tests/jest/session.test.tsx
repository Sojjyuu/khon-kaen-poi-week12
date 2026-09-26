import { Text, Pressable } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { beforeEach, expect, it, jest } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import { ApiError, requestJson } from '../../src/services/campusApi';
import { SessionProvider, useSession } from '../../src/features/auth/session';
import { getAccountScope } from '../../src/storage/accountScope';
jest.mock('expo-secure-store', () => ({ getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn() }));
jest.mock('../../src/services/campusApi', () => ({ ...jest.requireActual<object>('../../src/services/campusApi'), requestJson: jest.fn() }));
function Screen() {
  const { session, logout, updateProfile } = useSession();
  return <><Text>{session.status === 'authenticated' ? session.user.name : session.status}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="logout" onPress={() => void logout()}><Text>Logout</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="rename" onPress={() => void updateProfile('New name')}><Text>Rename</Text></Pressable></>;
}
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue('saved-token');
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
});
it('restores the account, updates the display name and clears local identity on logout', async () => {
  jest.mocked(requestJson).mockResolvedValue({ id: 'alice', name: 'Alice' });
  const screen = await render(<SessionProvider><Screen /></SessionProvider>);
  await waitFor(() => expect(screen.getByText('Alice')).toBeTruthy());
  expect(getAccountScope()).toBe('alice');
  jest.mocked(requestJson).mockResolvedValue({ id: 'alice', name: 'New name' });
  await fireEvent.press(screen.getByLabelText('rename'));
  await waitFor(() => expect(screen.getByText('New name')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('logout'));
  await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
  expect(getAccountScope()).toBeNull();
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('khonkaen/session-token');
  expect(requestJson).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }), 'saved-token');
});
it('expired session returns to anonymous even if secure storage deletion fails', async () => {
  jest.mocked(requestJson).mockRejectedValue(new ApiError(401, 'expired'));
  jest.mocked(SecureStore.deleteItemAsync).mockRejectedValue(new Error('device unavailable'));
  const screen = await render(<SessionProvider><Screen /></SessionProvider>);
  await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
  expect(getAccountScope()).toBeNull();
});
