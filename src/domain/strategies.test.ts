import { describe, expect, it } from "vitest";
import {
  committedWithOverage,
  flatPerUnit,
  freeTierThenOverage,
  graduatedTiers,
  perSeat,
} from "./strategies";

describe("pricing strategies", () => {
  it("prices graduated tiers at boundaries", () => {
    const config = {
      unitsPerBlock: 1,
      tiers: [
        { upToCredits: 10, creditsPerUnit: 2 },
        { upToCredits: 20, creditsPerUnit: 1 },
        { upToCredits: null, creditsPerUnit: 0.5 },
      ],
    };
    expect(graduatedTiers(0, config).amount).toBe(0);
    expect(graduatedTiers(5, config).amount).toBe(10);
    expect(graduatedTiers(15, config).amount).toBe(20);
    expect(graduatedTiers(30, config).amount).toBe(27.5);
  });
  it("prices flat units and seats", () => {
    expect(flatPerUnit(3, 2.5).amount).toBe(7.5);
    expect(perSeat(4, 12).amount).toBe(48);
    expect(flatPerUnit(-2, 2.5).amount).toBe(0);
  });
  it("prices committed overage and free-tier overage", () => {
    expect(committedWithOverage(9, 10, 4).amount).toBe(0);
    expect(committedWithOverage(12, 10, 4).amount).toBe(8);
    expect(freeTierThenOverage(100, 100, 4).amount).toBe(0);
    expect(freeTierThenOverage(125, 100, 4).amount).toBe(100);
  });
});
