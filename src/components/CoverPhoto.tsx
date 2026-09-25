import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { placePhotos } from '../data/placePhotos';

export function CoverPhoto({ poiId, title, height = 176 }: { poiId: string; title: string; height?: number }) {
  return <Photo key={poiId} poiId={poiId} title={title} height={height} />;
}
function Photo({ poiId, title, height }: { poiId: string; title: string; height: number }) {
  const photo = placePhotos[poiId];
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <View style={[styles.frame, { height }]}>
    {(!loaded || failed || !photo) && <View style={styles.placeholder}>
      <Text style={styles.label}>{failed || !photo ? 'ยังแสดงรูปไม่ได้' : 'กำลังโหลดรูป…'}</Text>
    </View>}
    {!!photo && !failed && <Image source={{ uri: photo.uri }} style={styles.image}
      resizeMode="cover" accessibilityLabel={`รูปสถานที่ ${title}`}
      onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
  </View>;
}
const styles = StyleSheet.create({
  image: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  frame: { width: '100%', flexShrink: 0, overflow: 'hidden', borderRadius: 16, backgroundColor: '#E8EDF1', marginBottom: 12 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  label: { color: '#546278', fontSize: 13 },
});
