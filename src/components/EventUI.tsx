import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} style={({ pressed }) => [eventStyles.button, (pressed || disabled) && { opacity: 0.5 }]}>
    <Text style={eventStyles.buttonText}>{title}</Text>
  </Pressable>;
}

export const eventStyles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 18, fontWeight: '700', color: colors.navy },
  text: { fontSize: 15, lineHeight: 24, color: colors.textMuted },
  card: { padding: 20, gap: 12, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button: { backgroundColor: colors.navy, padding: 15, borderRadius: 14, alignItems: 'center' },
  buttonText: { color: colors.gold, fontSize: 16, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#fff', color: colors.text },
  error: { color: '#A62B20', fontSize: 15, lineHeight: 23 },
});
