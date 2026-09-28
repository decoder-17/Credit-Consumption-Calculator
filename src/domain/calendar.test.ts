import { describe, expect, it } from "vitest";
import { billableDaysInMonth, daysInMonth } from "./calendar";

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
});
