import type { RateCardMeta } from "../domain";

export type AutomationRateCard = RateCardMeta & {
  version: "1.0" | "2.0" | "3.0";
  pricingMode: "units-per-credit" | "credits-per-unit";
  usageTypes: readonly {
    id: string;
    label: string;
    basis: string;
    rate: number;
    // Volume meters, metered per day: daily figure times billable days.
    inputBasis: "day";
    exampleQuantity?: number;
    note?: string;
  }[];
};

export const automationRateCards: readonly AutomationRateCard[] = [
  {
    version: "1.0",
    effectiveDate: "",
    sourceUrl:
      "https://docs.mulesoft.com/general/mulesoft-automation-credits-1-0",
    documentationUrls: [
      {
        label: "Automation Credits Usage & Rates",
        url: "https://docs.mulesoft.com/general/automation-credits-usage-and-rates",
      },
    ],
    pricingMode: "units-per-credit",
    usageTypes: [
      {
        id: "rpa-bot-minutes",
        label: "RPA Bot Minutes",
        basis: "per 2 minutes",
        rate: 2,
        inputBasis: "day",
        exampleQuantity: 400,
      },
      {
        id: "rpa-api-calls",
        label: "RPA API Calls",
        basis: "per 100 calls",
        rate: 100,
        inputBasis: "day",
        exampleQuantity: 200,
      },
      {
        id: "composer-tasks",
        label: "Composer Tasks",
        basis: "per 50 tasks",
        rate: 50,
        inputBasis: "day",
        exampleQuantity: 700,
      },
      {
        id: "idp-document-pages",
        label: "IDP Document Pages",
        basis: "per 5 pages",
        rate: 5,
        inputBasis: "day",
        exampleQuantity: 100,
      },
    ],
  },
  {
    version: "2.0",
    effectiveDate: "",
    sourceUrl:
      "https://docs.mulesoft.com/general/mulesoft-automation-credits-2-0",
    documentationUrls: [
      {
        label: "Automation Credits Usage & Rates",
        url: "https://docs.mulesoft.com/general/automation-credits-usage-and-rates",
      },
    ],
    pricingMode: "credits-per-unit",
    usageTypes: [
      {
        id: "rpa-bot-minutes",
        label: "RPA Bot Minutes",
        basis: "per minute",
        rate: 80,
        inputBasis: "day",
        exampleQuantity: 400,
      },
      {
        id: "rpa-api-calls",
        label: "RPA API Calls",
        basis: "per call",
        rate: 2,
        inputBasis: "day",
        exampleQuantity: 200,
      },
      {
        id: "composer-tasks",
        label: "Composer Tasks",
        basis: "per task",
        rate: 2,
        inputBasis: "day",
        exampleQuantity: 700,
      },
      {
        id: "flow-orchestration-runs",
        label: "Flow Orchestration Runs",
        basis: "per run",
        rate: 100,
        inputBasis: "day",
        exampleQuantity: 20,
        note: "Enterprise and higher; other editions follow General Flow Limits.",
      },
      {
        id: "idp-document-pages",
        label: "IDP Document Pages",
        basis: "per page",
        rate: 30,
        inputBasis: "day",
        exampleQuantity: 100,
      },
      {
        id: "integration-tasks",
        label: "Integration Tasks",
        basis: "per task",
        rate: 2,
        inputBasis: "day",
        exampleQuantity: 800,
      },
    ],
  },
  {
    version: "3.0",
    effectiveDate: "",
    sourceUrl:
      "https://docs.mulesoft.com/general/mulesoft-automation-credits-3-0",
    documentationUrls: [
      {
        label: "Automation Credits Usage & Rates",
        url: "https://docs.mulesoft.com/general/automation-credits-usage-and-rates",
      },
    ],
    pricingMode: "credits-per-unit",
    usageTypes: [
      {
        id: "flow-integration-tasks",
        label: "MuleSoft for Flow: Integration",
        basis: "per successful task",
        rate: 2,
        inputBasis: "day",
        exampleQuantity: 800,
      },
      {
        id: "idp-document-pages",
        label: "IDP Document Pages (Anypoint Platform)",
        basis: "per page",
        rate: 30,
        inputBasis: "day",
        exampleQuantity: 100,
      },
      {
        id: "flow-idp-pages",
        label: "MuleSoft for Flow: IDP",
        basis: "per page",
        rate: 30,
        inputBasis: "day",
        exampleQuantity: 30,
      },
      {
        id: "flow-orchestration-runs",
        label: "Flow Orchestration Runs",
        basis: "included for Enterprise and higher editions",
        rate: 0,
        inputBasis: "day",
        exampleQuantity: 20,
        note: "Included on Enterprise and higher; other editions follow General Flow Limits.",
      },
    ],
  },
];
