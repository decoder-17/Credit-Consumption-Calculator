import {
  graduatedTiers,
  MissingRateDataError,
  type PricingProvider,
} from "../domain";
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
      // Each rate needs a matching threshold, else capacity is NaN.
      if (usageType.rates.length !== muleSoftRateCard.thresholds.length)
        throw new MissingRateDataError(
          `Rate card misconfigured: ${usageType.id} has ${usageType.rates.length} rates but ${muleSoftRateCard.thresholds.length} tier thresholds.`,
        );
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
    "Each usage type is priced on a graduated scale: its multiplier steps down as that type's monthly consumption crosses 300K, 900K and 5M credits. Thresholds are tracked per usage type, reset on the 1st of each month, and apply across all environments (prod, pre-prod, sandbox, design). Enter a month's full usage; each month is priced from Tier 1.",
    "Rates vary by plan and can change, so confirm the current rate card and your Order Form with your account team.",
    "Every usage type is metered per day. For Flows, Managed Assets, Private Spaces, Network Connections and Load Balancers, enter the average daily count (for flows, the daily max); for messages, requests, pages and tasks, the average daily volume. The calculator multiplies by the billable days in the month.",
    "Billable days stop at the Order End Date. When the order ends partway through the calculation month, only the days up to and including the end date are counted.",
    "If this tool and the Digital Wallet disagree, the Wallet wins. It's the billing source of truth. Mule Credits don't roll over past your Order End Date.",
    "Saved months live in this browser only.",
  ],
};
