import { MissingRateDataError, perSeat, type PricingProvider } from "../domain";
import {
  perSeatLicenseRateCard,
  type PerSeatLicenseRateCard,
} from "../rate-cards/per-seat-license";

export function createPerSeatLicenseProvider(
  rateCard: PerSeatLicenseRateCard = perSeatLicenseRateCard,
): PricingProvider {
  return {
    id: "flat-per-seat-license",
    displayName: "Flat per-seat license",
    unit: "USD",
    rateCard,
    usageTypes: () => [
      {
        id: "seats",
        label: "Licensed seats",
        basis: "per seat",
        inputBasis: "month",
        hint: "Enter the number of licensed seats.",
      },
    ],
    price: (input) => {
      if (rateCard.ratePerSeat === null)
        throw new MissingRateDataError(
          "[NEEDS DATA: per-seat USD rate and verified source]",
        );
      const quantity = Math.max(0, input.seats ?? 0);
      const amount = perSeat(quantity, rateCard.ratePerSeat).amount;
      return {
        total: amount,
        unit: "USD",
        lines: [{ usageTypeId: "seats", quantity, amount }],
      };
    },
    disclaimers: [
      "This estimate is for planning only, not a billing statement. Final charges may differ because contract terms, overage rates, taxes, fees, or other charges may not be included.",
      "[NEEDS DATA: vendor name and non-affiliation disclaimer]",
      "[NEEDS DATA: plan-specific pricing disclaimer]",
    ],
  };
}

export const perSeatLicenseProvider = createPerSeatLicenseProvider();
