import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { colors } from '../../src/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: colors.surface },
      headerTintColor: colors.navy,
      tabBarActiveTintColor: colors.navy,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: { backgroundColor: colors.surface },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'แผนที่', tabBarIcon: ({ color, size }) => <Text accessible={false} style={{ color, fontSize: size }}>⌖</Text> }} />
      <Tabs.Screen name="events" options={{ title: 'กิจกรรม', tabBarIcon: ({ color, size }) => <Text accessible={false} style={{ color, fontSize: size }}>▦</Text> }} />
      <Tabs.Screen name="favorites" options={{ title: 'บันทึก', tabBarIcon: ({ color, size }) => <Text accessible={false} style={{ color, fontSize: size }}>★</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: ({ color, size }) => <Text accessible={false} style={{ color, fontSize: size }}>◉</Text> }} />
    </Tabs>
  );
}
