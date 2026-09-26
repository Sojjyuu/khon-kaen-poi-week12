import { useEffect, useRef } from 'react';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { reminderRepository } from '../src/repositories/reminderRepository';
import { colors } from '../src/theme/colors';
import { SessionProvider, useSession } from '../src/features/auth/session';
import { FavoritesProvider } from '../src/features/events/FavoritesProvider';

export default function RootLayout() {
  return <SessionProvider><FavoritesProvider><AppRoutes /></FavoritesProvider></SessionProvider>;
}

function AppRoutes() {
  const { session } = useSession();
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
          headerBackTitle: 'กลับ',
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="events/[id]" options={{ title: 'รายละเอียดกิจกรรม' }} />
        <Stack.Screen name="trip" options={{ title: 'My Trip' }} />
        <Stack.Screen name="camera" options={{ title: 'Camera' }} />
        <Stack.Protected guard={session.status === 'anonymous'}>
          <Stack.Screen name="login" options={{ title: 'เข้าสู่ระบบ' }} />
          <Stack.Screen name="signup" options={{ title: 'สมัครสมาชิก' }} />
        </Stack.Protected>
        <Stack.Protected guard={session.status === 'authenticated'}>
          <Stack.Screen name="register" options={{ title: 'ลงทะเบียนกิจกรรม' }} />
        </Stack.Protected>
      </Stack>
    </SafeAreaProvider>
  );
}
