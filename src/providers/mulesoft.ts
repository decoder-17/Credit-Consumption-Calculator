import { graduatedTiers, type PricingProvider } from "../domain";
import { muleSoftRateCard } from "../rate-cards/mulesoft-mule-credits";

export const muleSoftProvider: PricingProvider = {
  id: "mulesoft-mule-credits",
  displayName: "MuleSoft Mule Credits",
  unit: "Mule Credits",
  rateCard: muleSoftRateCard,
  usageTypes: () => muleSoftRateCard.usageTypes.map(({ id, label, basis, exampleQuantity }) => ({ id, label, basis, exampleQuantity })),
  price: (input) => {
    const lines = muleSoftRateCard.usageTypes.map((usageType) => {
      const result = graduatedTiers(input[usageType.id] ?? 0, {
        unitsPerBlock: usageType.unitsPerBlock,
        tiers: usageType.rates.map((creditsPerUnit, index) => ({ upToCredits: muleSoftRateCard.thresholds[index], creditsPerUnit })),
      });
      return { usageTypeId: usageType.id, quantity: Math.max(0, input[usageType.id] ?? 0), amount: result.amount, tierBreakdown: result.tierBreakdown };
    });
    return { total: lines.reduce((total, line) => total + line.amount, 0), unit: "Mule Credits", lines };
  },
  disclaimers: [
    "Rates are plan-specific and may change. Verify the current rate card and Order Form with your account team.",
    "Enter billable units from Anypoint Usage Reports; this tool does not reproduce raw-to-billable aggregation.",
    "The Digital Wallet is the billing source of truth. Mule Credits do not roll over past the Order End Date.",
    "This tool is not affiliated with or endorsed by MuleSoft or Salesforce.",
  ],
};
