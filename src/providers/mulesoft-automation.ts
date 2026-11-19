import {
  flatPerUnit,
  unitsToCredits,
  type PricingModel,
  type PricingProvider,
} from "../domain";
import {
  automationRateCards,
  type AutomationRateCard,
} from "../rate-cards/mulesoft-automation-credits";

function createModel(rateCard: AutomationRateCard): PricingModel {
  return {
    id: `mulesoft-automation-credits-${rateCard.version}`,
    displayName: `MuleSoft Automation Credits ${rateCard.version}`,
    unit: "Automation Credits",
    rateCard,
    usageTypes: () =>
      rateCard.usageTypes.map(
        ({ id, label, basis, inputBasis, exampleQuantity }) => ({
          id,
          label,
          basis,
          inputBasis,
          exampleQuantity,
        }),
      ),
    price: (input) => {
      const lines = rateCard.usageTypes.map((usageType) => {
        const quantity = Math.max(0, input[usageType.id] ?? 0);
        const strategy =
          rateCard.pricingMode === "units-per-credit"
            ? unitsToCredits(quantity, usageType.rate)
            : flatPerUnit(quantity, usageType.rate);
        return {
          usageTypeId: usageType.id,
          quantity,
          amount: strategy.amount,
          note:
            usageType.rate === 0
              ? "Included for the documented plan scope."
              : undefined,
        };
      });
      return {
        total: lines.reduce((sum, line) => sum + line.amount, 0),
        unit: "Automation Credits",
        lines,
      };
    },
    disclaimers: [
      "Use this for planning. It isn't a billing statement, and your final charges can differ: plan terms, overage rates, taxes, fees and other charges may not be included.",
      "Which usage types you get, and at what rate, depends on your subscription plan and Order Form.",
      "Every usage type is metered per day. Enter the average daily volume — bot minutes, API calls, tasks, pages or runs consumed on a typical day — and the calculator multiplies it by the billable days in the month. If that volume changed partway through the month, hit Add change to log the day it changed and the new daily figure.",
      "Billable days stop at the Order End Date. When the order ends partway through the calculation month, only the days up to and including the end date are counted.",
      "Automation Credits are priced on a flat per-unit basis with no volume tiers, so a month's credits equal its total units times the rate. Entering a daily average times the billable days gives the same result as entering the monthly total.",
      rateCard.pricingMode === "units-per-credit"
        ? "This credit system converts usage into credits (a number of units per credit), so the credit cost per unit is far lower than the 2.0 and 3.0 multiplier systems. Totals aren't comparable across credit systems."
        : "This credit system uses multiplier rates (credits per unit), so the credit cost per unit is far higher than the 1.0 conversion system. Totals aren't comparable across credit systems.",
      ...(rateCard.version === "3.0"
        ? [
            "RPA and Composer usage types are not available in 3.0 (moving to end of sale), and Flow Orchestration is included at no credit cost for Enterprise and higher editions. MuleSoft hasn't published a 3.0 effective date; confirm current rates with your account team.",
          ]
        : []),
      "If this tool and the Digital Wallet disagree, the Wallet wins. It's the billing source of truth.",
      "Saved months live in this browser only.",
    ],
  };
}

const models = automationRateCards.map(createModel);
const defaultModel =
  models.find((model) => model.id.endsWith("3.0")) ?? models[0];

export const muleSoftAutomationProvider: PricingProvider = {
  ...defaultModel,
  id: "mulesoft-automation-credits",
  displayName: "MuleSoft Automation Credits",
  models,
  price: defaultModel.price,
};
