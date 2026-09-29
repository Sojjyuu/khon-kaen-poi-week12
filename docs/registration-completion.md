# Registration completion — 29 September 2026

## Implemented
- Profile → กิจกรรมที่ลงทะเบียนแล้ว, plus a shortcut after successful submission.
- Account-scoped GET /registrations, including saved local-event details; old registrations with missing details remain visible with a fallback.
- Event detail displays ลงทะเบียนแล้ว after the server confirms status. Favorites remain independent.
- History cards expand to show saved description and registration reference, even when the original local event is no longer available.
- Confirmed cancellation via DELETE /registrations/:eventId. Canceling only affects the signed-in account. Favorites and scheduled reminders remain unchanged, as disclosed before confirmation.
- SQLite persistence survives API restart. Legacy databases gain no destructive migration.

## Bug report and regression
**Problem:** successful registration returned to detail with no confirmation, while “กิจกรรมที่บันทึก” actually meant favorites. Users could not review registrations.
**Reproduction:** log in, register for a seeded device event, open the saved-events page; it showed favorites instead of registration history.
**Fix:** distinct favorites labels, success screen, authenticated history API/UI and detail status.
**Regression:** registrationScreen.test.tsx verifies success and failure feedback; registrationsScreen.test.tsx verifies expanded details, confirmation before cancellation and retry. mockApi.test.cjs checks public/local registrations, restart persistence, deduplication, unauthorized reads and account-isolated cancellation.

## Verification
- npm run typecheck: passed.
- npm run lint: passed.
- Node tests: 20 passed; Jest: 29 passed across 12 suites (49 total).
- Expo Doctor 1.20.4: 21/21 passed.
- Expo export for Android and iOS: passed. This checks bundling, not installation or native runtime.

## Device smoke test still required
1. Register with account A; verify success → history → expanded details.
2. Return to the original event: verify ลงทะเบียนแล้ว.
3. Restart API/app: verify history persists.
4. Switch to B: verify A's registrations are absent.
5. Switch to A; dismiss cancellation first, then confirm it; verify removal and ability to register again.
6. Stop API; history should offer retry, not claim it is empty.

## Preview build / delivery
The existing eas.json contains development and preview profiles; preview produces an Android APK.
A signed-in EAS account, linked EAS project, reachable test API and a real install are still required. No Preview link or clean-install result is claimed here.
On the project owner's machine:

```bash
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest env:create --environment preview --name EXPO_PUBLIC_API_URL --value https://YOUR-TEST-API --visibility plaintext
npx eas-cli@latest build --platform android --profile preview
```

Replace the placeholder with the actual reachable API. A release binary cannot infer the development computer's LAN address from Metro. The local classroom API is not a hosted production authentication service. Do not publish real personal data.
Install the resulting APK on Android, repeat the smoke test on a clean install and attach the EAS link and actual results. iPhone internal distribution additionally requires the owner's Apple signing/device setup.

## Known limitations
- Optional registration-photo upload remains a validation/upload simulation; it is not a persistent photo gallery.
- Registration history currently contains event details and the registration reference, not an organizer/admin roster or email confirmation.
- Internet-backed images/maps and account API functionality require connectivity; history load errors have retry.
