import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type ActionProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
};

export function Action({
  title,
  onPress,
  disabled = false,
  accessibilityHint,
}: ActionProps) {
  return (
    <Pressable
      accessibilityHint={accessibilityHint}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        eventStyles.button,
        (pressed || disabled) && eventStyles.buttonInactive,
      ]}
    >
      <Text style={eventStyles.buttonText}>{title}</Text>
    </Pressable>
  );
}

export const eventStyles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  title: { fontSize: 26, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 18, fontWeight: '700', color: colors.navy },
  text: { fontSize: 15, lineHeight: 24, color: colors.textMuted },
  card: { padding: 20, gap: 12, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  button: { minHeight: 48, backgroundColor: colors.navy, paddingHorizontal: 15, paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  buttonInactive: { opacity: 0.5 },
  buttonText: { color: colors.gold, fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, fontSize: 16, backgroundColor: '#fff', color: colors.text },
  error: { color: '#8F1D14', fontSize: 15, lineHeight: 23, fontWeight: '600' },
});
