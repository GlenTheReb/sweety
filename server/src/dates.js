export function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value;
}

export function todayIn(timeZone, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function reportRanges(selectedDate) {
  const selected = parseDate(selectedDate);
  if (!selected) throw new Error("Invalid date.");
  const monthStart = `${selected.slice(0, 7)}-01`;
  const previousStartDate = new Date(`${monthStart}T00:00:00Z`);
  previousStartDate.setUTCMonth(previousStartDate.getUTCMonth() - 1);
  const previousEndDate = new Date(`${monthStart}T00:00:00Z`);
  previousEndDate.setUTCDate(0);
  return {
    daily: { from: selected, to: selected },
    monthToDate: { from: monthStart, to: selected },
    monthly: {
      from: previousStartDate.toISOString().slice(0, 10),
      to: previousEndDate.toISOString().slice(0, 10),
    },
  };
}
