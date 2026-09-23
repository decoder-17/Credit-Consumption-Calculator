# Consumption calculator

A TypeScript, React, and Vite calculator for pricing multiple subscriptions and licenses from versioned rate-card data.

## Architecture decision record

The project uses strict one-directional layers:

- `src/domain/` contains framework-free types, the pricing engine, and reusable strategies. It has no DOM, React, or network access.
- `src/providers/` adapts one subscription to `PricingProvider`. Providers compose domain strategies and own their disclaimers.
- `src/rate-cards/` contains versioned data only. Production rate literals live here, with `version`, `effectiveDate`, and `sourceUrl`.
- `src/ui/` renders provider metadata. It does not branch on provider IDs.
- `src/app/` composes the registry and application concerns.

The provider contract is the extension point. A provider supplies identity, unit, rate-card provenance, usage metadata, a price function, and disclaimers. The UI only consumes that contract.

## Current data status

The UI currently has two subscription tabs:

- `MuleSoft Mule Credits`: graduated tier pricing with calculation month, day/month meter handling, reconciliation inputs, utilization summary, saved ledger, and CSV export.
- `MuleSoft Automation Credits`: one tab with a `1.0`, `2.0`, or `3.0` credit-system selector. Versions 1.0 and 2.0 use the complete numeric tables published in the supplied MuleSoft documentation. Version 3.0 applies the documented rates that are available in the source extract and surfaces `[NEEDS DATA: ...]` for plan-specific rows that are not disclosed there.

The unsupported flat per-seat placeholder was removed from the registry. Automation rate-card data lives in `src/rate-cards/mulesoft-automation-credits.ts`; adapter composition lives in `src/providers/mulesoft-automation.ts`. MuleSoft documentation says rates and usage types can vary by subscription plan, so the Order Form remains the authority for a production quote.

## How to add a subscription

1. Add a versioned data-only file in `src/rate-cards/` with the verified source URL and effective date.
2. Add a provider adapter in `src/providers/` implementing `PricingProvider` and composing an existing domain strategy.
3. Add provider unit tests for zero, ordinary, boundary, and over-limit quantities.
4. Add the provider to `src/providers/index.ts`.
5. Add provider-specific disclaimers and verify that the shared UI needs no provider branch.
6. Run `npm run ci` and review the rate-card provenance before release.

## Migration notes

The original single-file calculator combined rate data, graduated-tier logic, DOM rendering, local storage, CSV export, copy, and styling in one script. The migration moves rate values to versioned files under `src/rate-cards/`, calculation strategies to `src/domain/strategies.ts`, provider composition to `src/providers/`, and rendering to `src/ui/`. The UI keeps the light Anypoint-inspired tokens, visible focus, responsive layout, and reduced-motion rule. Saved ledger state is isolated by provider/model in browser storage.

## Commands

```sh
npm install
npm run dev
npm run ci
```

## Public deployment

GitHub Actions deploys `main` as the production site through `.github/workflows/deploy.yml`. Feature branches run CI and are promoted through `develop` into `main` after review. Enable **Settings > Pages > Build and deployment > Source: GitHub Actions** once in the repository. With the current repository name, the default public URL is `https://tanupam-CCI.github.io/Credit-Consumption-Calculator/`.
