import { useCallback, useMemo, useRef, useState } from 'react';
import { Link, router, useFocusEffect } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CoverPhoto } from '../components/CoverPhoto';
import { PoiMap } from '../components/PoiMap';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { getFavoritePoiIds, toggleFavoritePoi } from '../services/favorites';
import { colors } from '../theme/colors';
import { useReduceMotion } from '../features/accessibility/hooks/useReduceMotion';
import type { PointOfInterest } from '../types/poi';


const categories = ['ทั้งหมด', ...Array.from(new Set(pointsOfInterest.map((poi) => poi.category)))];

export function PoiExplorerScreen() {
  const [selectedPoi, setSelectedPoi] = useState(pointsOfInterest[0]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const listRef = useRef<FlatList<PointOfInterest>>(null);
  const reduceMotion = useReduceMotion();
  const mapOffset = useRef(0);

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

  const toggleTrip = useCallback(async () => {
    setFavoriteIds(await toggleFavoritePoi(selectedPoi.id));
  }, [selectedPoi.id]);

  const selectPoi = useCallback((poi: PointOfInterest) => {
    setSelectedPoi(poi);
    setTimeout(() => {
      listRef.current?.scrollToOffset({ offset: mapOffset.current, animated: !reduceMotion });
    }, 80);
  }, [reduceMotion]);

  return (
    <FlatList
      style={{ flex: 1 }}
      ref={listRef}
      contentContainerStyle={styles.content}
      data={filteredPoints}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View style={styles.shortcuts}>
            <Pressable accessibilityRole="button" onPress={() => router.push('/trip')} style={styles.shortcut}>
              <Text style={styles.shortcutText}>ทริปของฉัน →</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/camera')} style={[styles.shortcut, { backgroundColor: '#E8EEF5' }]}>
              <Text style={styles.shortcutText}>บันทึกภาพ →</Text>
            </Pressable>
          </View>

          <View style={styles.searchSection}>
            <Text style={styles.sectionEyebrow}>SEARCH & FILTER</Text>
            <Text accessibilityRole="header" style={styles.searchTitle}>ค้นหาสถานที่</Text>
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
                    accessibilityLabel={`กรองหมวด ${category}, ${category === 'ทั้งหมด' ? pointsOfInterest.length : pointsOfInterest.filter((poi) => poi.category === category).length} สถานที่`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedCategory(category)}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
                      {category} ({category === 'ทั้งหมด' ? pointsOfInterest.length : pointsOfInterest.filter((poi) => poi.category === category).length})
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
                  accessibilityLabel="ล้างคำค้นหาและตัวกรอง"
                  accessibilityRole="button"
                  hitSlop={6}
                  style={styles.clearFilterButton}
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


          <View style={styles.mapSectionHeader} onLayout={(event) => { mapOffset.current = event.nativeEvent.layout.y; }}>
            <View>
              <Text style={styles.sectionEyebrow}>INTERACTIVE MAP</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>แผนที่สำรวจ</Text>
              <Text style={styles.sectionSubtitle}>กด “ขยายแผนที่” เพื่อดูแบบเต็มจอ</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveDot}>●</Text>
              <Text style={styles.liveText}>SELECTED</Text>
            </View>
          </View>

          <PoiMap poi={selectedPoi} />

          <View
            style={styles.selectedCard}
          >
            <CoverPhoto poiId={selectedPoi.id} title={selectedPoi.name} height={180} />
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
              <Link href={{ pathname: '/events', params: { poiId: selectedPoi.id } }} accessibilityRole="button" style={styles.tripLink}>
                <Text style={styles.tripLinkText}>สร้างกิจกรรมที่นี่ →</Text>
              </Link>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={favoriteIds.includes(selectedPoi.id) ? 'นำสถานที่ออกจากทริป' : 'เพิ่มสถานที่เข้าทริป'}
                accessibilityState={{ selected: favoriteIds.includes(selectedPoi.id) }}
                onPress={() => void toggleTrip()}
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
              <Text accessibilityRole="header" style={styles.sectionTitle}>{filteredPoints.length} สถานที่{selectedCategory === 'ทั้งหมด' ? 'น่าไป' : ` · ${selectedCategory}`}</Text>
            </View>
            <Text style={styles.listHint}>แตะเพื่อเลือก</Text>
          </View>
        </View>
      }
      renderItem={({ item, index }) => {
        const selected = item.id === selectedPoi.id;

        return (
          <Pressable
            accessibilityLabel={`${item.name}, ${item.category}, ${item.address}`}
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
            <CoverPhoto poiId={item.id} title={item.name} height={156} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[styles.index, selected && styles.indexSelected]}>
              <Text style={[styles.indexText, selected && styles.indexTextSelected]}>
                {String(index + 1).padStart(2, '0')}
              </Text>
            </View>
            <View style={styles.poiCopy}>
              <Text style={[styles.poiName, selected && styles.poiNameSelected]}>
                {item.name}
              </Text>
              <Text style={[styles.poiMeta, selected && styles.poiMetaSelected]}>
                {item.category} · {item.address}
              </Text>
            </View>
            <View style={[styles.chevronBubble, selected && styles.chevronBubbleSelected]}>
              <Text style={[styles.chevron, selected && styles.chevronSelected]}>
                {selected ? '✓' : '›'}
              </Text>
            </View>
            </View>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View accessibilityLiveRegion="polite" style={styles.emptySearch}>
          <Text accessibilityRole="header" style={styles.emptySearchTitle}>ไม่พบสถานที่</Text>
          <Text style={styles.emptySearchText}>ลองเปลี่ยนคำค้นหา หรือเลือกหมวด “ทั้งหมด”</Text>
        </View>
      }
      ListFooterComponent={<Link href="/photo-credits" style={{ paddingVertical: 16, color: colors.textMuted }}>แหล่งที่มาของรูปสถานที่</Link>}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 17,
    paddingBottom: 44,
  },
  shortcuts: { flexDirection: 'row', gap: 10, paddingTop: 12 },
  shortcut: { flex: 1, minWidth: 0, minHeight: 52, padding: 12, borderRadius: 16, backgroundColor: '#FFF0BC', justifyContent: 'center' },
  shortcutText: { fontSize: 15, fontWeight: '800', color: colors.navy, textAlign: 'center' },
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
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
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
    gap: 10,
    marginTop: 14,
  },
  tripButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    minHeight: 48,
    textAlign: 'center',
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
    minHeight: 48,
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
  clearFilterButton: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 4,
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
