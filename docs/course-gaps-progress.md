# เติมเกณฑ์สัปดาห์ 1–10 จากแอป Week 13

แอปนี้ยังเป็น Khon Kaen Dino Explorer; ข้อมูล My Trip คือ POI ส่วน `กิจกรรมที่บันทึก` คือ Event Favorites ที่เพิ่มต่างหาก

## ทดลอง API และบัญชีจำลอง

API จำลองนี้ใช้เฉพาะเครื่องพัฒนา/เครือข่ายที่เชื่อถือได้ ไม่ใช่ระบบบัญชีจริง และข้อมูลลงทะเบียนเก็บในหน่วยความจำของ server เท่านั้น

1. สร้างรหัสผ่านใช้ทดสอบเท่านั้น แล้วกำหนด `CAMPUS_TEST_EMAIL`, `CAMPUS_TEST_PASSWORD` ใน terminal ที่รัน `npm run api:mock` (ไม่ใส่รหัสผ่านใน Git)
2. ตั้ง `EXPO_PUBLIC_API_URL=http://<LAN-IP-ของคอมพิวเตอร์>:4100` ใน `.env.local` บนเครื่องที่รัน Metro เพื่อให้มือถือเชื่อมได้; URL นี้ไม่ใช่ secret แต่ข้อมูลบัญชีจะส่งแบบ HTTP ใน Lab นี้ จึงต้องใช้บัญชีสมมติเท่านั้น
3. `npx expo start -c` แล้วเปิด Events → เลือกกิจกรรมจาก API → เข้าสู่ระบบ → ลงทะเบียน ระบบตรวจ token ที่ API จริงและ POST ซ้ำไม่สร้างรายการใหม่สำหรับคนเดิม
4. ตั้ง airplane mode แล้วเปิด Event list อีกครั้ง เพื่อตรวจ cache/banner/เวลาอัปเดต; POI และกิจกรรมในเครื่องยังอ่านได้
5. สำหรับ Development Build ให้ล็อกอิน EAS แล้ว `npx eas-cli@latest build --platform android --profile development`, ติดตั้ง binary และ `npx expo start --dev-client` (ยังไม่ได้สร้างจากสภาพแวดล้อมนี้)

API contract สำหรับ backend จริง: `GET /events`, `GET /events/:id`, `POST /auth/login` ตอบ `{accessToken,user:{id,name}}`, `GET /auth/me` ด้วย Bearer token และ `POST /events/:id/registrations` ด้วย Bearer token ตอบ `{registrationId}`. Backend จริงต้องใช้ HTTPS, validation, expiry/refresh และจัดการสิทธิ์ฝั่ง server

## สถานะงานที่ตรวจสอบได้

| สัปดาห์ | สิ่งที่เพิ่ม/มีแล้ว | สิ่งที่ยังต้องทำหรือยืนยัน |
| --- | --- | --- |
| 1 | Expo/TypeScript/Profile/README | ภาพหรือวิดีโอจากเครื่องจริง และ baseline SDK/Node จากผู้สอน |
| 2 | EventCard, mock Event, Event Favorites พร้อมปุ่มและ stable ID | วิดีโอเปิด/บันทึก/กดซ้ำ, รูปเสีย/ข้อความยาว |
| 3 | FlatList, Safe area, empty/error UI และ accessibility เดิม | ภาพสองขนาดจอและ ready/empty/error ครบทุกกรณี |
| 4 | Expo Router, dynamic event detail, invalid ID | Tabs ตาม route map, ผลทดสอบ deep link/Android Back บนอุปกรณ์ |
| 5 | Search, controlled Login/Registration, validation, กันส่งซ้ำ, Event Favorites + FavoritesProvider/useEventFavorites | state ownership diagram และหลักฐานหน้าจอ |
| 6 | API boundary, status handling, payload validation, local server จำลอง, pull-to-refresh | backend จริง, ทดสอบ offline/404/500/slow/invalid JSON ให้ครบ |
| 7 | AsyncStorage, remote event cache + updatedAt/offline UI, SQLite schema POC | ปรับ cache lifecycle, วิดีโอ offline/restart, storage matrix |
| 8 | Login + SecureStore + restore + logout + protected registration route; test API ตรวจ Bearer token | Development Build จริง; token refresh/expiry, threat checklist และวิดีโอ flow |
| 9 | Camera/Picker และบันทึกภาพจากฟีเจอร์เดิม | เชื่อมรูปเข้าฟอร์มกิจกรรม/upload และหลักฐาน permission denied/canceled |
| 10 | POI maps, สร้างกิจกรรมจากสถานที่ที่เลือก และแสดงพิกัด current location เมื่อกดขอสิทธิ์ | แตะพิกัดว่างเพื่อวางหมุดอิสระ, matrix การตั้งค่า Android/iOS และทดสอบเครื่องจริง |
| 13 | 21 tests, static checks/Doctor และรายงานเดิม | EAS Preview APK และ clean install จริง |

การทดสอบบนเครื่องพัฒนาผ่าน `npm run typecheck`, `npm run lint`, `npm test` (Node 13 + Jest 8) และ Expo Doctor 21/21. ทดสอบ API จำลอง: รายการ 1, unauthorized 401, Login ได้ token, restore 200, Register 200. ยังไม่ได้ทดสอบกล้อง ตำแหน่ง session หรือ notification บน binary หลังเพิ่ม native packages; ต้องสร้าง binary ใหม่

**ข้อจำกัด:** งานที่ยังอยู่คอลัมน์ขวายังนับว่าไม่ครบตาม Definition of Done ของรายวิชา อย่าส่งตารางนี้เป็นหลักฐานว่าผ่านทุกสัปดาห์แล้ว
