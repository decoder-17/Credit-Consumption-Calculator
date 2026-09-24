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
    unit: "Mule Credits",
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
        unit: "Mule Credits",
        lines,
      };
    },
    disclaimers: [
      "This estimate is for planning only, not a billing statement. Final charges may differ because plan terms, overage rates, taxes, fees, or other charges may not be included.",
      "Rates and available usage types depend on your subscription plan and Order Form.",
      ...(rateCard.version === "3.0"
        ? [
            "The 3.0 usage table and effective date are not yet fully published — confirm current rates with your account team.",
          ]
        : []),
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
