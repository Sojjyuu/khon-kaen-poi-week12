# Week 13 — Testing และ Debugging

ต่อยอดจาก Week 12 โดยทดสอบพฤติกรรมของแอปที่มีอยู่จริง: กิจกรรม รายการโปรด และการเปิดรายละเอียดกิจกรรม แอปนี้ไม่มี Login, Registration, token หรือ protected route จึงไม่สร้างตัวอย่าง test สำหรับฟีเจอร์ที่ไม่มี

## Quality gates

ทดสอบในโฟลเดอร์ติดตั้งใหม่ด้วย `npm ci` (Node 24.19.0), จากนั้นรัน:

| คำสั่ง | ผล |
|---|---|
| `npm run typecheck` | ผ่าน |
| `npm run lint` | ผ่าน |
| `npm test` | ผ่าน: Node tests 13 รายการ + Jest tests 5 รายการ |
| `CI=1 npx expo-doctor@1.20.4` | ผ่าน 21/21 checks |

ชุดเดิมตรวจ validation ของกิจกรรม กฎ reminder และ navigation payload ชุดใหม่ตรวจ pure favorite toggle, การกดดู/ลบ EventCard และการจัดเก็บรายการโปรด โดย mock เพียงขอบเขต AsyncStorage/formatter; test ไม่เรียก network จริง และไม่ผูกกับโครงสร้าง state ภายใน component

## Bug report และ regression test

**อาการ:** การเพิ่มสถานที่สองแห่งลง My Trip พร้อมกันอาจเหลือเพียงรายการเดียว

**ขั้นตอนทำซ้ำ:** เริ่มจาก storage ว่าง แล้วเรียก `Promise.all([toggleFavoritePoi('poi-a'), toggleFavoritePoi('poi-b')])` จากนั้นอ่านรายการโปรดที่จัดเก็บ

**สาเหตุ:** แต่ละคำสั่งอ่าน array เดิม `[]` แล้วเขียนคนละค่า งานที่เขียนทีหลังทับงานแรก

**ผลก่อนแก้:** test `keeps both favorites when two changes happen together` ล้มเหลวเมื่อรันกับ `src/services/favorites.ts` จาก Week 12

**วิธีแก้:** จัดคิวการอ่านและเขียนใน `toggleFavoritePoi` ให้แต่ละการเปลี่ยนแปลงจบก่อนเริ่มครั้งถัดไป และแยก `toggleFavoriteIds` เป็น pure function

**ผลหลังแก้:** regression test เดิมผ่าน ได้ `['poi-a', 'poi-b']`; มี unit test สำหรับเพิ่ม/ลบ id และกรณีข้อมูล storage เสีย

## Preview Build และ smoke test

`eas.json` มี `development` และ `preview` แยกกันอยู่แล้ว โดย `preview` กำหนด internal distribution และ Android APK สำหรับติดตั้งทดสอบ ข้อทดสอบจริงใน `.maestro/smoke.yaml` คือเปิดแอป → Reminder → รายละเอียดกิจกรรม

ยังไม่มี Preview Build link หรือหลักฐาน clean install บนอุปกรณ์ในรายงานนี้ เพราะสภาพแวดล้อมที่สร้างโค้ด **ไม่ได้ล็อกอิน EAS** (`eas whoami` ตอบ `Not logged in`) และไม่มี Android emulator/โทรศัพท์ที่เชื่อมต่อ จึงยังไม่ทำเครื่องหมายว่าส่ง build หรือรัน Maestro สำเร็จ

ผู้มีสิทธิ์ใน Expo account รันในโฟลเดอร์โปรเจกต์:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

หลังได้ลิงก์ APK ให้ติดตั้งบน Android เครื่องที่ยังไม่มีแอปนี้ ตรวจว่าเปิดได้ แล้วทำ flow ใน `.maestro/smoke.yaml` ด้วยมือหรือ Maestro บันทึกลิงก์ EAS build และผลจริงก่อนส่งงานตามหัวข้อ Preview Build

## Known issues

- Expo Go บน Android จำกัด native notification module และ remote push; ทดสอบ notification จริงบน Preview Build ด้วย
- Web export ของชุดนี้ยังไม่ได้ยืนยัน
- ยังไม่มีผลติดตั้ง APK ใหม่บนอุปกรณ์จริง


## 26 September 2026 — places and account UI

