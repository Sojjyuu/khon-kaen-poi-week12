import { Alert, Linking, ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { placePhotos } from '../src/data/placePhotos';
import { pointsOfInterest } from '../src/data/pointsOfInterest';
import { Action, eventStyles as styles } from '../src/components/EventUI';

export default function PhotoCredits() {
  return <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
    <Stack.Screen options={{ title: 'แหล่งที่มาของรูป' }} />
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.text}>รูปจาก Wikimedia Commons ปรับขนาดและครอบเพื่อแสดงในแอป ภาพอาจถ่ายในอดีต รูปกิจกรรมใช้สถานที่ประกอบ ไม่ใช่ภาพของกิจกรรมที่จัดจริง</Text>
      {Object.entries(placePhotos).map(([id, photo]) => <View key={id} style={styles.card}>
        <Text style={styles.subtitle}>{pointsOfInterest.find(p => p.id === id)?.name}</Text>
        <Text style={styles.text}>{photo.author} · {photo.license}</Text>
        <Action title="ดูรูปต้นฉบับและเงื่อนไขการใช้" onPress={() => { void Linking.openURL(photo.source).catch(() => Alert.alert('เปิดลิงก์ไม่ได้')); }} />
      </View>)}
    </ScrollView>
  </SafeAreaView>;
}
