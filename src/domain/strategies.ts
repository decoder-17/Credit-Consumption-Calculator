import type { TierBreakdown } from "./types";

export type StrategyResult = { amount: number; tierBreakdown?: TierBreakdown[] };

export type GraduatedTier = { upToCredits: number | null; creditsPerUnit: number };
export type GraduatedTiersConfig = { unitsPerBlock: number; tiers: GraduatedTier[] };

export function graduatedTiers(quantity: number, config: GraduatedTiersConfig): StrategyResult {
  let remaining = Math.max(0, quantity) / config.unitsPerBlock;
  let consumedCredits = 0;
  let previousThreshold = 0;
  const tierBreakdown: TierBreakdown[] = [];

  config.tiers.forEach((tier, index) => {
    if (remaining <= Number.EPSILON) return;
    const capacity = tier.upToCredits === null ? Number.POSITIVE_INFINITY : tier.upToCredits - previousThreshold;
    const pricedUnits = Math.min(remaining, capacity / tier.creditsPerUnit);
    const amount = pricedUnits * tier.creditsPerUnit;
    if (pricedUnits > 0) tierBreakdown.push({ tier: index + 1, quantity: pricedUnits * config.unitsPerBlock, amount });
    consumedCredits += amount;
    remaining -= pricedUnits;
    if (tier.upToCredits !== null) previousThreshold = tier.upToCredits;
  });

  return { amount: consumedCredits, tierBreakdown };
}

export function flatPerUnit(quantity: number, rate: number): StrategyResult {
  return { amount: Math.max(0, quantity) * rate };
}

export const perSeat = flatPerUnit;

export function committedWithOverage(quantity: number, committed: number, rate: number): StrategyResult {
  return { amount: Math.max(0, quantity - committed) * rate };
}

export function freeTierThenOverage(quantity: number, freeQuantity: number, rate: number): StrategyResult {
  return { amount: Math.max(0, quantity - freeQuantity) * rate };
}
