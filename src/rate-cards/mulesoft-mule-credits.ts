import type { RateCardMeta } from "../domain";

export const muleSoftRateCard = {
  version: "May 2026",
  effectiveDate: "2026-05-01",
  sourceUrl: "https://www.salesforce.com/en-us/wp-content/uploads/sites/4/documents/mulesoft/Mule_Credit_Rate_Card.pdf",
  thresholds: [300000, 900000, 5000000, null] as const,
  usageTypes: [
    { id: "flows", label: "MuleSoft Flows", basis: "per flow", unitsPerBlock: 1, rates: [200, 120, 48, 19.2], exampleQuantity: 800 },
    { id: "messages", label: "MuleSoft Messages", basis: "per 1M messages", unitsPerBlock: 1000000, rates: [100000, 60000, 24000, 9600], exampleQuantity: 250000000 },
    { id: "assets", label: "Managed Assets", basis: "per asset", unitsPerBlock: 1, rates: [1000, 600, 240, 96], exampleQuantity: 40 },
    { id: "gateway", label: "Gateway Requests", basis: "per 1M requests", unitsPerBlock: 1000000, rates: [60000, 36000, 14400, 5760], exampleQuantity: 120000000 },
    { id: "idp", label: "IDP Pages", basis: "per page", unitsPerBlock: 1, rates: [45, 27, 10.8, 4.32], exampleQuantity: 15000 },
    { id: "fit", label: "Flow Integration Tasks", basis: "per task", unitsPerBlock: 1, rates: [2, 1.2, 0.48, 0.19], exampleQuantity: 2000000 },
    { id: "pspace", label: "Private Spaces", basis: "per space (space-days)", unitsPerBlock: 1, rates: [7500, 4500, 1800, 720], exampleQuantity: 60 },
    { id: "netconn", label: "Network Connections", basis: "per connection (days)", unitsPerBlock: 1, rates: [750, 450, 180, 72], exampleQuantity: 60 },
    { id: "lb", label: "Load Balancers", basis: "per LB (days)", unitsPerBlock: 1, rates: [4800, 2880, 1152, 460.8], exampleQuantity: 30 },
  ],
} satisfies RateCardMeta & { thresholds: readonly (number | null)[]; usageTypes: readonly unknown[] };
