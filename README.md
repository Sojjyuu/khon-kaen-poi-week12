# Khon Kaen Dino Explorer

## Lab 12: Architecture, Performance และ Accessibility

Week 12 refactor งานเดิมโดยไม่เพิ่ม scope: แยก Screen → Feature Hook → Repository → Storage/Device Service, เปลี่ยน Event list เป็น virtualized `FlatList` พร้อม memoized row/Profiler และแก้ accessibility ด้าน semantics, focus, live region, touch target, font scaling และ Reduce Motion

ดู [Architecture diagram, performance evidence และ accessibility audit report](docs/lab-12-quality-audit.md)

ตรวจงานอัตโนมัติ:

```bash
npm test
npm run typecheck
npx expo-doctor
```

## Lab 11: กิจกรรมและการแจ้งเตือน

หน้าแรกมีปุ่ม **กิจกรรมและการแจ้งเตือน** สำหรับดู/สร้างกิจกรรม ตั้งเตือนก่อนเริ่ม 30 นาที ยกเลิกเตือน และทดสอบ notification ใน 15 วินาที แตะ notification เพื่อเปิด `/events/[id]` ผ่าน Expo Router

หลังอัปเดตแพ็กเกจ ให้หยุด Metro เดิมแล้วรัน `npx expo start --clear` อีกครั้ง

ดู [คู่มือ Lab 11, lifecycle diagram, ตารางทดสอบ และขั้นตอนถ่ายวิดีโอ](docs/lab-11-notifications.md) การทดสอบอัตโนมัติรันด้วย `npm test` และ `npm run check`; การส่ง notification และ cold start ยังต้องยืนยันบนอุปกรณ์จริง

แอป Expo + React Native + TypeScript ธีมเมืองไดโนเสาร์ สำหรับแสดง Point of Interest จำนวน 10 แห่งในจังหวัดขอนแก่น เมื่อกดเลือกสถานที่จากรายการ แผนที่จะเลื่อนไปยังพิกัดของสถานที่นั้นและแสดงชื่อกำกับบนแผนที่

## ฟีเจอร์ตามโจทย์

- รายชื่อสถานที่สำคัญในขอนแก่นครบ 10 แห่ง
- กดเลือกสถานที่จากรายการได้
- แผนที่เลื่อนไปยังตำแหน่งของสถานที่ที่เลือก
- แสดง Marker สีแดงบนตำแหน่งที่เลือก
- แสดงชื่อสถานที่ทั้งในป้ายบนแผนที่และ Marker callout
- กด “ขยายแผนที่” เพื่อดู เลื่อน และซูมแผนที่แบบเต็มหน้าจอ
- กดปุ่ม `◎` ในแผนที่เต็มจอเพื่อเลื่อนกลับมายังหมุดที่เลือก
- รายการที่เลือกมีสีและเครื่องหมายกำกับอย่างชัดเจน
- แสดงประเภท ที่อยู่ คำอธิบาย และพิกัดของสถานที่
- รองรับ Android ด้วย Google Maps และ iOS ด้วย Apple Maps
- แอปไม่ขอ Location permission เพราะโจทย์นี้ใช้พิกัดสถานที่ที่กำหนดไว้ล่วงหน้า
- UI โทนน้ำเงิน–ทอง พร้อมไอคอนไดโนเสาร์สีเหลือง

## สถานที่ทั้ง 10 แห่ง

1. มหาวิทยาลัยขอนแก่น
2. บึงแก่นนคร
3. พระมหาธาตุแก่นนคร
4. ศาลหลักเมืองขอนแก่น
5. เซ็นทรัล ขอนแก่น
6. สถานีรถไฟขอนแก่น
7. ตลาดต้นตาล
8. พิพิธภัณฑสถานแห่งชาติ ขอนแก่น
9. ศูนย์ประชุมและแสดงสินค้านานาชาติขอนแก่น (KICE)
10. ท่าอากาศยานขอนแก่น

## วิธีติดตั้งและรัน

```bash
npm install
npm run typecheck
npx expo start
```

จากนั้นเปิด Expo Go และสแกน QR Code หรือกด `a` เพื่อเปิดใน Android Emulator

## โครงสร้างสำคัญ

```text
app/                              routes และ screen composition
src/
  components/                    shared presentational components
  features/events/              event components, hooks และ types
  features/accessibility/       shared accessibility behavior
  repositories/                 use cases และ data/device orchestration
  services/                     device API และ performance boundary
  storage/                      AsyncStorage adapter
  data/pointsOfInterest.ts       ข้อมูลสถานที่สำคัญ 10 แห่ง
  screens/PoiExplorerScreen.tsx  หน้าสำรวจ POI
  theme/colors.ts                ชุดสีของแอป
tests/                           repository, notification และ architecture checks
```

## Android Production Build

Expo Go ใช้ทดสอบงานพื้นฐานได้ หากสร้าง Android binary สำหรับเผยแพร่ ให้เปิด Maps SDK for Android และสร้าง Google Maps API key โดยจำกัด key ด้วย:

- Android package: `com.sojjyu.khonkaenpoi`
- SHA-1 ของ signing certificate ที่ใช้สร้างแอป

เก็บ key เป็น EAS Environment Variable ชื่อ `GOOGLE_MAPS_ANDROID_API_KEY` แล้วสร้าง binary ใหม่ เพราะ API key ถูกฝังใน native application

```bash
npx eas-cli env:create --name GOOGLE_MAPS_ANDROID_API_KEY --environment production --visibility secret
npx eas-cli build --profile production --platform android
```

## ก่อนส่ง GitHub

```bash
git init
git add .
git commit -m "Create Khon Kaen POI map app"
git branch -M main
git remote add origin URL_REPOSITORY_ของนักศึกษา
git push -u origin main
```

ไม่ควรอัปโหลด `node_modules`, `.expo`, `.env` หรือ API key จริงขึ้น GitHub
