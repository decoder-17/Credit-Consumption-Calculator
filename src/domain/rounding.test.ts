import { describe, expect, it } from "vitest";
import { allocateRoundedCredits } from "./rounding";

const sum = (values: number[]) => values.reduce((total, v) => total + v, 0);

describe("allocateRoundedCredits", () => {
  it("rounded rows sum to the rounded total", () => {
    // 15.5 + 0.62 = 16.12; rows must total 16, not 16 + 1.
    const rows = allocateRoundedCredits([15.5, 0.62, 0, 0]);
    expect(sum(rows)).toBe(16);
    expect(sum(rows)).toBe(Math.round(15.5 + 0.62));
  });
  it("leaves whole-credit amounts untouched", () => {
    expect(allocateRoundedCredits([6000, 62, 434, 620])).toEqual([
      6000, 62, 434, 620,
    ]);
  });
  it("keeps every row within one credit of its exact value", () => {
    const exact = [10.4, 10.4, 10.4, 10.4, 10.4];
    const rounded = allocateRoundedCredits(exact);
    expect(sum(rounded)).toBe(Math.round(sum(exact))); // 52
    rounded.forEach((value, index) => {
      expect(Math.abs(value - exact[index])).toBeLessThan(1);
    });
  });
  it("handles empty and all-zero inputs", () => {
    expect(allocateRoundedCredits([])).toEqual([]);
    expect(allocateRoundedCredits([0, 0, 0])).toEqual([0, 0, 0]);
  });
  it("total always equals the rounded exact total", () => {
    const cases = [
      [0.5, 0.5],
      [0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
      [1.9, 2.05, 3.33, 0.72],
      [100000.4, 60000.6, 24000.5],
    ];
    cases.forEach((amounts) => {
      expect(sum(allocateRoundedCredits(amounts))).toBe(
        Math.round(sum(amounts)),
      );
    });
  });
});
