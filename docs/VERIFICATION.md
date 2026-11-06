# Verification evidence

Verified on 6 November 2026 with Node.js 24.19.0, npm 11, PostgreSQL 17 and Chromium/Playwright. Hosted app: [sweety-jade.vercel.app](https://sweety-jade.vercel.app).

## Automated checks

All **29 tests passed** with no failures or skips: 13 backend/domain/seed tests and 16 frontend tests. Backend coverage includes bcrypt storage, ownership, invalid values/dates/slots, conflict handling, concurrent inserts/edits, database constraints, report calculations and repeatable normalized seeding. Frontend coverage includes form validation, API errors (including non-JSON 429 responses), chronological chart data, report recovery, keyboard tabs, dates, expired sessions and deletion states. The production build passes.

An earlier reviewed 28-test release also passed installation from a fresh archived checkout, migration/seed into an empty database, tests and build. The current 29-test version passed against the development database using disposable test schemas. A fresh-checkout run was not repeated for the typography/deployment changes. Installation reported zero known vulnerabilities when checked; this is not a security guarantee.

## Hosted flow

The tested story is registration/login → journal → create/edit/delete → persisted PostgreSQL data → refreshed reports → logout. Vercel Services serves frontend/API on one HTTPS origin with Neon Free PostgreSQL in Singapore.

| Boundary or behavior   | Observed outcome                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page identity/render   | Correct URL/title, meaningful journal, no framework overlay                                                                                                                 |
| API/database health    | GET /api/health returns 200 and {"ok":true}                                                                                                                                 |
| Authentication         | Demo login 200; unauthenticated profile 401; logout returns to sign-in                                                                                                      |
| Cookie/privacy         | HttpOnly, Secure, SameSite Strict, Path=/api; API Cache-Control is private/no-store                                                                                         |
| Seed persistence       | 28 fictional readings persisted across the power interruption                                                                                                               |
| Reports for 6 November | Daily 4, MTD 16, previous month 12; each average 117.5, high 132, low 94                                                                                                    |
| Hosted CRUD            | New fictional account registered (201); 112 saved through UI, survived reload, edited to 119; average updated; confirmed delete reduced count to 0                          |
| Validation             | Duplicate 409; future date 400; visible required-value feedback and focus on the invalid field                                                                              |
| Ownership              | Demo account could not update/delete another account's reading: both 404                                                                                                    |
| Preview isolation      | A preview-only reading was visible in preview while production stayed empty for that date; probe removed afterward                                                          |
| Platform protection    | Active valid WAF rule combines POST login/register: 20 requests per IP per 600 seconds. Repeated invalid requests triggered 429; the UI displayed its friendly wait message |
| Typography/layout      | 16px body text; 320/390/1024/1440px widths fit without horizontal page overflow; chart labels measure 14px at each width                                                    |
| Enlarged presentation  | Chart labels scale to 28 screen pixels with 200% CSS zoom; 720px viewport reflow fits. This is a focused simulation, not full browser-zoom certification                    |
| Keyboard               | Report ArrowRight selects/focuses the next tab; invalid-value submission focuses the value field                                                                            |

Earlier local browser checks also verified simulated 503 retry, failed deletion preserving data, and 401 session recovery. Expected 401/400/409/429 network errors from these probes are not application crashes. No unexplained application error was observed in the checked flows.

## Accessibility and screenshots

Axe 4.11 checks for WCAG 2 A/AA, 2.1 AA and 2.2 AA reported **zero violations** in checked hosted sign-in, desktop journal/chart, mobile journal/chart, reading-error and delete-dialog states. Keyboard/focus checks supplement the automated audit. This does not establish complete accessibility conformance or screen-reader compatibility.

[Daily journal](screenshots/daily-journal.png), [monthly trend](screenshots/monthly-trend.png), [mobile journal](screenshots/mobile-journal.png), [mobile trend](screenshots/mobile-trend.png), and [validation feedback](screenshots/reading-validation.png) were captured from the hosted app and visually inspected. All displayed data is fictional.

## Limitations

Safari, Firefox, actual browser 200% zoom controls and screen-reader testing remain unverified. Free hosting/database cold starts can delay first requests. The shared demo is editable by all visitors; individual accounts are separate. One empty fictional verification account remains in production; its test reading was deleted. Password recovery, per-session revocation, individual time zones, backup/restore drills and operational monitoring remain future work. This assessment environment is intended for fictional data.
