import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, {
  Callout,
  MapMarker,
  Marker,
  PROVIDER_GOOGLE,
} from 'react-native-maps';

import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

type PoiMapProps = {
  poi: PointOfInterest;
};

const MAP_DELTA = 0.012;

const regionFor = (poi: PointOfInterest, delta = MAP_DELTA) => ({
  latitude: poi.latitude,
  longitude: poi.longitude,
  latitudeDelta: delta,
  longitudeDelta: delta,
});

export function PoiMap({ poi }: PoiMapProps) {
  const mapRef = useRef<MapView>(null);
  const markerRef = useRef<MapMarker>(null);
  const fullMapRef = useRef<MapView>(null);
  const [isFullMapVisible, setFullMapVisible] = useState(false);

  useEffect(() => {
    mapRef.current?.animateToRegion(regionFor(poi), 550);

    const timer = setTimeout(() => markerRef.current?.showCallout(), 650);
    return () => clearTimeout(timer);
  }, [poi.id, poi.latitude, poi.longitude]);

  const centerFullMap = () => {
    fullMapRef.current?.animateToRegion(regionFor(poi, 0.009), 450);
  };

  return (
    <>
      <View style={styles.frame}>
        <MapView
          ref={mapRef}
          initialRegion={regionFor(poi)}
          loadingEnabled
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          showsCompass
          style={styles.map}
        >
          <Marker
            key={poi.id}
            ref={markerRef}
            coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
            pinColor={colors.pin}
            title={poi.name}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{poi.name}</Text>
                <Text style={styles.calloutAddress}>{poi.address}</Text>
              </View>
            </Callout>
          </Marker>
        </MapView>

        <View pointerEvents="none" style={styles.mapLabel}>
          <Text style={styles.mapLabelEyebrow}>NOW EXPLORING</Text>
          <Text numberOfLines={1} style={styles.mapLabelName}>
            {poi.icon} {poi.name}
          </Text>
        </View>

        <Pressable
          accessibilityLabel="เปิดแผนที่แบบเต็มหน้าจอ"
          accessibilityRole="button"
          onPress={() => setFullMapVisible(true)}
          style={({ pressed }) => [styles.expandButton, pressed && styles.pressed]}
        >
          <Text style={styles.expandIcon}>⛶</Text>
          <Text style={styles.expandText}>ขยายแผนที่</Text>
        </Pressable>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setFullMapVisible(false)}
        presentationStyle="fullScreen"
        visible={isFullMapVisible}
      >
        <View style={styles.fullscreen}>
          <MapView
            ref={fullMapRef}
            initialRegion={regionFor(poi, 0.009)}
            loadingEnabled
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            showsBuildings
            showsCompass
            showsScale
            style={styles.map}
          >
            <Marker
              coordinate={{ latitude: poi.latitude, longitude: poi.longitude }}
              description={poi.address}
              pinColor={colors.pin}
              title={poi.name}
            />
          </MapView>

          <SafeAreaView pointerEvents="box-none" style={styles.fullOverlay}>
            <View style={styles.fullTopBar}>
              <Pressable
                accessibilityLabel="ปิดแผนที่เต็มหน้าจอ"
                accessibilityRole="button"
                onPress={() => setFullMapVisible(false)}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>

              <View style={styles.fullTitleWrap}>
                <Text style={styles.fullEyebrow}>KHON KAEN · POI</Text>
                <Text numberOfLines={1} style={styles.fullTitle}>
                  {poi.name}
                </Text>
              </View>

              <Pressable
                accessibilityLabel="เลื่อนแผนที่กลับไปที่หมุด"
                accessibilityRole="button"
                onPress={centerFullMap}
                style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
              >
                <Text style={styles.centerIcon}>◎</Text>
              </Pressable>
            </View>

            <View style={styles.fullBottomCard}>
              <View style={styles.fullIcon}>
                <Text style={styles.fullIconText}>{poi.icon}</Text>
              </View>
              <View style={styles.fullCopy}>
                <Text style={styles.fullCategory}>{poi.category}</Text>
                <Text style={styles.fullName}>{poi.name}</Text>
                <Text numberOfLines={2} style={styles.fullAddress}>
                  {poi.address}
                </Text>
                <Text style={styles.fullCoordinates}>
                  {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  frame: {
    height: 330,
    overflow: 'hidden',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.surfaceWarm,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  map: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  mapLabel: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(7, 26, 53, 0.94)',
    paddingHorizontal: 15,
    paddingVertical: 11,
    paddingRight: 128,
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
  expandButton: {
    position: 'absolute',
    top: 22,
    right: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  expandIcon: {
    color: colors.navy,
    fontSize: 15,
    fontWeight: '900',
  },
  expandText: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 5,
  },
  callout: {
    width: 210,
    paddingVertical: 3,
  },
  calloutTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  calloutAddress: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },
  fullscreen: {
    flex: 1,
    backgroundColor: colors.navy,
  },
  fullOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  fullTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  circleButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.navy,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  closeIcon: {
    color: '#FFFFFF',
    fontSize: 31,
    lineHeight: 33,
    fontWeight: '400',
  },
  centerIcon: {
    color: colors.gold,
    fontSize: 25,
    fontWeight: '900',
  },
  fullTitleWrap: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingHorizontal: 15,
    paddingVertical: 9,
    marginHorizontal: 9,
  },
  fullEyebrow: {
    color: colors.goldDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  fullTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  fullBottomCard: {
    flexDirection: 'row',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.42)',
    backgroundColor: 'rgba(7,26,53,0.95)',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 8,
  },
  fullIcon: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.gold,
  },
  fullIconText: {
    fontSize: 27,
  },
  fullCopy: {
    flex: 1,
    marginLeft: 13,
  },
  fullCategory: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  fullName: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  fullAddress: {
    color: '#C9D4E5',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },
  fullCoordinates: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginTop: 7,
  },
  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.97 }],
  },
});