- `npm ci --no-audit --no-fund`: completed using the existing lockfile.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 32 passed (16 Node integration/repository tests + 16 Jest component/unit tests).
- `CI=1 npx expo export --platform android --platform ios --output-dir /tmp/poi-export`: both native bundles generated. This is a bundle check, not a physical-device test or installable preview build.
- New regression coverage: signup field validation, email normalization/duplicate rejection, password mismatch blocking, successful secure token storage, API login/restore, duplicate-email UI retains inputs.
- Photo metadata covers all 28 places. Replaced dead school/venue photo URLs found during checks. O Chira uses an explicitly captioned nearby-road photograph; not an inside-market photo.
- External image responses vary by host. Wikimedia rate-limited this environment during bulk checks; image display on the user's device remains to be confirmed. No claim that all remote images work offline.
- Expo Doctor was not rerun in this change; previous dependency patch-version findings remain separate from these passing checks.
- Classroom API account records are in-memory and reset when the API process restarts; see accounts-setup.md.

## Account persistence and separate profiles — 2026-09-26

- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: PASS — 17 Node tests + 20 Jest tests (37 total)
- Android/iOS `expo export`: PASS (bundle generation, not installed-device testing)
- Regression coverage: signup/login, persistent account/profile/registration across server restart, hashed passwords/tokens on disk, logout revocation, expired-session rejection, SecureStore deletion failure during restore, account-specific trip/favorite queued writes and event repository caches.
- User profile is now separate from `/about`; existing developer contact details preserved.
- Manual verification still needed: phone keyboard/font scale, profile edit, switching accounts, force-close/reopen with API running.
- Boundaries: single-process local API file persistence, device-local trip/favorites/events without cloud sync, existing device notifications not automatically canceled on logout, legacy unowned data not automatically assigned to a user. See `accounts-setup.md`.
- Expo Doctor dependency patch mismatches noted in earlier reports were not changed by this task.

## Regression fix: signup succeeds at API but session cannot be saved

- Root cause: SecureStore key `khonkaen/session-token` contains `/`, rejected by the installed SDK's real JS validator before native storage is called.
- Changed all session operations to `khonkaen.session-token`; no old-key migration is attempted because the old key was invalid.
- Separated device session-storage failure from generic network errors in the account form.
- Added `secureSession.test.tsx` using actual Expo SecureStore JS validation and mocking only the native device module. The earlier full SecureStore mocks did not cover this constraint.
- Typecheck and lint passed; all 21 Jest tests passed. No server behavior changed.
- A user whose signup reached the API should log in with that same account after updating; do not delete account data or create duplicate accounts.


## Account and journey update — 2026-09-28

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, no errors/warnings.
- `npm test`: PASS, 20 Node tests + 25 Jest tests (10 Jest suites).
- `CI=1 EXPO_OFFLINE=1 npx expo export --platform ios --platform android --output-dir /tmp/poi-account-export`: PASS both bundles. This is a JS/assets export, not an installed native build.
- Launcher smoke: start `scripts/start-dev.cjs`, poll API `/health` and Metro `/status`, send Ctrl+C; both servers ready and both ports closed after shutdown. Tested on Linux Node 24.19; Windows/phone confirmation remains manual.

Regression: signup previously reached the API but SecureStore rejected the key containing `/`. Key now uses a dot. Test retains real SecureStore JavaScript validation and mocks only the native storage boundary.

Persistence/integration: import legacy JSON once into SQLite while preserving IDs and hashes; reject corrupt import without overwriting; unseeded signup; profile bio/photo and trips persist after server restart; invalid trip date/photo rejected; another account cannot read, replace, or delete the first account's trip. Password plaintext/raw session tokens are absent from database rows.

UI: new journey form validates before sending, keeps the draft when API fails, and submits with the current account's token. Notifications: owner-scoped payload/identifier; logout cancels reminders while preserving unrelated notifications; queued old-account work rejected; another account's notification tap ignored.

Phone checks still required: iOS/Android photo picker (cancel/oversized photo), native SecureStore end-to-end signup, safe-area/font size on new screens, notification delivery and dismissal after logout. No device test or Preview Build claimed in this run. Expo Doctor was not rerun in this change; see previous baseline findings. API remains local classroom service, not public production hosting.

## Registration regression — 2026-09-29

Reproduction: sign in, open a device-seeded `explore-*` event or a user-created `local-*` event, fill a valid registration form, submit without a photo. The API previously knew only `api-event-1` and returned 404; the UI hid that cause behind a generic error.

Fix: submit the selected local event snapshot alongside registration. Validate the snapshot and its matching ID at the API, store it privately under the authenticated account in SQLite, and retain the existing per-account/event deduplication. Local snapshots never enter the public event catalog. Arbitrary unknown IDs without valid snapshots still fail; photo upload remains tied to the authenticated owner's registration. UI now distinguishes missing event, invalid data, and connectivity errors.

Validation: TypeScript and lint pass; Node tests 20/20 and Jest tests 26/26 (11 suites). Regression coverage submits the real registration screen, tests local/seeded events via the API, duplicate requests, restart persistence, malformed snapshots, and cross-account photo denial. Phone retest pending. Update both app code and running API before retrying; no account reset required.
