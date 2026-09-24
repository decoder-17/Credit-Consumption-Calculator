# Credit Consumption Calculator

A planning calculator for MuleSoft Mule Credits and Automation Credits. Enter the billable units from your usage reports and it shows how many credits a month consumes, how that compares to your contract, and how much runway you have left.

**Live site:** https://decoder-17.github.io/Credit-Consumption-Calculator/

> [!IMPORTANT]
> **Disclaimer.** This is an independent planning tool. It isn't affiliated with, endorsed by, or sponsored by MuleSoft or Salesforce. MuleSoft and Salesforce are trademarks of their respective owners.
>
> Results are estimates for planning only. They aren't a quote, an invoice or a billing statement, and nobody should rely on them as one. Final charges can differ: contract terms, overage rates, taxes, fees and other charges may not be included. Rates vary by plan and can change, so confirm the current rate card and your Order Form with your account team. If this tool and the Salesforce Digital Wallet disagree, the Wallet wins. It's the billing source of truth.
>
> The software is provided "as is" under the [MIT License](LICENSE), without warranty of any kind. The author accepts no liability for decisions made using its output.

## What it does

The sidebar has two subscriptions.

**MuleSoft Mule Credits** (rate card May 2026, effective 2026-05-01)

- Graduated tier pricing. Each usage type's multiplier steps down as that type's monthly consumption crosses 300K, 900K and 5M credits. Thresholds are tracked per usage type, reset on the 1st of each calendar month, and apply across all environments.
- Usage types: MuleSoft Flows, MuleSoft Messages, Managed Assets, Gateway Requests, IDP Pages, Flow Integration Tasks, Private Spaces, Network Connections and Load Balancers.
- Per Day and Per Month inputs. Daily meters are multiplied by the days in the calculation month. Monthly meters are taken as entered.

**MuleSoft Automation Credits**

- One view with a 1.0, 2.0 or 3.0 credit system selector.
- 1.0 and 2.0 use the complete tables from MuleSoft's documentation.
- For 3.0, MuleSoft hasn't fully published the usage table or its effective date. The calculator applies the rates that are documented and says so in the terms.

**Across both**

- KPI cards: Credits Remaining (with a gauge), Calculated This Month, Consumed To Date and Contract Remaining.
- Contract Details for the calculation month, contract credits, consumed credits and Order End Date.
- Load Example Usage, Clear Month and Save Month.
- A Saved Ledger of months with a cumulative total, exportable with Download CSV.
- Rate Card And Terms with links to the source documentation, the effective date when one is published, and the disclaimers above.

Saved months live in your browser's local storage only. Nothing is sent to a server.

## Getting started

Requires Node.js 20 or later.

```sh
npm install
npm run dev     # local dev server
npm run ci      # typecheck, lint and tests
npm run build   # production build into dist/
```

## Architecture

The project uses strict one-directional layers:

- `src/domain/` holds framework-free types, the pricing engine and reusable strategies. No DOM, React or network access.
- `src/rate-cards/` holds versioned data only. Rate literals live here with `version`, `effectiveDate`, `sourceUrl` and labeled documentation links.
- `src/providers/` adapts one subscription to `PricingProvider`. Providers compose domain strategies and own their disclaimers.
- `src/app/` composes the provider registry.
- `src/ui/` renders provider metadata and doesn't branch on provider IDs.

The provider contract is the extension point. A provider supplies identity, unit, rate-card provenance, usage metadata, a price function and disclaimers. The UI only consumes that contract. See [MIGRATION.md](MIGRATION.md) for how the original single-file calculator maps onto these layers.

### Adding a subscription

1. Add a versioned, data-only file in `src/rate-cards/` with the verified source URL and effective date. Leave `effectiveDate` empty if none is published; the UI hides it.
2. Add a provider adapter in `src/providers/` that implements `PricingProvider` and composes an existing domain strategy.
3. Add provider unit tests for zero, ordinary, boundary and over-limit quantities.
4. Register the provider in `src/providers/index.ts`.
5. Add provider-specific disclaimers and confirm the shared UI needs no provider branch.
6. Run `npm run ci` and review the rate-card provenance before release.

## Deployment

GitHub Actions deploys `main` to GitHub Pages through `.github/workflows/deploy.yml`. Every branch runs CI.

Branch flow: work on a feature branch, merge into `develop`, then merge `develop` into `main` to release.

One-time repository setup:

- **Settings > Pages > Build and deployment > Source:** GitHub Actions.
- **Settings > Environments > github-pages > Deployment branches:** allow `main`. Otherwise the deploy job is rejected by environment protection rules.

The Vite `base` is `/Credit-Consumption-Calculator/` when building in Actions, so renaming the repository requires updating `vite.config.ts`.

## Author

Developed by Tanupam · [GitHub](https://github.com/decoder-17) · [LinkedIn](https://www.linkedin.com/in/int-tanupam/)

## License

[MIT](LICENSE) © 2026 Tanupam Saha
