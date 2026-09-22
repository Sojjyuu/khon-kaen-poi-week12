import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, useFocusEffect } from 'expo-router';
import { FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PoiMap } from '../components/PoiMap';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { getFavoritePoiIds, toggleFavoritePoi } from '../services/favorites';
import { colors } from '../theme/colors';
import type { PointOfInterest } from '../types/poi';

const dinoLogo = require('../../assets/khon-kaen-dino-icon.png');
const categories = ['ทั้งหมด', ...Array.from(new Set(pointsOfInterest.map((poi) => poi.category)))];

export function PoiExplorerScreen() {
  const [selectedPoi, setSelectedPoi] = useState(pointsOfInterest[0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const listRef = useRef<FlatList<PointOfInterest>>(null);

  const filteredPoints = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return pointsOfInterest.filter((poi) => {
      const matchesCategory = selectedCategory === 'ทั้งหมด' || poi.category === selectedCategory;
      const searchable = [poi.name, poi.category, poi.address, poi.description].join(' ').toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  useFocusEffect(
    useCallback(() => {
      getFavoritePoiIds().then(setFavoriteIds);
    }, []),
  );

  const toggleTrip = async () => {
    setFavoriteIds(await toggleFavoritePoi(selectedPoi.id));
  };

  const selectPoi = (poi: PointOfInterest) => {
    setSelectedPoi(poi);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: 355, animated: true });
    }, 80);
  };

  return (
    <FlatList
      ref={listRef}
      contentContainerStyle={styles.content}
      data={filteredPoints}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.hero}>
            <View style={styles.orbitLarge} />
            <View style={styles.orbitSmall} />
            <View style={styles.heroTopRow}>
              <View style={styles.brandLockup}>
                <Image source={dinoLogo} style={styles.logo} />
                <View>
                  <Text style={styles.brandEyebrow}>KHON KAEN</Text>
                  <Text style={styles.brandName}>DINO EXPLORER</Text>
                </View>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeNumber}>10</Text>
                <Text style={styles.heroBadgeText}>PLACES</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>ตามรอยเมืองไดโนเสาร์{`\n`}เที่ยวขอนแก่นให้ครบ</Text>
            <Text style={styles.heroSubtitle}>
              รวมหมุดแลนด์มาร์กสำคัญ เลือกหนึ่งสถานที่แล้วออกสำรวจบนแผนที่ได้ทันที
            </Text>

            <View style={styles.heroChips}>
              <View style={styles.heroChipGold}>
                <Text style={styles.heroChipGoldText}>🦕 DINOSAUR CITY</Text>
              </View>
              <View style={styles.heroChipDark}>
                <Text style={styles.heroChipDarkText}>📍 10 จุดแนะนำ</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.sectionEyebrow}>SEARCH & FILTER</Text>
            <Text style={styles.searchTitle}>ค้นหาสถานที่</Text>
            <TextInput
              accessibilityLabel="ค้นหาสถานที่"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ค้นหาชื่อ หมวด หรือที่อยู่…"
              placeholderTextColor="#8A93A2"
              returnKeyType="search"
              style={styles.searchInput}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {categories.map((category) => {
                const selected = selectedCategory === category;
                return (
                  <Pressable
                    key={category}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {category}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.searchMetaRow}>
              <Text style={styles.searchMeta}>
                พบ {filteredPoints.length} จาก {pointsOfInterest.length} สถานที่
              </Text>
              {(searchQuery || selectedCategory !== 'ทั้งหมด') && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedCategory('ทั้งหมด');
                  }}
                >
                  <Text style={styles.clearFilterText}>ล้างตัวกรอง</Text>
                </Pressable>
              )}
            </View>
          </View>


          <View style={styles.mapSectionHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>INTERACTIVE MAP</Text>
              <Text style={styles.sectionTitle}>แผนที่สำรวจ</Text>
              <Text style={styles.sectionSubtitle}>กด “ขยายแผนที่” เพื่อดูแบบเต็มจอ</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveDot}>●</Text>
              <Text style={styles.liveText}>SELECTED</Text>
            </View>
          </View>

          <PoiMap poi={selectedPoi} />

          <View style={styles.selectedCard}>
            <View style={styles.selectedTopRow}>
              <View style={styles.selectedIcon}>
                <Text style={styles.selectedIconText}>{selectedPoi.icon}</Text>
              </View>
              <View style={styles.selectedCopy}>
                <Text style={styles.selectedCategory}>{selectedPoi.category}</Text>
                <Text style={styles.selectedName}>{selectedPoi.name}</Text>
              </View>
              <View style={styles.selectedMark}>
                <Text style={styles.selectedMarkText}>✓</Text>
              </View>
            </View>

            <Text style={styles.selectedAddress}>⌖ {selectedPoi.address}</Text>
            <Text style={styles.selectedDescription}>{selectedPoi.description}</Text>

            <View style={styles.coordinateBar}>
              <Text style={styles.coordinateLabel}>COORDINATES</Text>
              <Text style={styles.coordinates}>
                {selectedPoi.latitude.toFixed(5)} · {selectedPoi.longitude.toFixed(5)}
              </Text>
            </View>

            <View style={styles.tripActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favoriteIds.includes(selectedPoi.id) ? 'นำสถานที่ออกจากทริป' : 'เพิ่มสถานที่เข้าทริป'}
                onPress={toggleTrip}
                style={[styles.tripButton, favoriteIds.includes(selectedPoi.id) && styles.tripButtonSelected]}
              >
                <Text style={[styles.tripButtonText, favoriteIds.includes(selectedPoi.id) && styles.tripButtonTextSelected]}>
                  {favoriteIds.includes(selectedPoi.id) ? '✓ อยู่ใน My Trip แล้ว' : '+ เพิ่มเข้าทริป'}
                </Text>
              </Pressable>
              <Link href="/trip" accessibilityRole="button" style={styles.tripLink}>
                <Text style={styles.tripLinkText}>ดู My Trip →</Text>
              </Link>
            </View>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>CURATED COLLECTION</Text>
              <Text style={styles.sectionTitle}>10 สถานที่สำคัญ</Text>
            </View>
            <Text style={styles.listHint}>แตะเพื่อเลือก</Text>
          </View>
        </View>
      }
      renderItem={({ item, index }) => {
        const selected = item.id === selectedPoi.id;

        return (
          <Pressable
            accessibilityHint="แสดงตำแหน่งสถานที่นี้บนแผนที่"
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => selectPoi(item)}
            style={({ pressed }) => [
              styles.poiCard,
              selected && styles.poiCardSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.index, selected && styles.indexSelected]}>
              <Text style={[styles.indexText, selected && styles.indexTextSelected]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={[styles.poiIcon, selected && styles.poiIconSelected]}>
              <Text style={styles.poiIconText}>{item.icon}</Text>
            </View>
            <View style={styles.poiCopy}>
              <Text style={[styles.poiName, selected && styles.poiNameSelected]}>
                {item.name}
              </Text>
              <Text numberOfLines={1} style={[styles.poiMeta, selected && styles.poiMetaSelected]}>
                {item.category} · {item.address}
              </Text>
            </View>
            <View style={[styles.chevronBubble, selected && styles.chevronBubbleSelected]}>
              <Text style={[styles.chevron, selected && styles.chevronSelected]}>
                {selected ? '✓' : '›'}
              </Text>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.emptySearch}>
          <Text style={styles.emptySearchTitle}>ไม่พบสถานที่</Text>
          <Text style={styles.emptySearchText}>ลองเปลี่ยนคำค้นหา หรือเลือกหมวด “ทั้งหมด”</Text>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 17,
    paddingBottom: 44,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: 34,
    backgroundColor: colors.navy,
    padding: 22,
    marginTop: 8,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.24,
    shadowRadius: 24,
    elevation: 10,
  },
  orbitLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    top: -92,
    right: -54,
    borderRadius: 105,
    borderWidth: 34,
    borderColor: 'rgba(243,185,40,0.10)',
  },
  orbitSmall: {
    position: 'absolute',
    width: 95,
    height: 95,
    bottom: -45,
    left: 115,
    borderRadius: 48,
    backgroundColor: 'rgba(255,107,74,0.12)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 54,
    height: 54,
    borderRadius: 18,
    marginRight: 11,
  },
  brandEyebrow: {
    color: colors.gold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.1,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.7,
    marginTop: 2,
  },
  heroBadge: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBadgeNumber: {
    color: colors.gold,
    fontSize: 19,
    lineHeight: 21,
    fontWeight: '900',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 6,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    lineHeight: 38,
    fontWeight: '900',
    marginTop: 25,
  },
  heroSubtitle: {
    maxWidth: 315,
    color: '#BFCBE0',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 9,
  },
  heroChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  heroChipGold: {
    borderRadius: 999,
    backgroundColor: colors.gold,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  heroChipGoldText: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  heroChipDark: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  heroChipDarkText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  mapSectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  sectionEyebrow: {
    color: colors.goldDark,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#E1F5ED',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 2,
  },
  liveDot: {
    color: colors.success,
    fontSize: 8,
    marginRight: 5,
  },
  liveText: {
    color: colors.success,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  selectedCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 17,
    marginTop: 15,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  selectedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: colors.surfaceWarm,
  },
  selectedIconText: {
    fontSize: 25,
  },
  selectedCopy: {
    flex: 1,
    marginLeft: 13,
  },
  selectedCategory: {
    color: colors.goldDark,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  selectedName: {
    color: colors.text,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  selectedMark: {
    width: 29,
    height: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.gold,
    marginLeft: 8,
  },
  selectedMarkText: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: '900',
  },
  selectedAddress: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 13,
  },
  selectedDescription: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 18,
    marginTop: 8,
  },
  coordinateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 13,
    backgroundColor: '#F4F0E6',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 13,
  },
  coordinateLabel: {
    color: colors.textMuted,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  coordinates: {
    color: colors.navy,
    fontSize: 9,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 34,
    marginBottom: 12,
    paddingHorizontal: 3,
  },
  listHint: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 4,
  },
  poiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 12,
    marginBottom: 11,
  },
  poiCardSelected: {
    borderWidth: 2,
    borderColor: colors.gold,
    backgroundColor: colors.navy,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 15,
    elevation: 5,
  },
  index: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F0ECE1',
  },
  indexSelected: {
    backgroundColor: colors.gold,
  },
  indexText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '900',
  },
  indexTextSelected: {
    color: colors.navy,
  },
  poiIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.surfaceWarm,
    marginLeft: 8,
  },
  poiIconSelected: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  poiIconText: {
    fontSize: 21,
  },
  poiCopy: {
    flex: 1,
    marginLeft: 11,
  },
  poiName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  poiNameSelected: {
    color: '#FFFFFF',
  },
  poiMeta: {
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
  poiMetaSelected: {
    color: '#BFCBE0',
  },
  chevronBubble: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: '#F4F0E6',
    marginLeft: 8,
  },
  chevronBubbleSelected: {
    backgroundColor: colors.gold,
  },
  chevron: {
    color: colors.textMuted,
    fontSize: 20,
    lineHeight: 21,
  },
  chevronSelected: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: '900',
  },
  tripActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  tripButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: colors.gold,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tripButtonSelected: {
    backgroundColor: colors.navy,
  },
  tripButtonText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: '900',
  },
  tripButtonTextSelected: {
    color: colors.gold,
  },
  tripLink: {
    marginLeft: 9,
    borderRadius: 14,
    backgroundColor: '#EEF2F7',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  tripLinkText: {
    color: colors.navy,
    fontSize: 10,
    fontWeight: '900',
  },
  searchSection: {
    marginTop: 28,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
  },
  searchTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 11,
  },
  searchInput: {
    minHeight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F8F9FB',
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  filterRow: {
    paddingTop: 12,
    paddingBottom: 2,
    paddingRight: 8,
  },
  filterChip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F4F0E6',
    paddingHorizontal: 14,
    marginRight: 8,
  },
  filterChipSelected: {
    borderColor: colors.navy,
    backgroundColor: colors.navy,
  },
  filterChipText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '800',
  },
  filterChipTextSelected: {
    color: colors.gold,
  },
  searchMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  searchMeta: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  clearFilterText: {
    color: colors.goldDark,
    fontSize: 10,
    fontWeight: '900',
  },
  emptySearch: {
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F4F0E6',
    paddingHorizontal: 20,
    paddingVertical: 26,
    marginTop: 4,
  },
  emptySearchTitle: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: '900',
  },
  emptySearchText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 5,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.985 }],
  },
});
