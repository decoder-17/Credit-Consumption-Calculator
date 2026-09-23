import type { PricingProvider } from "../domain";
import { muleSoftProvider } from "./mulesoft";
import { perSeatLicenseProvider } from "./per-seat-license";

export const providers: readonly PricingProvider[] = [muleSoftProvider, perSeatLicenseProvider];
export const providerRegistry = new Map(providers.map((provider) => [provider.id, provider]));
