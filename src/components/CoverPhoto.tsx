import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { pointsOfInterest } from '../data/pointsOfInterest';
import { placePhotos } from '../data/placePhotos';

export function CoverPhoto({ poiId, title, height = 176 }: { poiId: string; title: string; height?: number }) {
  return <Photo key={poiId} poiId={poiId} title={title} height={height} />;
}
function Photo({ poiId, title, height }: { poiId: string; title: string; height: number }) {
  const photo = placePhotos[poiId];
  const place = pointsOfInterest.find((poi) => poi.id === poiId);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  return <View style={[styles.frame, { height }]}>
    {(!loaded || failed || !photo) && <View style={styles.placeholder}>
      {!photo && <><Text accessible={false} style={{ fontSize: 36 }}>{place?.icon ?? '📍'}</Text><Text style={{ color: '#0C203B', fontWeight: '700', marginVertical: 8 }}>{place?.category ?? 'สถานที่'}</Text></>}
      <Text style={styles.label}>{!photo ? 'ยังไม่มีภาพสถานที่' : failed ? 'ยังแสดงรูปไม่ได้' : 'กำลังโหลดรูป…'}</Text>
    {failed && <Pressable accessibilityRole="button" accessibilityLabel="ลองโหลดรูปอีกครั้ง" onPress={() => { setLoaded(false); setFailed(false); setAttempt(value => value + 1); }} style={{ padding: 12, minHeight: 44 }}><Text style={styles.label}>ลองโหลดรูปอีกครั้ง</Text></Pressable>}
    </View>}
    {!!photo && !failed && <Image key={attempt} source={{ uri: photo.uri }} style={styles.image}
      resizeMode="cover" accessibilityLabel={photo.caption ?? `รูปสถานที่ ${title}`}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
    {photo?.caption && loaded && !failed && <Text style={styles.caption}>{photo.caption}</Text>}
  </View>;
}
const styles = StyleSheet.create({
  caption: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: '#0C203BDD', color: 'white', fontSize: 12 },
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  frame: { width: '100%', flexShrink: 0, overflow: 'hidden', borderRadius: 16, backgroundColor: '#E8EDF1', marginBottom: 12 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  label: { color: '#546278', fontSize: 13 },
});
