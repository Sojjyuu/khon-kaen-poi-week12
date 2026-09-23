# Final Submission — Week 12

Repository: https://github.com/Sojjyuu/khon-kaen-poi-week12

เอกสารหลัก: [Lab 12 Quality Audit](lab-12-quality-audit.md)

## Deliverables

- [x] Architecture / Data-flow diagram
- [x] Screen → Hook → Repository → Storage / Device Service
- [x] Source of truth อธิบายชัดเจน
- [x] Performance baseline Week 11 เทียบ Week 12
- [x] React Profiler measurements ก่อน/หลัง
- [x] Accessibility before/after audit
- [x] VoiceOver / TalkBack flow
- [x] Font scale 200%
- [x] Reduce Motion
- [x] Invalid Event ID / accessibility focus
- [x] ลบกิจกรรมส่วนตัว
- [x] Web fallback สำหรับ Map / Notification / Media Library
- [x] Automated tests + TypeScript + Expo configuration check

## Performance result สรุป

Profiler รอบล่าสุดหลังรวมการแก้ Android: input commits 5 ครั้งต่อเวอร์ชันบน iPhone มีค่าเฉลี่ย Week 11 **14.600 ms** และ Week 12 **12.055 ms** ต่อ commit (Week 12 น้อยกว่า 17.4% ในรอบนี้) เป็นเวลา render ของ React; ไฟล์ไม่เก็บตัวอักษรและจำนวนกิจกรรมสำหรับยืนยันเงื่อนไขเท่ากัน

ผลการวัดก่อนรวมการแก้ Android:

- Main Event screen: 27.876 ms → 27.039 ms
- Input update เฉลี่ย: 13.647 ms → 10.365 ms
- Input update worst-case: 19.319 ms → 11.696 ms
- Input update รวม 6 commits: 81.881 ms → 62.189 ms

รายละเอียดวิธีวัดและข้อจำกัดอยู่ใน `docs/lab-12-quality-audit.md`

## Fresh-clone check

```bash
git clone https://github.com/Sojjyuu/khon-kaen-poi-week12.git
cd khon-kaen-poi-week12
npm ci
npm test
npm run typecheck
npm run check
npx expo start -c
```

การทดสอบ Web export ของเวอร์ชันนี้ยังไม่ได้ยืนยัน โปรดทดสอบบนอุปกรณ์ Android/iOS อีกครั้งหลังรวมการแก้ Expo Go

Invalid Event route:

```text
http://localhost:8081/events/not-found-test
```

## ก่อนส่ง

- ใช้ branch `main`
- ใช้รายงาน `docs/lab-12-quality-audit.md` เป็นหลักฐาน Week 12
- GitHub Actions ชื่อ **Week 12 Quality Check** ตรวจ test + TypeScript + Expo configuration
- ไม่อัปโหลด secret, API key, `node_modules` หรือ `.expo`
