import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PoiExplorerScreen } from '../src/screens/PoiExplorerScreen';
import { colors } from '../src/theme/colors';

export default function Home() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ paddingHorizontal: 20, paddingVertical: 12 }}>
      <Link href="/events" accessibilityRole="button" style={{ padding: 14, borderRadius: 16, backgroundColor: colors.navy }}>
        <Text style={{ color: colors.gold, fontWeight: '800', fontSize: 16 }}>🔔 กิจกรรมและการแจ้งเตือน →</Text>
      </Link>
    </View>
    <PoiExplorerScreen />
  </SafeAreaView>;
}
