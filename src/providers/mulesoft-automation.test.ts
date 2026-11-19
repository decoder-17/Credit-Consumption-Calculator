import { describe, expect, it } from "vitest";
import { scheduleUnits } from "../domain";
import { muleSoftAutomationProvider } from "./mulesoft-automation";

const modelFor = (version: string) =>
  muleSoftAutomationProvider.models?.find(
    (model) => model.rateCard.version === version,
  );

describe("MuleSoft Automation Credits provider", () => {
  it("exposes the three documented credit systems", () => {
    expect(
      muleSoftAutomationProvider.models?.map((model) => model.rateCard.version),
    ).toEqual(["1.0", "2.0", "3.0"]);
  });
  it("meters every usage type per day across all credit systems", () => {
    muleSoftAutomationProvider.models?.forEach((model) => {
      const bases = model.usageTypes().map((type) => type.inputBasis);
      expect(bases.every((basis) => basis === "day")).toBe(true);
    });
  });
  it("converts Automation Credits 1.0 units into credits", () => {
    const model = muleSoftAutomationProvider.models?.find(
      (item) => item.rateCard.version === "1.0",
    );
    expect(model?.price({ "rpa-bot-minutes": 2 }).total).toBe(1);
  });
  it("applies Automation Credits 2.0 multipliers", () => {
    const model = muleSoftAutomationProvider.models?.find(
      (item) => item.rateCard.version === "2.0",
    );
    expect(model?.price({ "integration-tasks": 3 }).total).toBe(6);
  });
  it("prices documented Automation Credits 3.0 entries", () => {
    const model = muleSoftAutomationProvider.models?.find(
      (item) => item.rateCard.version === "3.0",
    );
    const result = model?.price({
      "flow-integration-tasks": 3,
      "idp-document-pages": 2,
      "flow-idp-pages": 1,
      "flow-orchestration-runs": 10,
    });
    expect(result?.total).toBe(96);
    expect(result?.unit).toBe("Automation Credits");
  });
});

describe("MuleSoft Automation Credits daily metering", () => {
  it("multiplies a flat daily volume by the billable days (2.0, credits per unit)", () => {
    // 10 integration tasks/day over a 30-day month => 300 tasks * 2 credits.
    const tasks = scheduleUnits([{ fromDay: 1, value: 10 }], 30);
    expect(tasks).toBe(300);
    expect(modelFor("2.0")?.price({ "integration-tasks": tasks }).total).toBe(
      600,
    );
  });
  it("sums a mid-month change-point before pricing (2.0)", () => {
    // 10/day days 1-15, 20/day from day 16 of a 30-day month => 150 + 300 = 450.
    const tasks = scheduleUnits(
      [
        { fromDay: 1, value: 10 },
        { fromDay: 16, value: 20 },
      ],
      30,
    );
    expect(tasks).toBe(450);
    expect(modelFor("2.0")?.price({ "integration-tasks": tasks }).total).toBe(
      900,
    );
  });
  it("stops counting at the Order End Date (billable window)", () => {
    // Order ends day 10: the day-16 change never lands => 10 * 10 = 100 tasks.
    const tasks = scheduleUnits(
      [
        { fromDay: 1, value: 10 },
        { fromDay: 16, value: 20 },
      ],
      10,
    );
    expect(tasks).toBe(100);
    expect(modelFor("2.0")?.price({ "integration-tasks": tasks }).total).toBe(
      200,
    );
  });
  it("converts daily usage into credits for the 1.0 conversion model", () => {
    // 120 bot minutes/day over 30 days => 3,600 minutes / 2 minutes per credit.
    const minutes = scheduleUnits([{ fromDay: 1, value: 120 }], 30);
    expect(minutes).toBe(3600);
    expect(modelFor("1.0")?.price({ "rpa-bot-minutes": minutes }).total).toBe(
      1800,
    );
  });
  it("is lossless: a daily average times days equals the monthly total", () => {
    // Flat per-unit pricing has no tiers, so daily-then-sum equals monthly.
    const daily = 100;
    const days = 31;
    const monthly = scheduleUnits([{ fromDay: 1, value: daily }], days);
    expect(monthly).toBe(daily * days);
    const viaDaily = modelFor("2.0")?.price({ "idp-document-pages": monthly })
      .total;
    const viaMonthly = modelFor("2.0")?.price({
      "idp-document-pages": daily * days,
    }).total;
    expect(viaDaily).toBe(viaMonthly);
  });
});
