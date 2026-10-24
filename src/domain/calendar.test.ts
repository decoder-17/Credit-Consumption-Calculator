import { describe, expect, it } from "vitest";
import { billableDaysInMonth, daysInMonth, scheduleUnits } from "./calendar";

describe("calendar", () => {
  it("counts the days in each calendar month", () => {
    expect(daysInMonth("2026-01")).toBe(31);
    expect(daysInMonth("2026-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
    expect(daysInMonth("2100-02")).toBe(28);
    expect(daysInMonth("2026-09")).toBe(30);
    expect(daysInMonth("2026-12")).toBe(31);
    expect(daysInMonth("")).toBe(30);
  });
  it("stops billable days at the Order End Date, inclusive", () => {
    expect(billableDaysInMonth("2026-10", "")).toBe(31);
    expect(billableDaysInMonth("2026-10", "2027-03-31")).toBe(31);
    expect(billableDaysInMonth("2026-10", "2026-10-15")).toBe(15);
    expect(billableDaysInMonth("2026-10", "2026-10-31")).toBe(31);
    expect(billableDaysInMonth("2026-10", "2026-10-01")).toBe(1);
    expect(billableDaysInMonth("2026-10", "2026-09-30")).toBe(0);
    expect(billableDaysInMonth("2028-02", "2028-02-29")).toBe(29);
  });
  it("sums a flat schedule as value times days", () => {
    expect(scheduleUnits([{ fromDay: 1, value: 10 }], 31)).toBe(310);
  });
  it("sums a mid-month increase across its day spans", () => {
    // 10 for days 1-9, 15 from day 10 through 31 => 10*9 + 15*22
    expect(
      scheduleUnits(
        [
          { fromDay: 1, value: 10 },
          { fromDay: 10, value: 15 },
        ],
        31,
      ),
    ).toBe(420);
  });
  it("handles a mid-month decrease", () => {
    // 10 for days 1-9, 5 from day 10 => 10*9 + 5*22
    expect(
      scheduleUnits(
        [
          { fromDay: 1, value: 10 },
          { fromDay: 10, value: 5 },
        ],
        31,
      ),
    ).toBe(200);
  });
  it("clips change-points to the billable window", () => {
    // Order ends day 8: only 10*8 counts, the day-10 change never lands.
    expect(
      scheduleUnits(
        [
          { fromDay: 1, value: 10 },
          { fromDay: 10, value: 15 },
        ],
        8,
      ),
    ).toBe(80);
  });
  it("ignores days before the first change-point", () => {
    // Nothing in use until day 5 => 10 for days 5-31 = 10*27
    expect(scheduleUnits([{ fromDay: 5, value: 10 }], 31)).toBe(270);
  });
  it("lets the later change win when two share a day", () => {
    // Days 1-9 are zero, 5 from day 10 through 31 => 5*22
    expect(
      scheduleUnits(
        [
          { fromDay: 10, value: 15 },
          { fromDay: 10, value: 5 },
        ],
        31,
      ),
    ).toBe(110);
  });
  it("returns zero when there are no billable days", () => {
    expect(scheduleUnits([{ fromDay: 1, value: 10 }], 0)).toBe(0);
  });
});
