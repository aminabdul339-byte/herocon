# Herocon: all-inclusive BuckyDrop payment pilot (23 November 2026)

**Status: code prepared behind independent OFF-by-default merchant gates. No customer charge, supplier purchase, or dispatch was made.** This is a proposal for a manually approved first pilot, not unrestricted auto-checkout. The current two-stage checkout remains untouched when `paymentStage=products`.

## New preferred commercial policy — 23 November 2026 (not yet a live billing workflow)

The merchant now prefers **estimated international freight at checkout + £0.99 mandatory Herocon service fee per order + a later customer-approved shipping difference**, rather than Herocon always absorbing excess shipping. The updated interactive route `/demo/buckydrop` demonstrates that model. Its prices and adjustments are simulated.

**CRITICAL: This is a proposed replacement for new adjustable-shipping contracts, not a change to existing all-inclusive quotes.** The already-written `all_in` quote continues to promise NO second freight payment and Herocon must honour that. Never silently convert existing all-inclusive paid orders to a variable freight contract. Before launching the new model:

1. Create a distinct `adjustable_shipping` quote type with clear pre-contract estimate, fixed 99p fee, total payable now, precise adjustment calculation and (recommended) agreed surcharge cap; the buyer must see that binding price and disclosures on product pages, basket and checkout, not only after selecting Pay.
2. Obtain appropriately reviewed, affirmative upfront agreement for how later shipping is calculated, **and fresh explicit consent to the exact revised amount** before charging; never auto-debit the customer's card. Check with a UK consumer-law adviser whether this proposed variable-price structure and any adjustment caps are fair and enforceable for the products offered.
3. After BuckyDrop warehouse receipt, retrieve actual confirmed packed freight and permitted surcharges. Compute `topUp = max(0, verified freight - amount already charged for shipping)` using verified matching currency/FX and original order terms, and `refund = max(0, original shipping charge - verified freight)` where the contract calls for returning overpayments.
4. If a top-up is needed, **do not dispatch yet**. Issue a customer-facing statement, deadline, single-use Stripe payment session and signed webhook. Dispatch is permitted only after actual receipt of funds, confirmed provider shipping-release controls and idempotent reconciliation.
5. Provide a merchant-assisted path for customers who decline to pay, become unreachable, or encounter a price higher than the agreed cap: explain options and honour statutory refunds/cancellations. Holding already-purchased goods at a warehouse can still create losses; a 99p fee and top-up request do not mathematically guarantee positive margins.
6. Consider validating a freight quote **before** supplier purchase where possible, or setting a slightly higher upfront shipping allowance / capped customer adjustment to keep costs controlled and avoid surprise bills.
7. Show the **mandatory 99p Herocon fee** in the advertised total wherever price transparency rules require, including product and basket pages, not only on final Stripe checkout. New pilot approved quotes now include the fee in their frozen GBP amount, Stripe line items and visible customer quote; legacy approved quotes without a fee remain unchanged.

**Current implementation status:** 99p fee in newly approved quotes and a full simulated shipping-adjustment demo. The actual variable-postage charge, invoice, payment approval, warehouse dispatch hold, refund system and pre-contract disclosure across all storefront pages remain **unimplemented and disabled**. Do not enable a public live checkout on the basis of the demo.

Official legal/pricing information:
- https://www.gov.uk/government/publications/price-transparency-cma209/providing-clear-and-accurate-information-about-prices-summary
- https://www.gov.uk/government/publications/online-retailers-including-mandatory-delivery-fees-in-the-total-price/open-letter-to-online-retailers-including-mandatory-delivery-fees-in-the-total-price
- https://www.legislation.gov.uk/uksi/2013/3134/regulation/40/made
- https://www.buckydrop.com/en/services/pricing/

## Merchant flow

