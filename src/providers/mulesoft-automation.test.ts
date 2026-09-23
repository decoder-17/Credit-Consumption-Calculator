import { describe, expect, it } from "vitest";
import { muleSoftAutomationProvider } from "./mulesoft-automation";

describe("MuleSoft Automation Credits provider", () => {
  it("exposes the three documented credit systems", () => {
    expect(
      muleSoftAutomationProvider.models?.map((model) => model.rateCard.version),
    ).toEqual(["1.0", "2.0", "3.0"]);
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
    expect(
      model?.price({
        "flow-integration-tasks": 3,
        "flow-orchestration-runs": 10,
      }).total,
    ).toBe(6);
  });
});
