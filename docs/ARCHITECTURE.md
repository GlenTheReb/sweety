# Architecture

## Request flow

React components use the shared API client in `client/src/lib.js`. Express authenticates the HttpOnly cookie and derives the user ID from its verified token. Every reading query filters on that ID; an ID supplied by a client never determines ownership. PostgreSQL parameters keep user values separate from SQL syntax.

Passwords use bcrypt with cost 12. Cookies use SameSite Strict and expire after seven days. Secure cookies require HTTPS when the server runs in production mode. Tokens are never placed in browser storage. Individual session revocation and password recovery remain future work.

## Reading invariants

Client validation provides immediate feedback. The API repeats the checks for every caller. PostgreSQL enforces integer/range checks, the exact slot names, and the unique `(user_id, reading_date, slot)` key. Because only four slots exist, uniqueness also guarantees a maximum of four daily readings.

An existence check alone cannot prevent concurrent duplicates: two requests can both pass before either inserts. The database key resolves that race atomically. Express translates the resulting constraint violation into a conflict response. Updates enforce the same constraints as inserts. A trigger independently rejects future dates.

## Calendar reports

Reading dates are calendar dates rather than timestamps. India Standard Time defines today consistently in the client, API and database trigger. UTC calendar arithmetic computes report boundaries without daylight-saving shifts. PostgreSQL returns date-only strings so JSON serialization cannot move a reading to an adjacent day.

One bounded query retrieves the previous month through the selected day. Pure report functions compute the three summaries, and the client displays averages to one decimal. No observations produces null statistics rather than a misleading zero glucose value. The result spans at most two calendar months, so an in-memory calculation remains small. SQL aggregation would suit a substantially larger analytics workload.

## Client behavior and charts

The journal refetches after successful mutations. Obsolete date requests are cancelled, and previous results are cleared during loading so a failed request cannot show another day's values. The monthly SVG chart plots actual readings in date/slot order and includes a data table. Lines connect recorded points; they do not represent measurements in the gaps.

## Verification boundaries

Domain tests cover calendar boundaries and calculations. API tests exercise real PostgreSQL with separate users and concurrent writes inside a disposable schema. React Testing Library checks form behavior at the API boundary. Chromium checks cover the rendered workflow and responsive layout. See [verification evidence](VERIFICATION.md) for observed results and remaining limitations.
