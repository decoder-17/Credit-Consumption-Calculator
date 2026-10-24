import { describe, expect, it } from "vitest";
import { scheduleUnits } from "../domain";
import { muleSoftRateCard } from "../rate-cards/mulesoft-mule-credits";
import { muleSoftProvider } from "./mulesoft";

// Mule Credits Rate Card, updated as of May 2026.
const publishedRates: Record<string, number[]> = {
  flows: [200, 120, 48, 19.2],
  messages: [100000, 60000, 24000, 9600],
  assets: [1000, 600, 240, 96],
  gateway: [60000, 36000, 14400, 5760],
  idp: [45, 27, 10.8, 4.32],
  fit: [2, 1.2, 0.48, 0.19],
  pspace: [7500, 4500, 1800, 720],
  netconn: [750, 450, 180, 72],
  lb: [4800, 2880, 1152, 460.8],
};

function monthOf(input: Record<string, number>, days: number) {
  return Object.fromEntries(
    Object.entries(input).map(([id, daily]) => [id, daily * days]),
  );
}

describe("MuleSoft Mule Credits provider", () => {
  it("matches the published rate card multipliers and thresholds", () => {
    expect(muleSoftRateCard.thresholds).toEqual([
      300000,
      900000,
      5000000,
      null,
    ]);
    expect(
      Object.fromEntries(
        muleSoftRateCard.usageTypes.map((type) => [type.id, type.rates]),
      ),
    ).toEqual(publishedRates);
  });
  it("meters every usage type per day", () => {
    expect(
      muleSoftProvider.usageTypes().map((type) => type.inputBasis),
    ).toEqual(Array(9).fill("day"));
  });
  it("charges capacity meters for each unit on each day", () => {
    expect(muleSoftProvider.price(monthOf({ lb: 1 }, 30)).total).toBe(144000);
    expect(muleSoftProvider.price(monthOf({ netconn: 2 }, 31)).total).toBe(
      46500,
    );
    // 60 space-days: 40 at 7,500 fill Tier 1, the other 20 are at 4,500.
    expect(muleSoftProvider.price(monthOf({ pspace: 2 }, 30)).total).toBe(
      390000,
    );
  });
  it("switches tiers after the 300,000th, 900,000th and 5,000,000th credit", () => {
    const flows = (quantity: number) =>
      muleSoftProvider.price({ flows: quantity }).total;
    expect(flows(1500)).toBe(300000);
    expect(flows(1501)).toBe(300120);
    expect(flows(6500)).toBe(900000);
    expect(flows(6501)).toBe(900048);
    expect(flows(100000)).toBeCloseTo(5155200, 6);
    expect(
      muleSoftProvider.price({ messages: 3000000 }).lines[1].tierBreakdown,
    ).toEqual([{ tier: 1, quantity: 3000000, amount: 300000 }]);
    expect(
      muleSoftProvider.price({ flows: 15000000 }).lines[0].tierBreakdown,
    ).toHaveLength(4);
  });
  it("prices the example usage for a 30-day month", () => {
    const example = Object.fromEntries(
      muleSoftProvider
        .usageTypes()
        .map((type) => [type.id, type.exampleQuantity ?? 0]),
    );
    const result = muleSoftProvider.price(monthOf(example, 30));
    expect(result.total).toBeCloseTo(13077600, 6);
    expect(result.unit).toBe("Mule Credits");
  });
  it("prices nothing for no usage", () => {
    expect(muleSoftProvider.price({}).total).toBe(0);
  });
});

describe("MuleSoft daily schedule (mid-month changes)", () => {
  it("sums a mid-month flow increase, then prices within Tier 1", () => {
    // 10 flows days 1-9, 15 from day 10 of a 31-day month => 10*9 + 15*22 = 420.
    const flows = scheduleUnits(
      [
        { fromDay: 1, value: 10 },
        { fromDay: 10, value: 15 },
      ],
      31,
    );
    expect(flows).toBe(420);
    // 420 flow-days, all within Tier 1 (<= 1,500 flows): 420 * 200.
    expect(muleSoftProvider.price({ flows }).total).toBe(84000);
  });
  it("sums a mid-month decrease", () => {
    // 10 flows days 1-9, 5 from day 10 => 10*9 + 5*22 = 200.
    const flows = scheduleUnits(
      [
        { fromDay: 1, value: 10 },
        { fromDay: 10, value: 5 },
      ],
      31,
    );
    expect(flows).toBe(200);
    expect(muleSoftProvider.price({ flows }).total).toBe(40000);
  });
  it("matches a flat daily figure when the schedule never changes", () => {
    // A single change-point reduces to value * days, unchanged from before.
    const flows = scheduleUnits([{ fromDay: 1, value: 12 }], 30);
    expect(flows).toBe(360);
    expect(muleSoftProvider.price({ flows }).total).toBe(72000);
  });
  it("crosses a tier boundary when summed daily usage is high enough", () => {
    // 50 days 1-9, 100 from day 10 => 50*9 + 100*22 = 2,650 flow-days.
    const flows = scheduleUnits(
      [
        { fromDay: 1, value: 50 },
        { fromDay: 10, value: 100 },
      ],
      31,
    );
    expect(flows).toBe(2650);
    // Tier 1: 1,500 * 200 = 300,000; Tier 2: 1,150 * 120 = 138,000.
    expect(muleSoftProvider.price({ flows }).total).toBe(438000);
  });
  it("stops counting at the Order End Date (billable window)", () => {
    // Order ends day 8: the day-10 change never lands => 10*8 = 80 flow-days.
    const flows = scheduleUnits(
      [
        { fromDay: 1, value: 10 },
        { fromDay: 10, value: 15 },
      ],
      8,
    );
    expect(flows).toBe(80);
    expect(muleSoftProvider.price({ flows }).total).toBe(16000);
  });
});
