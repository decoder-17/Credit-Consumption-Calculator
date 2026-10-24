import type { DailySegment } from "./types";

const periodPattern = /^(\d{4})-(\d{2})$/;
const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

export function daysInMonth(period: string): number {
  const match = periodPattern.exec(period);
  if (!match) return 30;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]), 0)).getUTCDate();
}

// The Order End Date is the last day credits can be consumed, so it counts.
export function billableDaysInMonth(period: string, endDate: string): number {
  const days = daysInMonth(period);
  const month = periodPattern.exec(period);
  const end = datePattern.exec(endDate);
  if (!month || !end) return days;
  const monthIndex = Number(month[1]) * 12 + Number(month[2]);
  const endIndex = Number(end[1]) * 12 + Number(end[2]);
  if (endIndex < monthIndex) return 0;
  if (endIndex > monthIndex) return days;
  return Math.min(Number(end[3]), days);
}

// The billable quantity of a per-day meter is the value on each billable day,
// summed across the month. Change-points are sorted and each one holds until the
// next. Days before the first change-point, and days past the Order End Date
// (billableDays), don't count. A single change-point reduces to value * days.
export function scheduleUnits(
  segments: readonly DailySegment[],
  billableDays: number,
): number {
  if (billableDays <= 0) return 0;
  const sorted = segments
    .map((segment) => ({
      fromDay: Math.max(1, Math.floor(segment.fromDay || 1)),
      value: Math.max(0, segment.value || 0),
    }))
    .sort((a, b) => a.fromDay - b.fromDay);
  let total = 0;
  sorted.forEach((segment, index) => {
    if (segment.fromDay > billableDays) return;
    const nextStart = sorted[index + 1]?.fromDay ?? billableDays + 1;
    const span = Math.min(nextStart - 1, billableDays) - segment.fromDay + 1;
    if (span > 0) total += segment.value * span;
  });
  return total;
}
