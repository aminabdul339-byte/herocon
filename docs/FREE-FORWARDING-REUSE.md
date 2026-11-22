# Herocon free forwarding features

This implementation draws on the workflow design and documentation of
[HIOBuy Forwarding](https://github.com/hiobuy/forwarding), an Apache-2.0
open-source project (Copyright 2026 HioBuy, see upstream LICENSE and NOTICE).
It does **not** install HIOBuy, use HIOBuy's trademarks as product branding,
call HIOBuy APIs, or create a HIOBuy warehouse account. This work adapts
Herocon's own existing components and data storage.

## Free features added

- `/warehouse`: customer warehouse centre, provider-neutral lifecycle explanation,
  existing private Herocon order tracking link, account-specific quote-request history,
  consolidation planner access and existing shipping-estimator access
- `/warehouse/consolidate`: browser-only manual parcel weight planner with
  locally saved account-scoped drafts and explicit non-operational wording
- `/cart`: free sourcing quote-request form for up to five selected options;
  no purchase, payment, reservation or external product lookup
- `GET /api/account/quotes`: signed-in customer receives only their own
  request summaries, status and merchant note
- `POST /api/account/quotes`: authenticated, same-origin submission into
  existing private Vercel Blob storage using `createCustomerRequest`;
  built-in duplicate detection and three-per-24-hour limit
- `/admin/warehouse`: private merchant queue using the existing checkout
  admin key, with notes and review status
- `GET/POST /api/admin/warehouse`: checkout-key-protected read/review actions
  using existing private quote store helpers
- Account and site navigation links to the new warehouse area

## What is intentionally NOT provided

The upstream software's physical receiving, inspections, photo capture,
consolidation execution, procurement, quote fulfilment, customer wallets,
fund transfers, payment settlement, parcel dispatch and HIOBuy tracking are
not usable without live warehouse services, operational authorisation and
additional financial/legal review.

The new pages **must never** invent parcel statuses, photographs, seller
availability, packed weight, actual shipping prices or customer charges.
They do not mark a quote request as a supplier order. The existing order
tracker remains the sole interface for authenticated order-reference
lookups backed by BuckyDrop partner reports.

The existing `/landed-cost` estimator makes a BuckyDrop quote request
**only after a visitor clicks Get shipping quotes**. These provider
requests can consume paid API quota; no new background or automatic
supplier lookups were introduced.

## Configuration

The new features use existing Herocon configuration:
- Supabase authentication settings (`HEROCON_SUPABASE_URL` and
  `HEROCON_SUPABASE_PUBLISHABLE_KEY`)
- Private Vercel Blob storage (`BLOB_READ_WRITE_TOKEN`) for quote records
- Existing `HEROCON_CHECKOUT_ADMIN_KEY` for merchant review
- Existing optional BuckyDrop shipping estimator and order tracker

No new API key, SaaS plan, database service or dependency is required.
No live checkout feature flags are enabled.

## Before merging

1. Run `npm ci`, `npm run typecheck`, `npm run build`, and the
   project's mocked BuckyDrop safety tests.
2. Open `/warehouse` as guest and authenticated customer. Verify
   quote history cannot be read across accounts.
3. Select one to five cart products with supported marketplace URLs,
   request a quote without payment, then confirm it appears in
   `/warehouse` and `/admin/warehouse`.
4. Test invalid postcodes, unsupported links, duplicates, and the
   three-requests-per-day guard.
5. Test the consolidation planner on mobile, refresh it while signed in,
   and confirm no warehouse API calls are made.
6. Test merchant key rejection, same-origin update checks and review
   notes appearing only for the corresponding customer.
7. Keep purchase, shipping payment and order-submission gates disabled.
