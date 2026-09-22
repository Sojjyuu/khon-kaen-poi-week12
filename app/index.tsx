import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PoiExplorerScreen } from '../src/screens/PoiExplorerScreen';
import { colors } from '../src/theme/colors';

export default function Home() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.menuWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.menu}>
          <Link href="/trip" accessibilityRole="button" style={styles.menuButton}>
            <Text style={styles.menuText}>My Trip</Text>
          </Link>
          <Link href="/camera" accessibilityRole="button" style={styles.menuButton}>
            <Text style={styles.menuText}>Camera</Text>
          </Link>
          <Link href="/events" accessibilityRole="button" style={styles.menuButton}>
            <Text style={styles.menuText}>Reminder</Text>
          </Link>
          <Link href="/profile" accessibilityRole="button" style={styles.menuButton}>
            <Text style={styles.menuText}>Profile</Text>
          </Link>
        </ScrollView>
      </View>
      <PoiExplorerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  menuWrap: { paddingVertical: 9 },
  menu: { paddingHorizontal: 17, gap: 8 },
  menuButton: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: 14, backgroundColor: colors.navy },
  menuText: { color: colors.gold, fontWeight: '900', fontSize: 12 },
});
