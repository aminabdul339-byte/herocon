# Herocon — customer payment, BuckyDrop funding and order profit policy

Status (23 November 2026): **code guards implemented for new merchant-approved quotes; live purchasing remains OFF**. This is not a claim that the BuckyDrop merchant wallet has funds or that Stripe payout was deposited. The customer-adjusted shipping payment and authenticated manual release of supplier orders after a wallet top-up **are not built**.

## Money flow and ownership

1. UK customer checks out in **GBP** through Herocon's own Stripe merchant account. The implementation uses direct Checkout Sessions and has **no** Connect `transfer_data` or BuckyDrop destination account. Stripe charges applicable processing fees. Do not assume the available funds equal the gross customer payment.
2. An authenticated Stripe-signed **live webhook** and independent Stripe session retrieval confirm paid amount, charge currency, exact quote and customer. Its immutable claim prevents repeated paid events from creating duplicate orders.
3. By default, webhook processing records a **paid order awaiting merchant review and BuckyDrop wallet funding**; it does not submit a BuckyDrop shop order. `HEROCON_ALLOW_PREFUNDED_AUTO_SUPPLIER_RELEASE` defaults OFF; do not turn it ON unless a separately funded wallet can absorb orders promptly and funds and release permissions are verified.
4. Stripe's pending balance cannot generally be spent or paid out immediately. When the funds are available, Stripe pays out to the merchant's nominated bank account, on its payout schedule. Herocon must confirm the **actual bank deposit**, the **actual Stripe fee** and settlement net from balance transactions. The Stripe connector currently available to ChatGPT only exposes a TEST account, not a verified live payout.
5. The merchant then funds the **separate** BuckyDrop account using an officially supported payment method and records the wallet credit, FX rate and any top-up/bank fees. Herocon should retain a cash buffer for refunds, chargebacks and extra freight.
6. A future **per-order authenticated release** must verify the exact paid order, supplier SKU/stock/price, wallet balance, shipping and recipient, then submit the shop order **once**. It must not rely on global flags alone for per-order funding, and a BuckyDrop create response must not be treated as confirmation that the supplier or shipping has actually been paid.
7. Verify supplier purchase, warehouse receipt, final parcel freight, tax and dispatch. A separate customer-approved shipping adjustment system is still required for orders sold on the proposed estimated-freight terms. Existing all-inclusive paid quotes may **not** be re-priced or charged again for freight.

## Merchant pricing cost floor for future approved checkout quotes

All sums are stored in **GBP pence** on the server. The supplier SKU's verified CNY price and quantity are multiplied by a merchant-approved *effective* GBP-per-CNY wallet purchasing rate; the quote form requires explicit affirmation rather than guessing this value from product snapshots.

Expected costs included:
- Live BuckyDrop supplier SKU purchase at approved FX.
- Estimated international freight allowance for the whole basket.
- BuckyDrop sourcing, mainland supplier shipping, warehouse receipt, handling, packaging, QC and other provider charges from a separately approved **GBP allowance**.
- BuckyDrop wallet top-up fees, bank charges and any conversion fees **not already included in the effective FX rate**.
- Taxes and duties expected to be borne by Herocon under the relevant contract.
- An explicit parcel reweighing / FX contingency allowance.

The internal Stripe planning allowance is **6% of the entire gross customer payment plus 30p** per initial transaction. This is a **conservative example policy**, not Stripe's tariff, and must be calibrated using actual balance transactions and the card/payment mix. Stripe publicly advertises **1.5% + 20p** for standard UK cards on its UK pricing page; international cards, refunds, disputes and other services can have different costs. Subsequent shipping top-up payments also incur processing fees.

Merchant profitability gate requires projected profit after **all** listed costs and the Stripe planning allowance to be at least the **greater of £2.00 or 12% of customer revenue**. `lib/order-economics.ts` calculates the minimum acceptable customer GBP total and new approved quote creation fails if the operator-proposed selling prices do not meet it. Merchant quote prices must never be derived directly from raw `¥` catalogue numbers or a provisional shipping API quote currency.

These are *estimated contributions*, not guaranteed accounting profit. They do not automatically include labour, overhead, business income tax, VAT complexities, cancelled purchases, chargebacks, expensive returns, late supplier price changes or cash flow financing.

### UK consumer disclosure

A mandatory £0.99 Herocon service fee must be included in the **total price shown upfront** when a product price is offered to consumers. Mandatory delivery and tax charges likewise require clear early price display. A final GBP amount must be agreed before Stripe payment, and future post-warehouse freight increases cannot be silently charged. The accepted terms for discretionary adjustment, refund and cancellation need consumer-law review.

## Before enabling live checkout / supplier writes

- Confirm the verified legal entity and nominated Herocon payout bank on Stripe LIVE, actual fee breakdown and payout settlement timing.
- Obtain BuckyDrop written confirmation on fees, currency, procurement permissions, wallet funding and parcel hold/release (especially shipping top-ups).
- Build the secure per-order wallet-credit verification and supplier-release API/workflow with idempotent claims, operator audit and automated reconciliation.
- Complete the shipping-adjustment checkout/refund system and consumer-facing pre-contract totals (the new profitability guard does **not** implement these).
- Run Stripe TEST (no real charge), then one explicitly approved low-value owner-only real payment and supplier order. Keep live flags OFF otherwise.

Official references:
- https://stripe.com/gb/pricing
- https://docs.stripe.com/payments/balances
- https://www.buckydrop.com/en/services/pricing/
- https://www.gov.uk/government/publications/price-transparency-cma209/providing-clear-and-accurate-information-about-prices-summary
