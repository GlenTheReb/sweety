# Engineering walkthrough

## Follow one reading through the app

`client/src/components/ReadingForm.jsx` gathers a date, slot and value. Browser form values arrive as strings, even when an input has `type="number"`. The form rejects missing and fractional values, then sends JSON through `client/src/lib.js`. Client validation helps the user correct mistakes quickly; it cannot protect the database because another client can call the API directly.

`server/src/app.js` verifies the signed cookie, obtains the user's ID and calls `server/src/validation.js`. It checks the actual input type, an integer value in the inclusive range, a real calendar date, the future-date rule and membership in the four allowed slots. Queries bind values using PostgreSQL placeholders. Updates and deletes include both reading ID and authenticated user ID, preventing another user's guessed ID from granting access.

`server/sql/001_init.sql` provides the final constraints. Two concurrent requests may both pass an earlier existence check. The unique key makes the database decide atomically which insert succeeds. The losing request becomes a friendly conflict response. Four allowed slots multiplied by one row per slot means no fifth daily reading can exist, so a separate racing counter is unnecessary. Check constraints and a trigger protect value, slot and date rules even when writes bypass Express.

After the server confirms success, `Dashboard.jsx` refetches the reports. It does not increment totals optimistically and risk showing a reading that failed to save. An AbortController cancels obsolete date fetches so a slower response for yesterday cannot replace the currently selected day.

## Calendar reports

`server/src/dates.js` uses date-only strings and UTC calendar arithmetic to find report boundaries, avoiding accidental shifts caused by machine time zones or daylight saving. The definition of today uses India Standard Time. PostgreSQL returns dates formatted as date-only strings, so JSON never turns a date into a timestamp on the wrong day.

`server/src/reports.js` filters the bounded result set into three periods and calculates minimum, maximum, average and count. A selected daily report has at most four rows; the query for all three reports spans at most two calendar months. An in-memory calculation is simple and bounded here. SQL aggregation would be preferable for much larger histories or analytics workloads.

An empty average is null rather than zero. Zero would describe a measured value and distort the meaning of an empty report. The UI displays a friendly message instead.

`TrendChart.jsx` plots actual readings in date/slot order. The horizontal axis reflects calendar time and the vertical axis has labeled glucose bounds. Connecting points does not invent readings in the gaps. A data table exposes the same values without relying on the visual. The dataset is bounded by a calendar month, so a small SVG is sufficient without a chart library.

React Testing Library tests interact through labels and buttons. They verify that invalid input never calls the API, edit requests contain the correct fields, and a failed save remains an error. The API is mocked at this component boundary; separate real-database tests verify the backend. Each layer answers a different question.

## Interview practice

### 1. Why validate in the UI, API and database?

The UI provides fast feedback, the API protects the business rules for every client, and the database preserves stored data when multiple requests race or another tool writes directly. In Sweety, the form's numeric input is only a convenience. The API checks type and range, and PostgreSQL checks the integer value and unique user/date/slot key. Removing any one layer changes either usability or reliability.

### 2. Why does checking for a duplicate before inserting fail under concurrency?

Checking and inserting are separate operations. Requests A and B can both see no existing reading and then both try to insert. A database unique constraint performs the decisive check during the write, so exactly one succeeds. The API translates PostgreSQL's unique violation into HTTP 409. The precheck remains useful for a readable error, while the constraint is the source of truth. Use a transaction and locks for more complicated limits that cannot be expressed as a unique key.

### 3. How do you prevent one user from editing another user's reading?

Authentication identifies the caller; authorization decides which records that caller may use. Sweety takes the user ID from a verified cookie, never from the request body. An update has a predicate like `WHERE id=$4 AND user_id=$5`. An unmatched row returns 404, including when another user's row exists. API tests create two independent sessions and attempt reads, reports, edits and deletes across accounts.

### 4. What would you change before serving real patients?

Keep the current constraints, then add sign-in rate limits, password recovery, revocable sessions, HTTPS, backups, operational monitoring and account time zones. Privacy and reliability matter more than adding charts first. The current seven-day cookie is simple for an assessment, but a signed token cannot be individually revoked without additional server state. A session table would add a database lookup but support logout from every device and administrative revocation. Changes should be selected from concrete threats and product needs, then verified with focused tests.

## Reusable problem-solving strategy

Write the invariant in plain language, identify the layer that can enforce it atomically, make the failure understandable, and test the failure path with realistic conditions. For calendar rules, choose a time-zone convention explicitly and test month/year boundaries before styling the result. For ownership rules, use two accounts in tests rather than assuming that hiding buttons is authorization.
