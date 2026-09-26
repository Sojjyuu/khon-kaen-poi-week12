import { Alert } from 'react-native';
import { router } from 'expo-router';
import { getAccountScope } from '../../storage/accountScope';
export function requireAccount() {
  if (getAccountScope() !== null) return true;
  Alert.alert('บันทึกการสำรวจของคุณ', 'เข้าสู่ระบบเพื่อเก็บทริปและกิจกรรมไว้ในบัญชีของคุณ', [
    { text: 'ไว้ก่อน', style: 'cancel' },
    { text: 'สมัครสมาชิก', onPress: () => router.push('/signup') },
    { text: 'เข้าสู่ระบบ', onPress: () => router.push('/login') },
  ]);
  return false;
}
