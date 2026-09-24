import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { registerForEvent, validateRegistration } from '../src/features/events/registration';
import { isEventId } from '../src/features/events/types';
import { ApiError } from '../src/services/campusApi';

export default function Register() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const { session, logout } = useSession();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const eventId = isEventId(id) ? id : null;
  const submit = async () => {
    if (submitting.current || session.status !== 'authenticated' || !eventId) return;
    const validation = validateRegistration(fullName, email);
    if (validation) { setError(validation); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await registerForEvent(eventId, fullName, email, session.token);
      router.replace({ pathname: '/events/[id]', params: { id: eventId } });
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) {
        await logout();
        router.replace('/login');
      } else setError('ลงทะเบียนไม่สำเร็จ ข้อมูลที่กรอกยังอยู่ กรุณาลองอีกครั้ง');
    }
    finally { submitting.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>ลงทะเบียนกิจกรรม</Text>
      {!eventId && <Text accessibilityRole="alert" style={styles.error}>รหัสกิจกรรมไม่ถูกต้อง</Text>}
      <Text style={styles.text}>ชื่อ-นามสกุล</Text>
      <TextInput accessibilityLabel="ชื่อ-นามสกุล" onChangeText={setFullName} style={styles.input} value={fullName} />
      <Text style={styles.text}>อีเมล</Text>
      <TextInput accessibilityLabel="อีเมล" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Action title={busy ? 'กำลังส่ง…' : 'ลงทะเบียน'} disabled={busy || !eventId} onPress={() => void submit()} />
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
