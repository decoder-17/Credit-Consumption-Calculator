import { describe, expect, it } from "vitest";
import { muleSoftProvider } from "./mulesoft";

describe("MuleSoft Mule Credits provider", () => {
  it("locks the legacy example output", () => {
    const result = muleSoftProvider.price(Object.fromEntries(muleSoftProvider.usageTypes().map((usageType) => [usageType.id, usageType.exampleQuantity ?? 0])));
    expect(result.total).toBe(10869200);
    expect(result.unit).toBe("Mule Credits");
  });
  it("preserves zero and over-limit behavior", () => {
    expect(muleSoftProvider.price({}).total).toBe(0);
    expect(muleSoftProvider.price({ flows: 15000000 }).lines[0].tierBreakdown).toHaveLength(4);
  });
});
