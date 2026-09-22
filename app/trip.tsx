import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { pointsOfInterest } from '../src/data/pointsOfInterest';
import { getFavoritePoiIds, toggleFavoritePoi } from '../src/services/favorites';
import { colors } from '../src/theme/colors';

export default function MyTripScreen() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const load = useCallback(() => {
    getFavoritePoiIds().then(setFavoriteIds);
  }, []);

  useFocusEffect(load);

  const selected = pointsOfInterest.filter((poi) => favoriteIds.includes(poi.id));

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        contentContainerStyle={styles.content}
        data={selected}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={styles.headerCard}>
            <Text style={styles.eyebrow}>MY TRIP</Text>
            <Text style={styles.title}>สถานที่ที่อยากไป</Text>
            <Text style={styles.subtitle}>
              ประยุกต์แนวคิดจาก Assignment “Team Builder” เป็นการเลือกสถานที่เข้าทริปของเรา
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.count}>{selected.length}</Text>
              <Text style={styles.countLabel}>SELECTED</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>ยังไม่มีสถานที่ในทริป</Text>
            <Text style={styles.emptyText}>กลับหน้าแรกแล้วกด “เพิ่มเข้าทริป” ที่สถานที่ที่สนใจ</Text>
            <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
              <Text style={styles.primaryButtonText}>กลับไปเลือกสถานที่</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.card}>
            <View style={styles.numberBubble}>
              <Text style={styles.numberText}>{String(index + 1).padStart(2, '0')}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.category}>{item.category}</Text>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.address}>{item.address}</Text>
            </View>
            <Pressable
              accessibilityLabel={`นำ ${item.name} ออกจากทริป`}
              accessibilityRole="button"
              onPress={async () => setFavoriteIds(await toggleFavoritePoi(item.id))}
              style={styles.removeButton}
            >
              <Text style={styles.removeText}>ลบ</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 40 },
  headerCard: { borderRadius: 28, backgroundColor: colors.navy, padding: 22, marginBottom: 18 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#C9D4E5', fontSize: 12, lineHeight: 18, marginTop: 8, paddingRight: 28 },
  countBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'baseline', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.10)', paddingHorizontal: 13, paddingVertical: 8, marginTop: 17 },
  count: { color: colors.gold, fontSize: 19, fontWeight: '900', marginRight: 7 },
  countLabel: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 22, backgroundColor: '#FFFFFF', padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#E5EAF1' },
  numberBubble: { width: 43, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.navy, marginRight: 12 },
  numberText: { color: colors.gold, fontSize: 12, fontWeight: '900' },
  copy: { flex: 1 },
  category: { color: colors.goldDark, fontSize: 9, fontWeight: '900' },
  name: { color: colors.navy, fontSize: 15, fontWeight: '900', marginTop: 2 },
  address: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  removeButton: { borderRadius: 13, backgroundColor: '#FCE8E5', paddingHorizontal: 12, paddingVertical: 9, marginLeft: 8 },
  removeText: { color: '#A23D32', fontSize: 11, fontWeight: '900' },
  empty: { alignItems: 'center', borderRadius: 24, backgroundColor: '#FFFFFF', padding: 28 },
  emptyTitle: { color: colors.navy, fontSize: 18, fontWeight: '900' },
  emptyText: { color: colors.textMuted, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 7 },
  primaryButton: { borderRadius: 15, backgroundColor: colors.gold, paddingHorizontal: 18, paddingVertical: 12, marginTop: 18 },
  primaryButtonText: { color: colors.navy, fontWeight: '900' },
});
