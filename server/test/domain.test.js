import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDate, reportRanges, todayIn } from "../src/dates.js";
import { validateReading } from "../src/validation.js";
import { buildReports } from "../src/reports.js";
test("strict calendar dates and India day boundary", () => {
  assert.equal(parseDate("2024-02-29"), "2024-02-29");
  for (const date of ["2025-02-29", "2026-04-31", "2026-1-01", "abc"])
    assert.equal(parseDate(date), null);
  assert.equal(
    todayIn("Asia/Kolkata", new Date("2026-11-05T18:30:00Z")),
    "2026-11-06",
  );
});
test("validation covers inclusive bounds, required value, integers, dates and slots", () => {
  const base = { date: "2026-01-01", slot: "After lunch", value: 40 };
  assert.equal(validateReading(base, "2026-01-01"), null);
  assert.equal(validateReading({ ...base, value: 600 }, "2026-01-01"), null);
  for (const value of ["", null, undefined, 39, 601, 50.5, "1e2", true, "   "])
    assert.ok(validateReading({ ...base, value }, "2026-01-01"));
  assert.match(
    validateReading({ ...base, date: "2026-01-02" }, "2026-01-01"),
    /future/,
  );
  assert.ok(validateReading({ ...base, slot: "Bedtime" }, "2026-01-01"));
  assert.ok(validateReading({ ...base, date: "2026-02-30" }, "2026-03-01"));
});
test("ranges cross January and leap-year boundaries correctly", () => {
  assert.deepEqual(reportRanges("2026-01-15").monthly, {
    from: "2025-12-01",
    to: "2025-12-31",
  });
  assert.deepEqual(reportRanges("2024-03-01").monthly, {
    from: "2024-02-01",
    to: "2024-02-29",
  });
  assert.deepEqual(reportRanges("2026-11-06").monthToDate, {
    from: "2026-11-01",
    to: "2026-11-06",
  });
});
test("reports isolate ranges, round averages and represent empty periods", () => {
  const result = buildReports("2026-01-15", [
    { date: "2025-11-30", value: 600 },
    { date: "2025-12-01", value: 90 },
    { date: "2025-12-31", value: 111 },
    { date: "2026-01-01", value: 100 },
    { date: "2026-01-15", value: 101 },
    { date: "2026-01-15", value: 105 },
    { date: "2026-01-16", value: 600 },
  ]);
  assert.equal(result.monthly.count, 2);
  assert.deepEqual(
    result.monthly.readings.map((r) => r.value),
    [90, 111],
  );
  assert.equal(result.monthly.average, 100.5);
  assert.equal(result.monthToDate.average, 102);
  assert.equal(result.daily.average, 103);
  assert.equal(result.daily.highest, 105);
  assert.equal(result.daily.lowest, 101);
  assert.equal(result.daily.readings.length, 2);
  assert.equal(buildReports("2026-01-15", []).daily.average, null);
  assert.equal(
    buildReports("2026-01-15", [
      { date: "2026-01-15", value: 100 },
      { date: "2026-01-15", value: 100 },
      { date: "2026-01-15", value: 101 },
    ]).daily.average,
    100.3,
  );
});
