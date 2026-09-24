import { FlatList, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../../src/components/EventUI';
import { EventCard } from '../../src/features/events/components/EventCard';
import { useEventFavorites } from '../../src/features/events/FavoritesProvider';
import { useEvents } from '../../src/features/events/hooks/useEvents';

export default function Favorites() {
  const { events } = useEvents();
  const { ids, ready, toggle } = useEventFavorites();
  return <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
    <FlatList
      contentContainerStyle={styles.content}
      data={events.filter((event) => ids.includes(event.id))}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={<Text accessibilityRole="header" style={styles.title}>กิจกรรมที่บันทึก</Text>}
      ListEmptyComponent={<><Text style={styles.text}>{ready ? 'ยังไม่มีกิจกรรมที่บันทึก' : 'กำลังอ่านรายการโปรด…'}</Text><Action title="กลับไปเลือกกิจกรรม" onPress={() => router.push('/events')} /></>}
      renderItem={({ item }) => <EventCard event={item} isFavorite onToggleFavorite={(id) => { void toggle(id); }}
        onOpen={(id) => router.push({ pathname: '/events/[id]', params: { id } })}
        onDelete={() => router.push({ pathname: '/events/[id]', params: { id: item.id } })} />}
    />
  </SafeAreaView>;
}
