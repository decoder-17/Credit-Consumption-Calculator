import { describe, expect, it } from "vitest";
import { MissingRateDataError } from "../domain";
import { createPerSeatLicenseProvider } from "./per-seat-license";

describe("flat per-seat provider", () => {
  const provider = createPerSeatLicenseProvider({ version: "fixture", effectiveDate: "2026-01-01", sourceUrl: "https://example.test/rate-card", currency: "USD", ratePerSeat: 25, dataStatus: "verified" });

  it("prices zero, normal, and negative quantities", () => {
    expect(provider.price({ seats: 0 }).total).toBe(0);
    expect(provider.price({ seats: 4 }).total).toBe(100);
    expect(provider.price({ seats: -1 }).total).toBe(0);
  });
  it("requires production rate data instead of guessing", () => {
    expect(() => createPerSeatLicenseProvider().price({ seats: 4 })).toThrow(MissingRateDataError);
  });
});
