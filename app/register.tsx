import { useRef, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, Text, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { registerForEvent, uploadRegistrationPhoto, validatePhoto, validateRegistration, type PhotoDraft } from '../src/features/events/registration';
import { isEventId } from '../src/features/events/types';
import { eventRepository } from '../src/repositories/eventRepository';
import { ApiConnectionError, ApiError } from '../src/services/campusApi';

export default function Register() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { session, logout } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
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
    let stage = 'load-event';
    try {
      const local = eventId.startsWith('explore-') || eventId.startsWith('local-');
      const event = local ? await eventRepository.findById(eventId) : undefined;
      if (local && !event) throw new ApiError(404, 'event-not-found');
      stage = 'submit';
      const result = await registerForEvent(eventId, fullName, email, session.token, event);
      registered = true;
      if (photo) {
        stage = 'photo';
        const registrationId = result && typeof result === 'object'
          ? (result as { registrationId?: unknown }).registrationId : undefined;
        if (typeof registrationId !== 'string') throw new Error('missing-registration-id');
        await uploadRegistrationPhoto(eventId, registrationId, photo, session.token);
      }
      setSuccess(true);
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        await logout();
        router.replace('/login');
      } else setError(registered
        ? 'ลงทะเบียนแล้ว แต่ส่งรูปไม่สำเร็จ ข้อมูลยังอยู่ กรุณาลองส่งอีกครั้ง'
         : caught instanceof ApiConnectionError ? caught.message
        : caught instanceof ApiError && caught.status === 404 ? 'ไม่พบกิจกรรมในระบบ กรุณากลับไปเลือกรายการใหม่ หรืออัปเดตและเปิด API ใหม่'
        : caught instanceof ApiError && caught.status === 400 ? 'ข้อมูลลงทะเบียนหรือกิจกรรมไม่ถูกต้อง กรุณาตรวจแล้วลองอีกครั้ง'
        : caught instanceof ApiError ? `ลงทะเบียนไม่สำเร็จ (HTTP ${caught.status}) กรุณาเปิด API ใหม่แล้วลองอีกครั้ง`
        : stage === 'load-event' ? 'อ่านกิจกรรมในเครื่องไม่สำเร็จ (REG-LOCAL) กรุณากลับไปเปิดรายละเอียดกิจกรรมใหม่ ข้อมูลที่กรอกยังอยู่'
        : 'ลงทะเบียนไม่สำเร็จ (REG-SUBMIT) ข้อมูลที่กรอกยังอยู่ กรุณาลองอีกครั้ง');
    }
    finally { submitting.current = false; setBusy(false); }
  };
  if (success && eventId) return <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <ScrollView contentContainerStyle={styles.content}>
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>ลงทะเบียนเข้าร่วมสำเร็จแล้ว</Text>
      <Text style={styles.text}>ระบบได้รับข้อมูลการเข้าร่วมกิจกรรมของคุณแล้ว</Text>
      <Text style={styles.text}>หากต้องการเก็บกิจกรรมไว้ดูภายหลัง ให้กดเพิ่มในรายการโปรดที่หน้ารายการกิจกรรม</Text>
      <Action title="ดูกิจกรรมที่ลงทะเบียนแล้ว" onPress={() => router.replace('/registrations')} />
      <Action title="กลับไปดูกิจกรรมนี้" onPress={() => router.replace({ pathname: '/events/[id]', params: { id: eventId } })} />
    </ScrollView>
  </SafeAreaView>;
  return <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text accessibilityRole="header" style={styles.title}>ลงทะเบียนเข้าร่วมกิจกรรม</Text>
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
      <Action title={busy ? 'กำลังส่ง…' : 'ลงทะเบียนเข้าร่วมกิจกรรม'} disabled={busy || !eventId} onPress={() => void submit()} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
