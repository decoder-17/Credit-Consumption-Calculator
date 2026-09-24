import { graduatedTiers, type PricingProvider } from "../domain";
import { muleSoftRateCard } from "../rate-cards/mulesoft-mule-credits";

export const muleSoftProvider: PricingProvider = {
  id: "mulesoft-mule-credits",
  displayName: "MuleSoft Mule Credits",
  unit: "Mule Credits",
  rateCard: muleSoftRateCard,
  usageTypes: () =>
    muleSoftRateCard.usageTypes.map(
      ({ id, label, basis, inputBasis, exampleQuantity }) => ({
        id,
        label,
        basis,
        inputBasis,
        exampleQuantity,
      }),
    ),
  price: (input) => {
    const lines = muleSoftRateCard.usageTypes.map((usageType) => {
      const result = graduatedTiers(input[usageType.id] ?? 0, {
        unitsPerBlock: usageType.unitsPerBlock,
        tiers: usageType.rates.map((creditsPerUnit, index) => ({
          upToCredits: muleSoftRateCard.thresholds[index],
          creditsPerUnit,
        })),
      });
      return {
        usageTypeId: usageType.id,
        quantity: Math.max(0, input[usageType.id] ?? 0),
        amount: result.amount,
        tierBreakdown: result.tierBreakdown,
      };
    });
    return {
      total: lines.reduce((total, line) => total + line.amount, 0),
      unit: "Mule Credits",
      lines,
    };
  },
  disclaimers: [
    "Use this for planning. It isn't a billing statement, and your final charges can differ: contract terms, overage rates, taxes, fees and other charges may not be included.",
    "Each usage type is priced on a graduated scale, much like tax brackets. Its multiplier steps down every time that type's monthly credit consumption crosses a threshold, at 300K, 900K and 5M credits. Thresholds are tracked per usage type and reset on the 1st of each calendar month. The same multipliers apply across all environments (prod, pre-prod, sandbox, design).",
    "Rates vary by plan and can change, so confirm the current rate card and your Order Form with your account team.",
    "Pull billable units from Anypoint Usage Reports and enter those. The raw-to-billable aggregation (daily-max flows, space-days, message counts) isn't reproduced here.",
    "If this tool and the Digital Wallet disagree, the Wallet wins. It's the billing source of truth. Mule Credits don't roll over past your Order End Date.",
    "Saved months live in this browser only.",
  ],
};
