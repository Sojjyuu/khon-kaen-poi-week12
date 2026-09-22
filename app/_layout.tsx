import { useEffect, useRef } from 'react';
import { Stack, router, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { responseEventId } from '../src/services/reminders';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const state = useRootNavigationState();
  const handled = useRef(new Set<string>());
  useEffect(() => {
    if (!state?.key) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      if (!response) return;
      const key = `${response.notification.request.identifier}:${response.notification.date}:${response.actionIdentifier}`;
      if (handled.current.has(key)) return;
      handled.current.add(key);
      const id = responseEventId(response);
      if (id) router.push({ pathname: '/events/[id]', params: { id } });
      Notifications.clearLastNotificationResponse();
    };
    // Subscribe first to avoid losing a tap between cold-start read and registration.
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    open(Notifications.getLastNotificationResponse());
    return () => subscription.remove();
  }, [state?.key]);
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerStyle: { backgroundColor: colors.surface }, headerTintColor: colors.navy,
        contentStyle: { backgroundColor: colors.background } }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="events/index" options={{ title: 'กิจกรรมขอนแก่น' }} />
        <Stack.Screen name="events/[id]" options={{ title: 'รายละเอียดกิจกรรม' }} />
        <Stack.Screen name="trip" options={{ title: 'My Trip' }} />
        <Stack.Screen name="camera" options={{ title: 'Camera' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
