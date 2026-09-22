import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

type PoiMapProps = {
  poi: PointOfInterest;
};

export function PoiMap({ poi }: PoiMapProps) {
  const openMaps = async () => {
    const query = encodeURIComponent(`${poi.latitude},${poi.longitude}`);
    await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <View
      accessibilityLabel={`ตำแหน่ง ${poi.name} บนแผนที่`}
      style={styles.frame}
    >
      <View style={styles.grid} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={index} style={[styles.line, { top: `${(index + 1) * 11}%` }]} />
        ))}
        {Array.from({ length: 8 }).map((_, index) => (
          <View key={`v-${index}`} style={[styles.vLine, { left: `${(index + 1) * 11}%` }]} />
        ))}
      </View>

      <View style={styles.mapLabel}>
        <Text style={styles.mapLabelEyebrow}>WEB MAP PREVIEW</Text>
        <Text style={styles.mapLabelName}>
          {poi.icon} {poi.name}
        </Text>
      </View>

      <View style={styles.pinWrap}>
        <View style={styles.pin}>
          <Text style={styles.pinText}>●</Text>
        </View>
        <Text style={styles.coordinates}>
          {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
        </Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{poi.category}</Text>
          <Text style={styles.name}>{poi.name}</Text>
          <Text style={styles.address}>{poi.address}</Text>
        </View>
        <Pressable
          accessibilityLabel={`เปิด ${poi.name} ใน Google Maps`}
          accessibilityRole="link"
          onPress={() => void openMaps()}
          style={({ pressed }) => [
            styles.openButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.openButtonText}>เปิด Google Maps ↗</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 330,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: '#E9EEF5',
    position: 'relative',
  },
  grid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#C9D4E5',
  },
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#C9D4E5',
  },
  mapLabel: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(7,26,53,0.94)',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  mapLabelEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  mapLabelName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  pinWrap: {
    position: 'absolute',
    top: 116,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pin: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
    borderWidth: 6,
    borderColor: '#FFFFFF',
  },
  pinText: {
    color: colors.pin,
    fontSize: 34,
    lineHeight: 36,
  },
  coordinates: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.94)',
    color: colors.navy,
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontVariant: ['tabular-nums'],
  },
  bottomCard: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
    padding: 14,
  },
  category: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  name: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  address: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  openButton: {
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.navy,
    paddingHorizontal: 12,
  },
  openButtonText: {
    color: colors.gold,
    fontSize: 10,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.76,
  },
});
