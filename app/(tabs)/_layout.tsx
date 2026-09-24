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
      tabBarStyle: { minHeight: 62, paddingBottom: 6, backgroundColor: colors.surface },
      tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'แผนที่', tabBarIcon: () => <Text>⌖</Text> }} />
      <Tabs.Screen name="events" options={{ title: 'กิจกรรม', tabBarIcon: () => <Text>▦</Text> }} />
      <Tabs.Screen name="favorites" options={{ title: 'บันทึก', tabBarIcon: () => <Text>★</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์', tabBarIcon: () => <Text>◉</Text> }} />
    </Tabs>
  );
}
