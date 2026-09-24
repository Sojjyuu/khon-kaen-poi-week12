import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { registerForEvent, uploadRegistrationPhoto, validatePhoto, validateRegistration, type PhotoDraft } from '../src/features/events/registration';
import { isEventId } from '../src/features/events/types';
import { ApiError } from '../src/services/campusApi';

export default function Register() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { session, logout } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<PhotoDraft | null>(null);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const submitting = useRef(false);
  const eventId = isEventId(id) ? id : null;
  const choosePhoto = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPermissionBlocked(!permission.canAskAgain);
        setError(source === 'camera' ? 'ยังไม่ได้อนุญาตกล้อง' : 'ยังไม่ได้อนุญาตรูปภาพ');
        return;
      }
      setPermissionBlocked(false);
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled) return;
      const chosen = result.assets[0];
      if (!chosen?.uri) return;
      const draft: PhotoDraft = { uri: chosen.uri, mimeType: chosen.mimeType, fileSize: chosen.fileSize, fileName: chosen.fileName };
      const validation = validatePhoto(draft);
      if (validation) { setError(validation); return; }
      setPhoto(draft);
      setError('');
    } catch {
      setError('เปิดกล้องหรือคลังรูปไม่ได้ กรุณาลองอีกครั้ง');
    }
  };
  const showPhotoActions = () => Alert.alert('รูปประกอบกิจกรรม', 'เลือกรูปที่จะส่งพร้อมการลงทะเบียน', [
    { text: 'ถ่ายรูป', onPress: () => { void choosePhoto('camera'); } },
    { text: 'เลือกรูปจากเครื่อง', onPress: () => { void choosePhoto('library'); } },
    { text: 'ยกเลิก', style: 'cancel' },
  ]);
  const submit = async () => {
    if (submitting.current || session.status !== 'authenticated' || !eventId) return;
    const validation = validateRegistration(fullName, email);
    if (validation) { setError(validation); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    let registered = false;
    try {
      const result = await registerForEvent(eventId, fullName, email, session.token);
      registered = true;
      if (photo) {
        const registrationId = result && typeof result === 'object'
          ? (result as { registrationId?: unknown }).registrationId : undefined;
        if (typeof registrationId !== 'string') throw new Error('missing-registration-id');
        await uploadRegistrationPhoto(eventId, registrationId, photo, session.token);
      }
      router.replace({ pathname: '/events/[id]', params: { id: eventId } });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        await logout();
        router.replace('/login');
      } else setError(registered
        ? 'ลงทะเบียนแล้ว แต่ส่งรูปไม่สำเร็จ ข้อมูลยังอยู่ กรุณาลองส่งอีกครั้ง'
        : 'ลงทะเบียนไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ กรุณาลองอีกครั้ง');
    }
    finally { submitting.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>ลงทะเบียนกิจกรรม</Text>
      {!eventId && <Text accessibilityRole="alert" style={styles.error}>รหัสกิจกรรมไม่ถูกต้อง</Text>}
      <Text style={styles.text}>ชื่อ-นามสกุล</Text>
      <TextInput accessibilityLabel="ชื่อ-นามสกุล" onChangeText={setFullName} style={styles.input} value={fullName} />
      <Text style={styles.text}>อีเมล</Text>
      <TextInput accessibilityLabel="อีเมล" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} />
      <Text accessibilityRole="header" style={styles.subtitle}>รูปประกอบกิจกรรม (ไม่บังคับ)</Text>
      {photo && <Image source={{ uri: photo.uri }} style={{ height: 180, borderRadius: 12 }} accessibilityLabel="ตัวอย่างรูปประกอบกิจกรรม" />}
      <Action title={photo ? 'เปลี่ยนรูป' : 'ถ่ายรูปหรือเลือกรูป'} disabled={busy} onPress={showPhotoActions} />
      {photo && <Action title="นำรูปออก" disabled={busy} onPress={() => setPhoto(null)} />}
      {permissionBlocked && <Action title="เปิดการตั้งค่าเพื่ออนุญาต" onPress={() => { void Linking.openSettings(); }} />}
      <Text style={styles.text}>รองรับ JPEG/PNG ไม่เกิน 3 MB; รูปจะส่งเมื่อกดลงทะเบียน</Text>
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Action title={busy ? 'กำลังส่ง…' : 'ลงทะเบียน'} disabled={busy || !eventId} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
