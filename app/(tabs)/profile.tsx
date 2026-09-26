import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../src/features/auth/session';
import { Action, eventStyles } from '../../src/components/EventUI';
import { colors } from '../../src/theme/colors';

export default function ProfileScreen() {
  const { session, logout, updateProfile } = useSession();
  const user = session.status === 'authenticated' ? session.user : null;
  const [name, setName] = useState(user?.name ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  async function save() {
    if (busy) return;
    if (!name.trim() || name.trim().length > 80) { setMessage('กรุณากรอกชื่อ 1–80 ตัวอักษร'); return; }
    setBusy(true); setMessage('');
    try { await updateProfile(name.trim()); setMessage('บันทึกชื่อแล้ว'); }
    catch { setMessage('บันทึกไม่ได้ กรุณาตรวจการเชื่อมต่อแล้วลองอีกครั้ง'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.safe} edges={['left', 'right']}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={eventStyles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.initial}>{user?.name.trim().slice(0, 1) || '◉'}</Text></View>
          <Text style={styles.eyebrow}>MY EXPLORER PROFILE</Text>
          <Text accessibilityRole="header" style={styles.heading}>{user?.name || 'เริ่มการสำรวจของคุณ'}</Text>
          <Text style={styles.description}>{user ? 'พื้นที่ส่วนตัวสำหรับทริปและกิจกรรมของคุณ' : 'ค้นหาสถานที่ได้ทันที สมัครสมาชิกเมื่อพร้อมบันทึกทริป'}</Text>
        </View>
        {user ? <>
          <View style={eventStyles.card}>
            <Text accessibilityRole="header" style={eventStyles.subtitle}>ข้อมูลบัญชี</Text>
            {user.email ? <Text style={eventStyles.text}>{user.email}</Text> : null}
            <Text style={eventStyles.text}>ชื่อที่แสดง</Text>
            <TextInput accessibilityLabel="ชื่อที่แสดง" value={name} onChangeText={setName} maxLength={80} editable={!busy} style={styles.input} />
            {message ? <Text accessibilityRole="alert" style={eventStyles.text}>{message}</Text> : null}
            <Action title={busy ? 'กำลังบันทึก…' : 'บันทึกชื่อ'} disabled={busy} onPress={() => void save()} />
          </View>
          <View style={eventStyles.card}>
            <Text accessibilityRole="header" style={eventStyles.subtitle}>การสำรวจของฉัน</Text>
            <Action title="ทริปของฉัน" onPress={() => router.push('/trip')} />
            <Action title="กิจกรรมที่บันทึก" variant="secondary" onPress={() => router.push('/favorites')} />
            <Text style={eventStyles.text}>ทริปและกิจกรรมส่วนตัวเก็บแยกตามบัญชีบนเครื่องนี้</Text>
          </View>
        </> : <View style={eventStyles.card}>
          <Action title="เข้าสู่ระบบ" onPress={() => router.push('/login')} />
          <Action title="สมัครสมาชิก" variant="secondary" onPress={() => router.push('/signup')} />
        </View>}
        <View style={eventStyles.card}>
          <Text accessibilityRole="header" style={eventStyles.subtitle}>เกี่ยวกับแอป</Text>
          <Text style={eventStyles.text}>Khon Kaen Dino Explorer · ค้นพบขอนแก่นในแบบของคุณ</Text>
          <Action title="รู้จักผู้พัฒนาแอป" variant="secondary" onPress={() => router.push('/about')} />
          <Action title="เครดิตภาพสถานที่" variant="secondary" onPress={() => router.push('/photo-credits')} />
        </View>
        {user && <Action title="ออกจากระบบ" variant="danger" disabled={busy} onPress={() => {
          Alert.alert('ออกจากระบบ?', 'ข้อมูลที่บันทึกบนเครื่องนี้จะยังอยู่เมื่อกลับเข้าสู่บัญชีเดิม', [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ออกจากระบบ', style: 'destructive', onPress: () => { void logout().catch(() => Alert.alert('ออกจากระบบไม่ได้', 'กรุณาลองอีกครั้ง')); } },
          ]);
        }} />}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { borderRadius: 28, padding: 24, gap: 12, backgroundColor: colors.navy },
  avatar: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.navy, fontSize: 28, fontWeight: '800' },
  eyebrow: { color: colors.gold, fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  heading: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  description: { color: '#D6E0EE', fontSize: 15, lineHeight: 24 },
  input: { minHeight: 52, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, color: colors.navy, fontSize: 16, backgroundColor: colors.background },
});
