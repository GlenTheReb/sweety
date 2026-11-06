# Verification evidence

Verified on 6 November 2026 using Node.js 24.19.0, npm 11.17.0 and PostgreSQL 17 in Docker.

## Automated checks

`npm test` exercises real PostgreSQL in an isolated temporary schema, plus pure domain tests. It covers registration/password hashing, login, private listing/reporting, forbidden edits/deletes, invalid values/dates/slots, conflicting edits, simultaneous creates and edits, database constraints, logout, report updates, leap years, year boundaries, rounding and empty reports.

`npm run build` compiles the React client successfully. `npm audit` reported zero known vulnerabilities at installation time; this is a point-in-time dependency check, not a security guarantee.

## Browser checks

The flow under test was: registration/login → journal → add/edit/delete readings → refresh reports → logout. Playwright was used because the separate Browser plugin/skill was not available in this session.

| Check | Observed outcome |
| --- | --- |
| Page identity | Correct local URL and Sweety title |
| Meaningful render | Auth screen and journal render without a framework error overlay |
| Create | Four slot readings save and appear with values and units |
| Required error | Empty value shows “Please enter a glucose value.” in the dialog |
| Edit | Changing 94 to 95 updates the daily average to 117.8 |
| Delete | Confirming deletion reduces the count; adding the reading again restores it |
| Periods | November 6 yields November 1–6 and October 1–31 |
| Empty report | Previous month without entries shows the friendly empty state |
| Session | Login persists across reload; logout persists across reload |
| Keyboard | Native dialog closes on Escape and manages modal focus |
| Responsive | Desktop 1440×1000 and mobile 390×844; no horizontal mobile overflow |
| Console | No runtime app errors on final authenticated render; unauthenticated session probes produce expected HTTP 401 responses |

Screenshots: [desktop journal](screenshots/daily-journal.png), [mobile journal](screenshots/mobile-journal.png), [validation dialog](screenshots/reading-validation.png). All displayed account/readings are fictional. Screenshots were visually inspected for clipping, spacing, typography, controls and error readability.

## Limits

Browser checks used Chromium; Safari/Firefox and assistive-technology testing remain unverified. There is no deployed production environment. Claude has not reviewed the app. Clean-install verification results will be recorded before delivery.
