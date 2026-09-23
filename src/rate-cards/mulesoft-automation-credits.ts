import type { RateCardMeta } from "../domain";

export type AutomationRateCard = RateCardMeta & {
  version: "1.0" | "2.0" | "3.0";
  pricingMode: "units-per-credit" | "credits-per-unit";
  usageTypes: readonly { id: string; label: string; basis: string; rate: number; inputBasis: "month" }[];
};

export const automationRateCards: readonly AutomationRateCard[] = [
  {
    version: "1.0",
    effectiveDate: "[NEEDS DATA: effective date not stated in documentation]",
    sourceUrl: "https://docs.mulesoft.com/general/mulesoft-automation-credits-1-0",
    documentationUrls: ["https://docs.mulesoft.com/general/automation-credits-usage-and-rates"],
    pricingMode: "units-per-credit",
    usageTypes: [
      { id: "rpa-bot-minutes", label: "RPA Bot Minutes", basis: "per 2 minutes", rate: 2, inputBasis: "month" },
      { id: "rpa-api-calls", label: "RPA API Calls", basis: "per 100 calls", rate: 100, inputBasis: "month" },
      { id: "composer-tasks", label: "Composer Tasks", basis: "per 50 tasks", rate: 50, inputBasis: "month" },
      { id: "idp-document-pages", label: "IDP Document Pages", basis: "per 5 pages", rate: 5, inputBasis: "month" },
    ],
  },
  {
    version: "2.0",
    effectiveDate: "[NEEDS DATA: effective date not stated in documentation]",
    sourceUrl: "https://docs.mulesoft.com/general/mulesoft-automation-credits-2-0",
    documentationUrls: ["https://docs.mulesoft.com/general/automation-credits-usage-and-rates"],
    pricingMode: "credits-per-unit",
    usageTypes: [
      { id: "rpa-bot-minutes", label: "RPA Bot Minutes", basis: "per minute", rate: 80, inputBasis: "month" },
      { id: "rpa-api-calls", label: "RPA API Calls", basis: "per call", rate: 2, inputBasis: "month" },
      { id: "composer-tasks", label: "Composer Tasks", basis: "per task", rate: 2, inputBasis: "month" },
      { id: "flow-orchestration-runs", label: "Flow Orchestration Runs", basis: "per run", rate: 100, inputBasis: "month" },
      { id: "idp-document-pages", label: "IDP Document Pages", basis: "per page", rate: 30, inputBasis: "month" },
      { id: "integration-tasks", label: "Integration Tasks", basis: "per task", rate: 2, inputBasis: "month" },
    ],
  },
  {
    version: "3.0",
    effectiveDate: "[NEEDS DATA: effective date not stated in documentation]",
    sourceUrl: "https://docs.mulesoft.com/general/mulesoft-automation-credits-3-0",
    documentationUrls: ["https://docs.mulesoft.com/general/automation-credits-usage-and-rates"],
    pricingMode: "credits-per-unit",
    usageTypes: [
      { id: "flow-integration-tasks", label: "MuleSoft for Flow: Integration", basis: "per successful task", rate: 2, inputBasis: "month" },
      { id: "idp-document-pages", label: "IDP Document Pages (Anypoint Platform)", basis: "per page", rate: 30, inputBasis: "month" },
      { id: "flow-orchestration-runs", label: "Flow Orchestration Runs", basis: "included for Enterprise and higher editions", rate: 0, inputBasis: "month" },
    ],
  },
];
