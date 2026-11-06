# Requirements checklist

Required behavior and deliverables for the glucose tracker.

| Official requirement | Implementation and evidence |
| --- | --- |
| Node.js + Express, PostgreSQL, React | server/src, server/sql, client/src; real database tests and Vite build |
| Register name/email/password and log in | Auth.jsx and /api/auth routes; registration/login tests |
| Bcrypt password hashing | bcrypt cost 12; test checks stored hash |
| Only own readings | Authenticated user ID in every reading query; two-account API isolation tests |
| Create, view, edit, delete | ReadingForm and Dashboard; API tests and actual browser CRUD |
| Date, value in mg/dL, four exact slots | UI fields and SQL columns/check constraints |
| Required value, integer 40–600 inclusive | Client/API validation and database integer/range constraints; boundary and rejection tests |
| One slot per day, maximum four daily | Composite unique key plus four-slot check; simultaneous insert/edit tests |
| No future dates, including edits | Client/API checks and database trigger; API/database and component tests |
| Clear UI errors | Required-value browser screenshot; component tests for invalid values, future date and server conflict |
| Daily selected date | Date range tests and browser report |
| Month to date through selected date | Calendar/domain tests; browser November 1–6 range check |
| Monthly means full previous month | Leap-year/year-boundary tests; browser October 1–31 range check |
| Highest, lowest, average to one decimal, count | Reports.js and UI formatting; calculation tests |
| Empty report state | Null statistics and friendly message; domain/browser checks |
| Daily readings listed with slots | Four slot cards include recorded value/unit and edit/delete controls |
| A few meaningful tests | Domain/API tests plus React Testing Library form/chart tests |
| Public repo, regular commits | https://github.com/GlenTheReb/sweety; genuine milestone commits with subsequent pushes |
| README installation/database/server/client/tests | Root README quick start and commands table |
| Complete .env.example without secrets | Placeholder JWT/demo password, local-only database values; actual .env ignored |
| Demo-user seed with sample readings | Repeatable seed; clean-database verification; fictional values only |
| Screenshots or a short recording | Desktop, mobile and validation PNGs; monthly trend screenshot included |
| Notes on assumptions/improvements | README Notes and Design sections |

Optional bonuses selected: PostgreSQL Docker Compose setup, monthly line chart with accessible table, React Testing Library tests. Redis, BullMQ, doctor roles and pagination are intentionally outside this delivery.
