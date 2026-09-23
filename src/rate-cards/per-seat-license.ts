import type { RateCardMeta } from "../domain";

export type PerSeatLicenseRateCard = RateCardMeta & {
  currency: "USD";
  ratePerSeat: number | null;
  dataStatus: "needs-data" | "verified";
};

export const perSeatLicenseRateCard: PerSeatLicenseRateCard = {
  version: "unverified",
  effectiveDate: "[NEEDS DATA: rate-card effective date]",
  sourceUrl: "[NEEDS DATA: public or internal rate-card URL]",
  currency: "USD" as const,
  ratePerSeat: null as number | null,
  dataStatus: "needs-data" as const,
};
