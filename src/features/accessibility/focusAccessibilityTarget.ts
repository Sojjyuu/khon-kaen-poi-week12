import { AccessibilityInfo, findNodeHandle } from 'react-native';

export function focusAccessibilityTarget(target: unknown) {
  const node = findNodeHandle(target as Parameters<typeof findNodeHandle>[0]);
  if (node) AccessibilityInfo.setAccessibilityFocus(node);
}
