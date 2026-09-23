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

MuleSoft Mule Credits is ported from the original HTML calculator. Its May 2026 source and values are preserved in `src/rate-cards/mulesoft-mule-credits.ts`, and the legacy example total is locked by a test.

The flat per-seat provider proves the second pricing shape, but it is intentionally not priceable in production yet. The request did not include a vendor, rate, effective date, or source URL. It displays `[NEEDS DATA: ...]` and throws rather than inventing a price.

## How to add a subscription

1. Add a versioned data-only file in `src/rate-cards/` with the verified source URL and effective date.
2. Add a provider adapter in `src/providers/` implementing `PricingProvider` and composing an existing domain strategy.
3. Add provider unit tests for zero, ordinary, boundary, and over-limit quantities.
4. Add the provider to `src/providers/index.ts`.
5. Add provider-specific disclaimers and verify that the shared UI needs no provider branch.
6. Run `npm run ci` and review the rate-card provenance before release.

## Migration notes

The old `credit-consumption-calculator.html` combined rate data, graduated-tier logic, DOM rendering, local storage, CSV export, copy, and styling in one script. The migration moves rate values to `src/rate-cards/mulesoft-mule-credits.ts`, the `creditsFor` calculation to `src/domain/strategies.ts`, provider composition to `src/providers/mulesoft.ts`, and rendering to `src/ui/`. The new UI keeps the light Anypoint-inspired tokens, visible focus, responsive layout, and reduced-motion rule. Ledger persistence and CSV export remain follow-up application concerns for the production migration; the original file is retained as a reference artifact.

## Commands

```sh
npm install
npm run dev
npm run ci
```
