import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Action, eventStyles as s } from '../src/components/EventUI';
export default function NotFound() {
  return <View style={s.content}><Text style={s.title}>ไม่พบหน้านี้</Text>
    <Action title="กลับรายการกิจกรรม" onPress={() => router.replace('/events')} /></View>;
}
