import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Action, eventStyles as styles } from '../../components/EventUI';
import { ApiError, hasCampusApi } from '../../services/campusApi';
import { useSession } from './session';

export function AccountForm({ mode }: { mode: 'login' | 'signup' }) {
  const creating = mode === 'signup';
  const { login, signup } = useSession();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const submit = async () => {
    if (submitting.current) return;
    if (creating && !name.trim()) { setError('กรุณากรอกชื่อที่ใช้แสดง'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email.trim()) || !password) { setError('กรอกอีเมลและรหัสผ่านให้ครบ'); return; }
    if (creating && password.length < 8) { setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
    if (creating && password !== confirmation) { setError('รหัสผ่านทั้งสองช่องไม่ตรงกัน'); return; }
    submitting.current = true; setBusy(true); setError('');
    try {
      if (creating) await signup(name.trim(), email.trim().toLowerCase(), password);
      else await login(email.trim().toLowerCase(), password);
      setPassword(''); setConfirmation('');
      router.replace('/events');
    } catch (cause) {
      setError(cause instanceof ApiError && cause.status === 409 ? 'อีเมลนี้สมัครแล้ว ลองเข้าสู่ระบบได้เลย' : cause instanceof ApiError && cause.status === 401 ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'เชื่อมต่อระบบบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally { submitting.current = false; setBusy(false); }
  };
  return <SafeAreaView style={{ flex: 1 }} edges={['left', 'right', 'bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { flexGrow: 1, justifyContent: 'center' }]}>
        <Text style={styles.badgeText}>KHON KAEN DINO EXPLORER</Text>
        <Text accessibilityRole="header" style={styles.title}>{creating ? 'เริ่มต้นการเดินทางของคุณ' : 'ยินดีต้อนรับกลับมา'}</Text>
        <Text style={styles.text}>{creating ? 'สร้างบัญชีเพื่อสมัครเข้าร่วมกิจกรรม' : 'เข้าสู่ระบบเพื่อเดินทางและร่วมกิจกรรมด้วยกัน'}</Text>
        <View style={styles.card}>
          {!hasCampusApi() && <Text style={styles.error}>ระบบบัญชียังไม่ได้เชื่อมต่อ กรุณาติดต่อผู้ดูแลแอป</Text>}
          {creating && <><Text style={styles.text}>ชื่อที่ใช้แสดง</Text><TextInput accessibilityLabel="ชื่อที่ใช้แสดง" value={name} onChangeText={setName} editable={!busy} maxLength={80} autoComplete="name" style={styles.input} /></>}
          <Text style={styles.text}>อีเมล</Text>
          <TextInput accessibilityLabel="อีเมล" value={email} onChangeText={setEmail} editable={!busy} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" maxLength={254} style={styles.input} />
          <Text style={styles.text}>{creating ? 'รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)' : 'รหัสผ่าน'}</Text>
          <TextInput accessibilityLabel="รหัสผ่าน" value={password} onChangeText={setPassword} editable={!busy} secureTextEntry autoCapitalize="none" autoComplete={creating ? 'new-password' : 'current-password'} maxLength={128} style={styles.input} />
          {creating && <><Text style={styles.text}>ยืนยันรหัสผ่าน</Text><TextInput accessibilityLabel="ยืนยันรหัสผ่าน" value={confirmation} onChangeText={setConfirmation} editable={!busy} secureTextEntry autoCapitalize="none" autoComplete="new-password" maxLength={128} style={styles.input} /></>}
          {!!error && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <Action title={busy ? 'กำลังดำเนินการ…' : creating ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'} disabled={busy || !hasCampusApi()} onPress={() => void submit()} />
        </View>
        <Action title={creating ? 'มีบัญชีแล้ว · เข้าสู่ระบบ' : 'ยังไม่มีบัญชี · สมัครสมาชิก'} variant="secondary" disabled={busy} onPress={() => router.replace(creating ? '/login' : '/signup')} />
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
