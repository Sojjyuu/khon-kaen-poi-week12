import { Text, Pressable } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { expect, it, jest } from '@jest/globals';
import { SessionProvider, useSession } from '../../src/features/auth/session';
import { requestJson } from '../../src/services/campusApi';
import NativeStore from 'expo-secure-store/src/ExpoSecureStore';

jest.mock('expo-secure-store', () => jest.requireActual('expo-secure-store/src/SecureStore'));

// Keep SecureStore's real JS key validation. Mock only the native device boundary.
jest.mock('expo-secure-store/src/ExpoSecureStore', () => ({
  __esModule: true,
  default: {
    getValueWithKeyAsync: require('@jest/globals').jest.fn(async () => null),
    setValueWithKeyAsync: require('@jest/globals').jest.fn(async () => undefined),
    deleteValueWithKeyAsync: require('@jest/globals').jest.fn(async () => undefined),
  },
}));
jest.mock('../../src/services/campusApi', () => ({ ...jest.requireActual<object>('../../src/services/campusApi'), requestJson: jest.fn() }));
function Screen() {
  const { session, signup, logout } = useSession();
  return <><Text>{session.status}</Text>
    <Pressable accessibilityLabel="signup" onPress={() => void signup('Explorer', 'test@example.test', 'test-only-password')}><Text>Signup</Text></Pressable>
    <Pressable accessibilityLabel="logout" onPress={() => void logout()}><Text>Logout</Text></Pressable></>;
}
it('signup persists a token through the real SecureStore validator and logout removes it', async () => {
  jest.mocked(requestJson).mockResolvedValue({ accessToken: 'test-token', user: { id: 'test', name: 'Explorer' } });
  const screen = await render(<SessionProvider><Screen /></SessionProvider>);
  await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
  await fireEvent.press(screen.getByLabelText('signup'));
  await waitFor(() => expect(screen.getByText('authenticated')).toBeTruthy());
  expect(NativeStore.setValueWithKeyAsync).toHaveBeenCalledWith('test-token', 'khonkaen.session-token', {});
  await fireEvent.press(screen.getByLabelText('logout'));
  await waitFor(() => expect(screen.getByText('anonymous')).toBeTruthy());
  expect(NativeStore.deleteValueWithKeyAsync).toHaveBeenCalledWith('khonkaen.session-token', {});
});
