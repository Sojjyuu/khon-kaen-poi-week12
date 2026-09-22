import { useEffect, useRef } from 'react';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { reminderRepository } from '../src/repositories/reminderRepository';
import { colors } from '../src/theme/colors';

export default function RootLayout() {
  const state = useRootNavigationState();
  const handled = useRef(new Set<string>());

  useEffect(() => {
    if (!state?.key) return;

    const open = (intent: { key: string; eventId: string } | null) => {
      if (!intent || handled.current.has(intent.key)) return;
      handled.current.add(intent.key);
      router.push({ pathname: '/events/[id]', params: { id: intent.eventId } });
    };

    const unsubscribe = reminderRepository.subscribeToNavigationIntents(open);
    open(reminderRepository.initialNavigationIntent());
    reminderRepository.clearInitialNavigationIntent();
    return unsubscribe;
  }, [state?.key]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.navy,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
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
