import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type ActionProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  accessibilityHint?: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function Action({
  title,
  onPress,
  disabled = false,
  accessibilityHint,
  variant = 'primary',
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
        variant === 'secondary' && eventStyles.secondaryButton,
        variant === 'danger' && eventStyles.dangerButton,
        pressed && eventStyles.buttonPressed,
        disabled && eventStyles.buttonInactive,
      ]}
    >
      <Text
        style={[
          eventStyles.buttonText,
          variant === 'danger' && eventStyles.dangerButtonText,
          disabled && eventStyles.disabledText,
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export const eventStyles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  title: { fontSize: 26, lineHeight: 34, fontWeight: '800', color: colors.navy },
  subtitle: { fontSize: 18, lineHeight: 26, fontWeight: '700', color: colors.navy },
  text: { fontSize: 15, lineHeight: 24, color: colors.textMuted },
  badgeText: {
    color: colors.goldDark,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
  card: {
    padding: 20,
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    minHeight: 52,
    backgroundColor: colors.gold,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: '#FFF2F0',
    borderWidth: 1,
    borderColor: '#B6382D',
  },
  secondaryButton: { backgroundColor: '#EDF2F8', borderWidth: 1, borderColor: '#D2DCE9' },
  buttonPressed: { opacity: 0.78 },
  buttonInactive: { backgroundColor: '#E3E7EC', borderColor: '#E3E7EC' },
  disabledText: { color: '#636E7D' },
  buttonText: {
    color: colors.navy,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  dangerButtonText: {
    color: '#8F1D14',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: colors.text,
  },
  error: {
    color: '#8F1D14',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
});
