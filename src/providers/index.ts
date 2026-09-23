import type { PricingProvider } from "../domain";
import { muleSoftProvider } from "./mulesoft";
import { muleSoftAutomationProvider } from "./mulesoft-automation";

export const providers: readonly PricingProvider[] = [
  muleSoftProvider,
  muleSoftAutomationProvider,
];
export const providerRegistry = new Map(
  providers.map((provider) => [provider.id, provider]),
);
