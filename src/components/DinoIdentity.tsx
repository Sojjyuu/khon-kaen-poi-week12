import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// Bundled images keep the app's identity visible without a network request.
export function DinoWelcome() {
  return (
    <View style={styles.welcome}>
      <Image source={require('../../assets/dino-banner.jpg')} style={styles.banner}
        resizeMode="cover" accessible={false} />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>KHON KAEN · DINO EXPLORER</Text>
        <Text accessibilityRole="header" style={styles.heading}>ตามรอยเมืองไดโนเสาร์</Text>
        <Text style={styles.description}>ให้น้อง Dino พาสำรวจขอนแก่น เลือกจุดหมาย แล้วออกเดินทางในแบบของคุณ</Text>
      </View>
    </View>
  );
}

export function DinoEmpty({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.empty} accessibilityLiveRegion="polite">
      <Image source={require('../../assets/khon-kaen-dino-icon.png')}
        style={styles.mascot} resizeMode="contain" accessible={false} />
      <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  welcome: { marginTop: 16, borderRadius: 24, overflow: 'hidden', backgroundColor: colors.navy },
  banner: { width: '100%', height: 168 },
  copy: { padding: 18, gap: 8 },
  eyebrow: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  heading: { color: '#fff', fontSize: 25, fontWeight: '800' },
  description: { color: '#D6E1ED', fontSize: 14, lineHeight: 23 },
  empty: { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16, gap: 12 },
  mascot: { width: 96, height: 96, borderRadius: 24 },
  emptyTitle: { color: colors.navy, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  emptyDescription: { color: colors.textMuted, fontSize: 15, lineHeight: 24, textAlign: 'center' },
});
