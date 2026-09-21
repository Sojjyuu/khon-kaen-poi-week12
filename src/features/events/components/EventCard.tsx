import { memo } from 'react';
import { Text, View } from 'react-native';

import { Action, eventStyles as styles } from '../../../components/EventUI';
import { pointsOfInterest } from '../../../data/pointsOfInterest';
import { formatEventTime } from '../../../repositories/eventRepository';
import type { CampusEvent } from '../types';

type Props = {
  event: CampusEvent;
  onOpen: (id: string) => void;
};

export const EventCard = memo(function EventCard({ event, onOpen }: Props) {
  const place = pointsOfInterest.find((poi) => poi.id === event.poiId)?.name;
  return (
    <View style={styles.card}>
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
    </View>
  );
});
