import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PoiExplorerScreen } from '../../src/screens/PoiExplorerScreen';
import { colors } from '../../src/theme/colors';

export default function Home() {
  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.menu}>
        <Link href="/trip" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="เปิดทริปของฉัน"
            style={({ pressed }) => [styles.shortcut, pressed && styles.pressed]}>
            <Text accessible={false} style={styles.icon}>＋</Text>
            <View style={styles.copy}>
              <Text style={styles.label}>ทริปของฉัน</Text>
              <Text style={styles.hint}>รวมที่ที่อยากไป</Text>
            </View>
          </Pressable>
        </Link>
        <Link href="/camera" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="เปิดกล้องบันทึกการเดินทาง"
            style={({ pressed }) => [styles.shortcut, styles.camera, pressed && styles.pressed]}>
            <Text accessible={false} style={styles.icon}>◎</Text>
            <View style={styles.copy}>
              <Text style={styles.label}>บันทึกภาพ</Text>
              <Text style={styles.hint}>ถ่ายและแต่งโทนสี</Text>
            </View>
          </Pressable>
        </Link>
      </View>
      <PoiExplorerScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  menu: { flexDirection: 'row', gap: 10, paddingHorizontal: 17, paddingVertical: 12 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 60, flexDirection: 'row', alignItems: 'center',
    gap: 8, padding: 12, borderRadius: 18, backgroundColor: '#FFF0BC', borderWidth: 1, borderColor: '#E6CF87' },
  camera: { backgroundColor: '#E8EEF5', borderColor: '#CED9E7' },
  icon: { fontSize: 22, color: colors.navy },
  copy: { flex: 1 },
  label: { color: colors.navy, fontSize: 14, fontWeight: '800' },
  hint: { color: '#546278', fontSize: 11, marginTop: 3 },
  pressed: { opacity: 0.75 },
});
