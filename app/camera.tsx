import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Asset, requestPermissionsAsync } from 'expo-media-library';
import { captureRef } from 'react-native-view-shot';
import { colors } from '../src/theme/colors';

type FilterId = 'original' | 'golden' | 'cool' | 'rose';

type FilterOption = {
  id: FilterId;
  label: string;
  hint: string;
  overlay: string;
};

const FILTERS: FilterOption[] = [
  { id: 'original', label: 'Original', hint: 'สีจริง', overlay: 'transparent' },
  { id: 'golden', label: 'Golden', hint: 'โทนอุ่น', overlay: 'rgba(255, 177, 66, 0.18)' },
  { id: 'cool', label: 'Cool', hint: 'โทนเย็น', overlay: 'rgba(64, 139, 255, 0.18)' },
  { id: 'rose', label: 'Rose', hint: 'โทนชมพู', overlay: 'rgba(255, 99, 132, 0.14)' },
];

export default function CameraScreen() {
  const previewRef = useRef<View>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<FilterId>('original');
  const [message, setMessage] = useState('ถ่ายรูปหรือเลือกรูป แล้วเลือกฟิลเตอร์ก่อนบันทึกลงเครื่อง');
  const [isSaving, setIsSaving] = useState(false);

  const selectedFilter = FILTERS.find((filter) => filter.id === filterId) ?? FILTERS[0];

  const applyNewImage = (uri: string, source: 'camera' | 'library') => {
    setImageUri(uri);
    setFilterId('original');
    setMessage(
      source === 'camera'
        ? 'ถ่ายรูปแล้ว — เลือกฟิลเตอร์ที่ชอบ จากนั้นกดบันทึกภาพ'
        : 'เลือกรูปแล้ว — เลือกฟิลเตอร์ที่ชอบ จากนั้นกดบันทึกภาพ',
    );
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage('ไม่ได้รับสิทธิ์ใช้กล้อง กรุณาอนุญาต Camera permission แล้วลองอีกครั้ง');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.95,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      applyNewImage(result.assets[0].uri, 'camera');
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage('ไม่ได้รับสิทธิ์เข้าถึงรูปภาพ กรุณาอนุญาต Photo Library permission');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.95,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      applyNewImage(result.assets[0].uri, 'library');
    }
  };

  const savePhoto = async () => {
    if (!imageUri || !previewRef.current) {
      setMessage('กรุณาถ่ายรูปหรือเลือกรูปก่อนบันทึก');
      return;
    }

    if (Platform.OS === 'web') {
      setMessage('การบันทึกลง Photos ใช้ได้บน iOS / Android เท่านั้น');
      return;
    }

    try {
      setIsSaving(true);
      setMessage('กำลังบันทึกภาพพร้อมฟิลเตอร์...');

      const permission = await requestPermissionsAsync(true);
      if (permission.status !== 'granted') {
        setMessage('ไม่ได้รับสิทธิ์บันทึกรูป กรุณาอนุญาต Photo Library permission');
        return;
      }

      const capturedUri = await captureRef(previewRef, {
        format: 'jpg',
        quality: 0.95,
        result: 'tmpfile',
      });

      await Asset.create(capturedUri);
      setMessage(`บันทึกภาพ (${selectedFilter.label}) ลง Photos เรียบร้อยแล้ว ✓`);
      Alert.alert('บันทึกสำเร็จ', 'รูปพร้อมฟิลเตอร์ถูกบันทึกลง Photos แล้ว');
    } catch (error) {
      console.error('Save photo failed:', error);
      setMessage('บันทึกรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      Alert.alert('บันทึกไม่สำเร็จ', 'กรุณาตรวจสอบสิทธิ์ Photos แล้วลองอีกครั้ง');
    } finally {
      setIsSaving(false);
    }
  };

  const clearPhoto = () => {
    setImageUri(null);
    setFilterId('original');
    setMessage('ถ่ายรูปหรือเลือกรูป แล้วเลือกฟิลเตอร์ก่อนบันทึกลงเครื่อง');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.eyebrow}>TRAVEL CAMERA</Text>
              <Text style={styles.title}>ภาพบันทึกการเดินทาง</Text>
            </View>
            <View style={styles.cameraBadge}>
              <Text style={styles.cameraBadgeText}>PHOTO</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            ถ่ายภาพหรือเลือกจากคลังภาพ → เลือกฟิลเตอร์ → Preview → Save ลง Photos
          </Text>
        </View>

        <View ref={previewRef} collapsable={false} style={styles.preview}>
          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
              <View
                pointerEvents="none"
                style={[styles.filterOverlay, { backgroundColor: selectedFilter.overlay }]}
              />
              <View pointerEvents="none" style={styles.previewLabelWrap}>
                <Text style={styles.previewLabel}>{selectedFilter.label.toUpperCase()}</Text>
              </View>
            </>
          ) : (
            <View style={styles.placeholder}>
              <View style={styles.placeholderCircle}>
                <Text style={styles.placeholderIcon}>◎</Text>
              </View>
              <Text style={styles.placeholderTitle}>ยังไม่มีรูป</Text>
              <Text style={styles.placeholderText}>เปิดกล้องหรือเลือกรูปจากเครื่องเพื่อเริ่มต้น</Text>
            </View>
          )}
        </View>

        {imageUri ? (
          <View style={styles.filterSection}>
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionTitle}>เลือกฟิลเตอร์</Text>
              <Text style={styles.sectionMeta}>{selectedFilter.hint}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const selected = filter.id === filterId;
                return (
                  <Pressable
                    key={filter.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      setFilterId(filter.id);
                      setMessage(`เลือกฟิลเตอร์ ${filter.label} แล้ว — พร้อมบันทึก`);
                    }}
                    style={[styles.filterChip, selected && styles.filterChipSelected]}
                  >
                    <View style={[styles.filterSwatch, { backgroundColor: filter.overlay === 'transparent' ? '#E9EDF2' : filter.overlay }]} />
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{filter.label}</Text>
                    <Text style={[styles.filterChipHint, selected && styles.filterChipHintSelected]}>{filter.hint}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.messageCard}>
          <Text style={styles.message}>{message}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={takePhoto} style={styles.primaryButton}>
            <Text style={styles.primaryText}>{imageUri ? 'ถ่ายรูปใหม่' : 'เปิดกล้อง'}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={pickPhoto} style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>เลือกรูปจากเครื่อง</Text>
          </Pressable>

          {imageUri ? (
            <>
              <Pressable
                accessibilityRole="button"
                disabled={isSaving}
                onPress={savePhoto}
                style={[styles.saveButton, isSaving && styles.buttonDisabled]}
              >
                {isSaving ? <ActivityIndicator color={colors.navy} /> : <Text style={styles.saveText}>บันทึกภาพลง Photos</Text>}
              </Pressable>
              <Pressable accessibilityRole="button" onPress={clearPhoto} style={styles.clearButton}>
                <Text style={styles.clearText}>ล้างรูป</Text>
              </Pressable>
            </>
          ) : null}
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>CAMERA FLOW</Text>
          <Text style={styles.noteText}>
            ฟิลเตอร์จะถูกใส่หลังจากถ่ายรูป ไม่ใช่แบบ Real-time และถูกบันทึกติดไปกับภาพเมื่อกด Save
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 34 },
  header: {
    borderRadius: 28,
    backgroundColor: colors.navy,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(243,185,40,0.28)',
  },
  headerTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { color: colors.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '900', marginTop: 5 },
  subtitle: { color: '#C8D3E4', fontSize: 12, lineHeight: 18, marginTop: 9 },
  cameraBadge: { borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: 10, paddingVertical: 6 },
  cameraBadgeText: { color: colors.navy, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  preview: {
    height: 360,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#E8EDF3',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#DDE3EA',
  },
  image: { width: '100%', height: '100%' },
  filterOverlay: { ...StyleSheet.absoluteFill },
  previewLabelWrap: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(5, 20, 44, 0.76)',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  previewLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  placeholderCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7DF',
    borderWidth: 1,
    borderColor: '#F0D58F',
  },
  placeholderIcon: { color: colors.goldDark, fontSize: 52, fontWeight: '300', marginTop: -3 },
  placeholderTitle: { color: colors.navy, fontSize: 17, fontWeight: '900', marginTop: 14 },
  placeholderText: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 5, textAlign: 'center' },
  filterSection: {
    marginTop: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DFCD',
    paddingVertical: 15,
  },
  sectionHeadingRow: { paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  sectionMeta: { color: colors.goldDark, fontSize: 10, fontWeight: '800' },
  filterRow: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 2, gap: 9 },
  filterChip: {
    minWidth: 86,
    borderRadius: 17,
    backgroundColor: '#F4F6F9',
    borderWidth: 1,
    borderColor: '#E4E9EF',
    padding: 10,
  },
  filterChipSelected: { backgroundColor: colors.navy, borderColor: colors.gold },
  filterSwatch: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: 'rgba(4,18,40,0.08)' },
  filterChipText: { color: colors.navy, fontSize: 11, fontWeight: '900', marginTop: 7 },
  filterChipTextSelected: { color: '#FFFFFF' },
  filterChipHint: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 2 },
  filterChipHintSelected: { color: '#BFCBE0' },
  messageCard: { marginTop: 13, borderRadius: 16, backgroundColor: '#FFF8E7', paddingHorizontal: 13, paddingVertical: 11 },
  message: { color: '#72551A', fontSize: 10, lineHeight: 16, textAlign: 'center', fontWeight: '700' },
  actions: { marginTop: 14 },
  primaryButton: { alignItems: 'center', borderRadius: 17, backgroundColor: colors.gold, paddingVertical: 14 },
  primaryText: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', borderRadius: 17, backgroundColor: colors.navy, paddingVertical: 14, marginTop: 10 },
  secondaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  saveButton: {
    alignItems: 'center',
    borderRadius: 17,
    backgroundColor: '#E8B32B',
    paddingVertical: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C99214',
  },
  saveText: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.58 },
  clearButton: { alignItems: 'center', paddingVertical: 12, marginTop: 2 },
  clearText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  noteCard: { marginTop: 10, borderRadius: 20, backgroundColor: '#FFFFFF', padding: 15, borderWidth: 1, borderColor: '#E3E7ED' },
  noteTitle: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  noteText: { color: colors.textMuted, fontSize: 10, lineHeight: 16, marginTop: 5 },
});
