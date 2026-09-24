import { memo } from 'react';
import { Text, View } from 'react-native';

import { Action, eventStyles as styles } from '../../../components/EventUI';
import { pointsOfInterest } from '../../../data/pointsOfInterest';
import { formatEventTime } from '../../../repositories/eventRepository';
import { isUserCreatedEventId, type CampusEvent } from '../types';

type Props = {
  event: CampusEvent;
  onOpen: (id: string) => void;
  onDelete: (event: CampusEvent) => void;
  deleting?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export const EventCard = memo(function EventCard({
  event,
  onOpen,
  onDelete,
  deleting = false,
  isFavorite = false,
  onToggleFavorite,
}: Props) {
  const place = pointsOfInterest.find((poi) => poi.id === event.poiId)?.name;
  const canDelete = isUserCreatedEventId(event.id);

  return (
    <View style={styles.card}>
      {canDelete && (
        <Text accessibilityLabel="กิจกรรมของคุณ ลบได้" style={styles.badgeText}>
          ★ กิจกรรมของคุณ • ลบได้
        </Text>
      )}
      <Text accessibilityRole="header" style={styles.subtitle}>
        {event.title}
      </Text>
      <Text style={styles.text}>{formatEventTime(event.startsAt)}</Text>
      <Text style={styles.text}>⌖ {place}</Text>
      <Action
        title="ดูรายละเอียดและตั้งเตือน"
        accessibilityHint="เปิดหน้ารายละเอียดของกิจกรรมนี้"
        onPress={() => onOpen(event.id)}
      />
      {onToggleFavorite && <Action
        title={isFavorite ? 'นำกิจกรรมออกจากรายการโปรด' : 'เพิ่มกิจกรรมในรายการโปรด'}
        onPress={() => onToggleFavorite(event.id)}
      />}
      {canDelete && (
        <Action
          title={deleting ? 'กำลังลบ…' : 'ลบกิจกรรมนี้'}
          accessibilityHint="ลบกิจกรรมที่คุณสร้างออกจากเครื่อง"
          disabled={deleting}
          variant="danger"
          onPress={() => onDelete(event)}
        />
      )}
    </View>
  );
});
