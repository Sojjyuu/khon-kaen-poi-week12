import { Stack } from 'expo-router';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';

const profileImage = require('../assets/profile-week12.jpg');

const PROFILE = {
  name: 'Kirati Suwanpusit',
  studentId: '663450172-5',
  programCode: 'CIS',
  program: 'วิทยาการคอมพิวเตอร์และสารสนเทศ',
  curriculum: 'Computer Science & Information Technology',
  email: 'kirati.su@kkumail.com',
  github: 'https://github.com/Sojjyuu',
  instagram: 'https://www.instagram.com/smth_yu/',
};

type ContactButtonProps = {
  label: string;
  value: string;
  url: string;
  filled?: boolean;
};

function ContactButton({ label, value, url, filled = false }: ContactButtonProps) {
  const open = async () => {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('เปิดลิงก์ไม่ได้', value);
      return;
    }
    await Linking.openURL(url);
  };

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      onPress={open}
      style={[styles.contactButton, filled && styles.contactButtonFilled]}
    >
      <View style={[styles.contactIcon, filled && styles.contactIconFilled]}>
        <Text style={[styles.contactIconText, filled && styles.contactIconTextFilled]}>{label.slice(0, 1)}</Text>
      </View>
      <View style={styles.contactCopy}>
        <Text style={[styles.contactLabel, filled && styles.contactLabelFilled]}>{label}</Text>
        <Text numberOfLines={1} style={[styles.contactValue, filled && styles.contactValueFilled]}>
          {value}
        </Text>
      </View>
      <Text style={[styles.contactArrow, filled && styles.contactArrowFilled]}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerBackTitle: 'กลับ',
        }}
      />

      <SafeAreaView style={styles.safe} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <ImageBackground source={profileImage} imageStyle={styles.coverImage} style={styles.cover}>
            <View style={styles.coverShade} />
            <View style={styles.coverContent}>
              <View style={styles.departmentPill}>
                <Text style={styles.departmentPillText}>{PROFILE.programCode}</Text>
              </View>
              <Text style={styles.coverEyebrow}>STUDENT PROFILE</Text>
              <Text style={styles.coverTitle}>ผู้พัฒนาแอป</Text>
              <Text style={styles.coverSubtitle}>Khon Kaen Dino Explorer</Text>
            </View>
          </ImageBackground>

          <View style={styles.profileCard}>
            <View style={styles.identityRow}>
              <Image source={profileImage} style={styles.avatar} />
              <View style={styles.identityText}>
                <Text style={styles.name}>{PROFILE.name}</Text>
                <Text style={styles.role}>Student Developer</Text>
                <Text style={styles.program}>{PROFILE.program}</Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ชื่อ - นามสกุล</Text>
                <Text style={styles.infoValue}>{PROFILE.name}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>รหัสนักศึกษา</Text>
                <Text style={styles.infoValue}>{PROFILE.studentId}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>หลักสูตร</Text>
                <Text style={styles.infoValue}>{PROFILE.curriculum}</Text>
              </View>

              <View style={styles.infoItemLast}>
                <Text style={styles.infoLabel}>สาขา</Text>
                <Text style={styles.infoValue}>{PROFILE.program}</Text>
              </View>
            </View>
          </View>

          <View style={styles.contactCard}>
            <View style={styles.contactHeaderRow}>
              <View>
                <Text style={styles.contactEyebrow}>LET&apos;S CONNECT</Text>
                <Text style={styles.contactTitle}>ช่องทางติดต่อ</Text>
              </View>
              <View style={styles.onlinePill}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>SOCIAL</Text>
              </View>
            </View>

            <View style={styles.contactList}>
              <ContactButton label="GitHub" value="github.com/Sojjyuu" url={PROFILE.github} filled />
              <ContactButton label="Email" value={PROFILE.email} url={`mailto:${PROFILE.email}`} />
              <ContactButton label="Instagram" value="@smth_yu" url={PROFILE.instagram} />
            </View>
          </View>

          <View style={styles.projectCard}>
            <View style={styles.projectAccent} />
            <View style={styles.projectCopy}>
              <Text style={styles.projectLabel}>FINAL PROJECT</Text>
              <Text style={styles.projectTitle}>Khon Kaen Dino Explorer</Text>
              <Text style={styles.projectDescription}>
                แอปสำหรับสำรวจสถานที่น่าสนใจในขอนแก่น พร้อมแผนที่ ทริปส่วนตัว กล้องพร้อมฟิลเตอร์ และระบบแจ้งเตือนกิจกรรม
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F1E8' },
  content: { padding: 18, paddingBottom: 34 },
  cover: {
    height: 300,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.navy,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 9,
  },
  coverImage: { resizeMode: 'cover' },
  coverShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(4, 18, 40, 0.28)' },
  coverContent: { paddingHorizontal: 22, paddingVertical: 20, backgroundColor: 'rgba(4, 18, 40, 0.68)' },
  departmentPill: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.gold, paddingHorizontal: 11, paddingVertical: 6, marginBottom: 10 },
  departmentPillText: { color: colors.navy, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  coverEyebrow: { color: '#D9E4F3', fontSize: 9, fontWeight: '800', letterSpacing: 1.8 },
  coverTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 38, fontWeight: '900', marginTop: 3 },
  coverSubtitle: { color: '#D6E0EE', fontSize: 13, fontWeight: '600', marginTop: 2 },
  profileCard: {
    marginTop: 18,
    borderRadius: 28,
    backgroundColor: colors.navy,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(243,185,40,0.3)',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 7,
  },
  identityRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 82, height: 82, borderRadius: 25, borderWidth: 2, borderColor: colors.gold, backgroundColor: '#17315A' },
  identityText: { flex: 1, marginLeft: 15 },
  name: { color: '#FFFFFF', fontSize: 20, lineHeight: 26, fontWeight: '900' },
  role: { color: colors.gold, fontSize: 12, fontWeight: '800', marginTop: 3 },
  program: { color: '#BBC9DD', fontSize: 11, lineHeight: 16, marginTop: 5 },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 18 },
  infoGrid: { borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  infoItem: { paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#E9EDF3' },
  infoItemLast: { paddingHorizontal: 18, paddingVertical: 15 },
  infoLabel: { color: colors.goldDark, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  infoValue: { color: colors.navy, fontSize: 16, lineHeight: 23, fontWeight: '800', marginTop: 5 },
  contactCard: {
    marginTop: 16,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderWidth: 1,
    borderColor: '#E7DFCD',
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  contactHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  contactEyebrow: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  contactTitle: { color: colors.navy, fontSize: 20, fontWeight: '900', marginTop: 3 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, backgroundColor: '#EDF5EF', paddingHorizontal: 10, paddingVertical: 7 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#3A9B62', marginRight: 6 },
  onlineText: { color: '#2F7550', fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  contactList: { marginTop: 14, gap: 9 },
  contactButton: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F6F7F9',
    borderWidth: 1,
    borderColor: '#E5E8ED',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  contactButtonFilled: { backgroundColor: colors.navy, borderColor: colors.navy },
  contactIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E7EBF2' },
  contactIconFilled: { backgroundColor: colors.gold },
  contactIconText: { color: colors.navy, fontSize: 14, fontWeight: '900' },
  contactIconTextFilled: { color: colors.navy },
  contactCopy: { flex: 1, marginLeft: 11 },
  contactLabel: { color: colors.navy, fontSize: 12, fontWeight: '900' },
  contactLabelFilled: { color: '#FFFFFF' },
  contactValue: { color: colors.textMuted, fontSize: 10, fontWeight: '600', marginTop: 3 },
  contactValueFilled: { color: '#BCC9DB' },
  contactArrow: { color: colors.goldDark, fontSize: 28, fontWeight: '300', marginLeft: 8, marginTop: -2 },
  contactArrowFilled: { color: colors.gold },
  projectCard: { flexDirection: 'row', marginTop: 16, borderRadius: 24, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E7DFCD', overflow: 'hidden' },
  projectAccent: { width: 7, backgroundColor: colors.gold },
  projectCopy: { flex: 1, padding: 18 },
  projectLabel: { color: colors.goldDark, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  projectTitle: { color: colors.navy, fontSize: 18, fontWeight: '900', marginTop: 4 },
  projectDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 7 },
});
