import { reportRanges } from "./dates.js";
export function summarize(readings) {
  const values = readings.map((r) => r.value);
  return {
    count: values.length,
    highest: values.length ? Math.max(...values) : null,
    lowest: values.length ? Math.min(...values) : null,
    average: values.length
      ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
      : null,
  };
}
export function buildReports(date, readings) {
  return Object.fromEntries(
    Object.entries(reportRanges(date)).map(([key, range]) => {
      const items = readings.filter(
        (r) => r.date >= range.from && r.date <= range.to,
      );
      return [
        key,
        {
          ...range,
          ...summarize(items),
          ...(key === "daily" ? { readings: items } : {}),
        },
      ];
    }),
  );
}
