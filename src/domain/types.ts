export type PricingUnit =
  "Mule Credits" | "Automation Credits" | "USD" | "seats";

export type UsageType = {
  id: string;
  label: string;
  basis: string;
  inputBasis?: "day" | "month";
  hint?: string;
  exampleQuantity?: number;
};

// A per-day meter can change partway through the month. Each segment reads
// "from this day of the month, the value becomes N"; the value holds until the
// next change-point (or the end of the billable window).
export type DailySegment = {
  fromDay: number;
  value: number;
};

export type DocumentationLink = {
  label: string;
  url: string;
};

export type RateCardMeta = {
  version: string;
  effectiveDate: string;
  sourceUrl: string;
  documentationUrls?: readonly DocumentationLink[];
};

export type TierBreakdown = {
  tier: number;
  quantity: number;
  amount: number;
};

export type PriceLine = {
  usageTypeId: string;
  quantity: number;
  amount: number;
  tierBreakdown?: TierBreakdown[];
  note?: string;
};

export type PriceResult = {
  total: number;
  unit: PricingUnit;
  lines: PriceLine[];
};

export type PricingProvider = {
  id: string;
  displayName: string;
  unit: PricingUnit;
  rateCard: RateCardMeta;
  usageTypes(): UsageType[];
  price(input: Record<string, number>): PriceResult;
  disclaimers: string[];
  models?: readonly PricingModel[];
};

export type PricingModel = Omit<PricingProvider, "models">;
