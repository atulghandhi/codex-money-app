# Pocketroom

A private, local-first personal finance app. Built with React, TypeScript, and Vite, with all financial records in **IndexedDB**. No backend, account, API keys, bank integration, analytics, or external font requests.

## Run

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Example finances are clearly labelled; choose **Make it yours** to replace them with a fresh personal space.

```sh
npm test
npm run build
npm run preview
```

## Deploy to Vercel

Import this directory as a Git repository into Vercel, select the **Vite** preset, and deploy. `vercel.json` includes the configuration:

- Install: `npm install`
- Build: `npm run build`
- Output: `dist`
- No environment variables or database services needed.

Alternatively, run `npx vercel` from the project directory and follow its prompts. This repository is ready for deployment; a public deployment has not been created.

Use a stable production hostname. Each browser **and origin** has its own independent IndexedDB database. A Vercel preview URL will not share data with production. Export a backup before changing hostnames or devices, then import it at the destination.

## What it does

- **Your money:** interactive isometric stacks proportional to reserved amounts; inspect each allocation and the exact calculation.
- **Look ahead:** scrub through the current payday cycle to see estimated cash, bills, and everyday-living reservations change. Column scaling stays constant within the view.
- **What-if corner:** experiment with a purchase, watch the free-spending stack shrink, see the daily allowance or shortfall, and optionally turn the purchase into an actual planned expense.
- **Activity:** add, edit, remove, search, and categorise transactions. Spending composition reflects the last 30 calendar days.
- **Plan ahead:** one-off and monthly bills, debt repayments, overdue indicators, and expected payday. Marking something paid records the expense and advances or removes its reservation.
- **Goals & debts:** savings targets, goal contributions, recorded transfers, outstanding debts, APRs, monthly payments, and approximate repayment duration.
- **Undo:** linked bill, savings, and debt records can be reversed from Activity. Dependent changes are checked before restoration.
- **Settings:** spending-account reconciliation, currency, payday, expected income, everyday living estimate, buffer, export/import, and fresh-start flow.
- Keyboard-accessible controls, native modal focus management, responsive layouts, and reduced-motion support.

## Calculation model

Money is stored in integer minor units (pence/cents). Disposable money is:

```
current spending-account balance
− scheduled bills and debt payments before the next payday
− everyday living estimate × remaining calendar days
− savings contributions, capped at remaining goal targets
− chosen safety buffer
```

Expected income is informational and is **not** spendable until an income transaction is recorded. Existing savings and debt balances are separate from available spending cash. The planning horizon excludes payday itself. Overdue payments remain reserved. Monthly dates clamp to the next month's last day where necessary.

Timeline forecasts simulate scheduled outflows and estimated daily essentials; they do not write transactions. The forecast keeps discretionary spending untouched. A purchase experiment deducts its cost from the forecast only until it is saved as a plan.

Savings contributions are reservations for the current cycle, not automatic standing orders. Recording a savings transfer reduces both available cash and the goal's outstanding contribution. Set the next cycle's contribution when you update your payday plan.

Debt payoff estimates assume monthly compounding at a fixed APR, fixed payments, and no new borrowing or fees. Recorded payments reduce the tracked principal by their full amount; reconcile the balance from statements to include actual interest and fees. No money moves at a bank.

## Local data and reliability

Database: `pocketroom`, version 1, object store `state`, key `finance`. Mutations read the latest state and write the entire update within one IndexedDB read/write transaction, so cash and related records commit together. Other tabs refresh through `BroadcastChannel`.

JSON backups are schema-validated before a replacement confirmation. Clearing site data, deleting a browser profile, private browsing, or browser eviction can remove local data. Export backups regularly; exported files contain your financial information and are not encrypted. The app has no recovery server. All normal app assets, including fonts, are served from the same origin. An internet connection is still needed to load the app; offline asset caching is not implemented.

## Source

- `src/model.ts`: types, date helpers, forecasting, payoff estimate, backup validation.
- `src/db.ts`: IndexedDB transactions and persistence.
- `src/Landscape.tsx`: data-driven isometric visualisation and interpolation.
- `src/App.tsx`: product views and record workflows.
- `src/style.css`: design system and responsive styling.
- `tests/finance.test.ts`: financial calculation edge cases.
- `tests/storage.test.ts`: persistence, atomicity, and concurrent writes.

A browser smoke-test script is available with `npm run test:browser` after `npx playwright install chromium`. Start the development server first. It uses an isolated browser context and saves desktop/mobile captures to `test-results/`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to use an existing Chromium installation.
