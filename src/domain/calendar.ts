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
