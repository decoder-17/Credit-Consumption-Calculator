# Migration notes

The original single-file calculator was ported into the layered application and removed once the behavior-lock tests were added.

| Original responsibility         | New location                                    |
| ------------------------------- | ----------------------------------------------- |
| `CARD` and `THRESH`             | `src/rate-cards/mulesoft-mule-credits.ts`       |
| `creditsFor` and aggregation    | `src/domain/strategies.ts` and provider adapter |
| Usage labels and bases          | Provider `usageTypes()` metadata                |
| DOM input and table rendering   | `src/ui/App.tsx`                                |
| Theme and accessibility rules   | `src/ui/styles.css`                             |
| Subscription selection          | `src/app/registry.ts` and provider registry     |
| Rate provenance and disclaimers | Each provider and rate-card file                |

The original ledger, browser persistence, and CSV export are intentionally not silently reimplemented in this first architecture pass. They should be added under `src/app/` as application services, backed by provider IDs so saved data cannot be mixed across subscriptions.