1. Confirm written permission and pricing with BuckyDrop for the Solution API application, especially `shop-order/create`, automatic procurement and warehouse shipping, prepaid wallet balance, freight settlement, account spending limits, permitted marketplaces, and whether the automatically created parcels are dispatched without a second merchant payment/approval. No publicly documented API call is assumed to pay a BuckyDrop supplier invoice.
2. Confirm BuckyDrop's shipping quote currency for the relevant fields; the repo's provisional CNY quote conversion is **not** safe for binding GBP checkout.
3. Set `HEROCON_ONE_PAYMENT_PILOT_QUOTES_ENABLED=true` *only* when ready to issue manually approved quotes. This flag does not charge customers.
4. Use `/admin/checkout` with the existing independent `HEROCON_CHECKOUT_ADMIN_KEY`. Supply verified seller URL, exact SKU, quantities, GBP retail price, shipping allowance, tax amount, buyer email, and explicitly approve the full delivered cost. The quote is stored privately for 23 hours; only one vetted SKU is exposed in this first admin form, though the backend supports up to five.
5. Review the private quote and the account. The buyer should see a single GBP total and no second shipping payment. Until every live gate passes the pay button remains disabled.
6. In a private controlled test, verify Stripe test-mode payment/webhook/duplicate detection without BuckyDrop live supplier writes. Then perform one merchant-authorised low-value live supplier order with separately funded provider account and verify procuring, warehouse, international dispatch and tracking, before considering public use.

## Extra OFF-by-default gates (in addition to the existing live-payment, internal supplier submission, legal, credentials, storage, and email gates)

- `HEROCON_ONE_PAYMENT_PILOT_QUOTES_ENABLED=true`: operator can create an all-inclusive quote.
- `HEROCON_ONE_PAYMENT_LIVE_APPROVED=true`: independent one-payment checkout sign-off after simulated and authorised full-cycle tests.
- `HEROCON_BUCKYDROP_AUTO_FULFILMENT_CONFIRMED=true`: written confirmation that account is prepaid/configured to purchase, consolidate, pay international freight, release and deliver without individual merchant approval.
- `HEROCON_ALL_IN_DELIVERED_PRICING_APPROVED=true`: operator verified all delivered costs, quote currency, the policy to absorb freight price increases, duties/taxes, and refunds.

For `all_in` orders, the legacy `HEROCON_TWO_STAGE_SHIPPING_READY` and manual supplier payment flag are *not* sufficient. Legacy `products` orders still need those original gates. `HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED` and `HEROCON_ORDER_SUBMISSION_ENABLED` remain OFF until the full operational pilot passes.

## Security and reconciliation

- A stored quote contains only GBP amounts authorised by the merchant. Browser cart prices never become supplier costs.
- Stripe live sessions must match the immutable quote, stage, fulfilment mode, verified email, currency and paid amount. Do not trust a successful browser redirect.
- Supplier submission uses the existing authenticated server-only path, live stock verification, capped supplier CNY cost and irreversible single-send claim. A timeout has an uncertain result: **never automatically resubmit** without reconciling its Herocon partner order number.
- The amount charged to the buyer is an agreed **all-inclusive retail quote**. Any freight overrun is a merchant cost; do not charge the buyer again.
- BuckyDrop can keep the last-mile courier and origin apparent on a physical label and tracking record. Offer neutral packaging only if agreed with BuckyDrop; do not misstate country of origin or customs obligations.
- Provider `create-shop-order` acceptance is **not** evidence BuckyDrop actually purchased, funded, packed or shipped the goods.
- Full automated buyer self-checkout from arbitrary products remains **unimplemented** until shipping, stock, VAT/duty, risky-item eligibility, margins and wallet balance can all be calculated and verified reliably in real time.
- Current private Blob records and webhook claims need migration to a transactional ledger/queue before substantial volume.

## Ask BuckyDrop before enabling

1. Does our Solution API app have live `create-shop-order` permission, and does an accepted shop order trigger automatic supplier procurement?
2. Can our prepaid balance automatically cover supplier costs, warehouse charges and international postage, and will parcels leave China without any manual portal confirmation?
3. Where can we set/verify default logistics routes, max shipping spend per parcel, QC and customs settings, balance alerts, exception handling, warehouse holding and refund procedure?
4. Confirm the exact currency of `channel-carriage-list.records[].totalPrice` and `records[].price`, all applicable API/fulfilment charges and any duties/DDP choices.
5. Is white-label packaging, no BuckyDrop promotional inserts/invoices, and Herocon sender name supported for Solution API orders?
6. Do notification subscriptions provide signed callbacks and retry policies for order failures, procurement, warehouse receipts, weight, parcels and tracking? Supply callback authentication specification.

References:
- https://solution-api.buckydrop.com/en
- https://solution-api.buckydrop.com/en/api
- https://www.buckydrop.com/en/dropshipping/
- `LIVE-CHECKOUT-LAUNCH-RUNBOOK.md`
