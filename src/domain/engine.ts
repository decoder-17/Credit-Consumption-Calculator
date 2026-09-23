import type { PriceLine, PriceResult, PricingProvider } from "./types";

export function priceProvider(provider: PricingProvider, input: Record<string, number>): PriceResult {
  return provider.price(input);
}

export function totalLines(lines: PriceLine[]): number {
  return lines.reduce((total, line) => total + line.amount, 0);
}
