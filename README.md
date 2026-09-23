# Khon Kaen Dino Explorer — Week 12

Week 12 ต่อยอดจาก Week 11 โดยโฟกัส **Architecture, Performance และ Accessibility** โดยไม่เพิ่ม scope ฟีเจอร์ที่ไม่จำเป็น

## สิ่งที่ทำใน Week 12

- แยก Event/Reminder เป็น `screen → feature hook → repository → storage/device service`
- กำหนด source of truth ของ Event, Reminder, Favorites และ POI
- เปลี่ยน Event list เป็น `FlatList`
- แยกและ `memo` `EventCard`
- ใช้ callback ที่ stable เฉพาะจุดที่เกี่ยวกับ list
- เพิ่ม React Profiler เพื่อเก็บหลักฐานก่อน/หลัง
- ปรับ accessibility semantics, live region, error focus และ touch target
- รองรับ Font Scale 200%
- รองรับ Reduce Motion
- ทดสอบ VoiceOver/TalkBack flow
- ทดสอบ Invalid Event ID focus
- เพิ่ม Web-safe adapters สำหรับ Map, Notification และ Media Library
- คง Search/Filter, My Trip, Camera, Profile และ Reminder จาก Week 11

## Performance ที่วัดได้

| Metric | Week 11 | Week 12 |
|---|---:|---:|
| Main Event screen | 27.876 ms | 27.039 ms |
| Input update เฉลี่ย | 13.647 ms | 10.365 ms |
| Input update worst-case | 19.319 ms | 11.696 ms |
| Input update รวม 6 commits | 81.881 ms | 62.189 ms |

รายละเอียดวิธีวัดและข้อจำกัดอยู่ใน [Lab 12 Quality Audit](docs/lab-12-quality-audit.md)

## Accessibility / Device tests

ทดสอบแล้ว:

- VoiceOver / TalkBack flow หลัก
- selected state
- Font Scale 200%
- Reduce Motion
- Invalid Event ID + accessibility focus
- ลบกิจกรรมส่วนตัว

## ติดตั้งและรัน

```bash
npm install
npm test
npm run typecheck
npx expo start -c
```

ทดสอบ Web:

```bash
npm run webcheck
npx expo start --web -c
```

Invalid Event route:

```text
http://localhost:8081/events/not-found-test
```

## หมายเหตุเรื่อง Expo Notifications บน Android

ข้อจำกัดที่พบในการทดสอบบน Android มาจาก **Expo Go** ไม่ใช่จาก Android โดยตรง

ตั้งแต่ **Expo SDK 53 เป็นต้นไป** Expo Go บน Android ไม่รองรับ **Push Notification / Remote Notification** ที่ส่งมาจากเซิร์ฟเวอร์แล้ว เพราะการทำ push notification ต้องผูกกับ native credentials ของแอปเอง เช่น Firebase Cloud Messaging (FCM) และ configuration ที่ถูกฝังไว้ตั้งแต่ตอน build แอป ดังนั้นการทดสอบ push notification บน Android ต้องใช้ **Development Build / EAS Build** แทน Expo Go

อย่างไรก็ตาม **Local Notification / Scheduled Notification** ที่สร้างจากภายในแอปด้วย `expo-notifications` ยังรองรับใน Expo Go อยู่

สำหรับโปรเจกต์นี้ Reminder ใช้แนวคิด **Local / Scheduled Notification** เป็นหลัก ส่วนถ้าต้องการทดสอบ Push Notification บน Android แบบครบจริง ควรสร้าง Development Build เช่น:

```bash
npx eas-cli@latest build --platform android --profile development
```

หรือใช้ Preview Build ตามขั้นตอนของสัปดาห์ถัดไป

อ้างอิง: Expo Notifications documentation — https://docs.expo.dev/versions/latest/sdk/notifications/

## Automated quality checks

GitHub Actions workflow: **Week 12 Quality Check**

ตรวจ:

- tests
- TypeScript
- Expo Web export

## เอกสารส่งงาน

- [Lab 12 Quality Audit](docs/lab-12-quality-audit.md)
- [Final Submission Checklist](docs/final-submission.md)
- [Lab 11 Notifications](docs/lab-11-notifications.md)

## Repository สำหรับส่ง

https://github.com/Sojjyuu/khon-kaen-poi-week12

ใช้ branch `main` และไม่อัปโหลด `node_modules`, `.expo`, `.env` หรือ secret/API key
