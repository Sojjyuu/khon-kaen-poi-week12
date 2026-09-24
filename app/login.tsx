import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../src/components/EventUI';
import { useSession } from '../src/features/auth/session';
import { hasCampusApi } from '../src/services/campusApi';

export default function Login() {
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    if (!/^\S+@\S+\.\S+$/.test(email) || !password) { setError('กรอกอีเมลและรหัสผ่านให้ครบ'); return; }
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await login(email.trim(), password);
      setPassword('');
      router.replace('/events');
    } catch { setError('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจข้อมูลหรือการเชื่อมต่อ'); }
    finally { submitting.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.content}>
      <Text accessibilityRole="header" style={styles.title}>เข้าสู่ระบบ</Text>
      {!hasCampusApi() && <Text style={styles.error}>ต้องตั้งค่า EXPO_PUBLIC_API_URL เพื่อเชื่อมต่อระบบบัญชี</Text>}
      <Text style={styles.text}>อีเมล</Text>
      <TextInput accessibilityLabel="อีเมล" autoCapitalize="none" keyboardType="email-address" onChangeText={setEmail} style={styles.input} value={email} />
      <Text style={styles.text}>รหัสผ่าน</Text>
      <TextInput accessibilityLabel="รหัสผ่าน" onChangeText={setPassword} secureTextEntry style={styles.input} value={password} />
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Action title={busy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'} disabled={busy || !hasCampusApi()} onPress={() => void submit()} />
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
