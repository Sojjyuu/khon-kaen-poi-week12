export function focusAccessibilityTarget(target: unknown) {
  const element = target as { focus?: () => void } | null;
  element?.focus?.();
}
