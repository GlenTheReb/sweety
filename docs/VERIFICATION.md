# Verification evidence

Verified on 6 November 2026 with Node.js 24.19.0, npm 11.17.0, PostgreSQL 17 in Docker, and Chromium.

## Automated checks

All **28 tests passed**, with no failures or skips:

- **13 backend/domain/seed tests:** bcrypt storage, login, user isolation, forbidden edits/deletes, value/date/slot validation, edit conflicts, concurrent creates and edits, database constraints, report updates, calendar boundaries, rounding and empty reports. The real seed script is run twice in an isolated schema to verify email normalization and repeatability.
- **15 React component tests:** required/range/integer/future-date errors, edit request fields, server conflicts, accessible chart data, failed-report recovery, keyboard tabs, day navigation, expired sessions, deletion confirmation, pending requests and failed deletion.

A fresh archived checkout passed `npm ci`, migration into an empty database, demo seeding with a spaced/mixed-case email, all 28 tests and `npm run build`. Disposable test schemas and the verification database were removed afterwards. Setup did not rely on ignored local instructions, coaching files or existing app data. Installation reported zero known vulnerabilities at verification time; this is not a security guarantee.

## Browser checks

The flow under test was registration/login → journal → add/edit/delete → report refresh → logout. Playwright exercised the actual app at `http://127.0.0.1:5173`.

| Check | Observed outcome |
| --- | --- |
| Page identity and render | Correct URL/title, meaningful content, no framework error overlay |
| CRUD | Four slot readings displayed; edits update averages; confirmed deletion reduces count; adding the entry again restores it |
| Required-value error | Visible error, invalid-field association and focus on the value input |
| Report periods | November 6 produces November 1–6 and October 1–31; empty periods show a friendly state |
| Failed report | Simulated HTTP 503 shows a distinct error; retry succeeds without stale or falsely empty data |
| Deletion failure | Simulated HTTP 503 remains in the dialog and preserves the reading |
| Day navigation | Previous/next/today update the selected day; next-day navigation is disabled on today |
| Keyboard tabs | Arrow keys, Home and End move selection/focus and identify the active panel |
| Session expiry | Simulated HTTP 401 returns to sign-in with an explanation; login recovers; stale notices clear |
| Logout | Session clears and sign-in remains after reload |
| Chart | Seven fictional readings match the chronological data table; point details are available on keyboard focus |
| Responsive layout | Desktop 1440×1000 and mobile 390×844; no horizontal mobile overflow |
| Console | No unexplained runtime errors; unauthenticated probes and deliberately injected HTTP failures produce expected network errors |

## Accessibility

Axe checks for WCAG 2 A/AA, 2.1 AA and 2.2 AA rules reported **zero violations** in the tested sign-in, desktop journal/chart, reading-error dialog, delete dialog and mobile journal states. Initial contrast failures in action buttons and chart labels were corrected. Manual checks covered keyboard report navigation, invalid-field focus and modal dismissal. Automated checks do not establish full accessibility conformance.

## Screenshots and limitations

[Desktop journal](screenshots/daily-journal.png), [monthly trend](screenshots/monthly-trend.png), [mobile journal](screenshots/mobile-journal.png), and [validation dialog](screenshots/reading-validation.png) show fictional account data. Each screenshot was inspected for typography, contrast, spacing, clipping and control readability.

Safari, Firefox and screen-reader testing remain unverified. There is no hosted production deployment. Production readiness limitations are described in the README.
