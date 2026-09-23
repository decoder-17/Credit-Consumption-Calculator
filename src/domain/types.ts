export type PricingUnit = "Mule Credits" | "USD" | "seats";
export type CurrencyCode = "USD";

export type UsageType = {
  id: string;
  label: string;
  basis: string;
  inputBasis?: "day" | "month";
  hint?: string;
  exampleQuantity?: number;
};

export type RateCardMeta = {
  version: string;
  effectiveDate: string;
  sourceUrl: string;
  documentationUrls?: readonly string[];
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
