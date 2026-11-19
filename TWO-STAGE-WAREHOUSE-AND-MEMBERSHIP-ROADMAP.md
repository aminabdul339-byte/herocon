# Herocon — Two-stage warehouse checkout, QC and future membership
Updated 19 November 2026. This document supersedes the older single all-in payment design.

## Two customer payments, different stages

1. Buyer chooses supplier-linked SKUs, quantities and destination. Herocon discloses a realistic shipping estimate or legally adequate calculation method, the later payment timing and cancellation/refund terms **before** product payment.
2. Buyer pays the approved product amount in GBP through Stripe; a verified signed webhook authorizes a single supplier order submission.
3. Merchant confirms and pays BuckyDrop to procure the products. The BuckyDrop account must be configured to hold items at the warehouse rather than automatically dispatch; **this has not been verified**.
4. BuckyDrop reports sourcing, inbound warehouse arrival and QC. Only actual reported updates change Herocon order statuses. QC photos display only when supplied through an authorized API (not verified yet) or a secure merchant-operated import with permission and order-level controls.
5. Merchant obtains verified final packed weight, dimensions, carrier options and currency; agrees an exact frozen GBP international shipping invoice. Customer explicitly pays a second Stripe Checkout Session, with its own payment id, quote id and verified webhook. **The entire second-payment system is still to be built.**
6. Only after full shipping payment and merchant funding, release the shipment to BuckyDrop for international dispatch. The exact API or portal handoff for holding/releasing a parcel is not confirmed. Send tracking and delivery notifications.

A quote after warehouse arrival must never cause an automatic customer charge without explicit approval. If shipping is higher than the initial estimate or cannot be paid, the merchant must have clear cancellation/refund/warehouse-storage remedies. Never present an estimated shipping price as guaranteed.

## Current implementation

- Order tracking now shows supplier purchase, warehouse arrival, QC, shipping invoice and dispatch stages, with unavailable QC photos and unpayable freight clearly stated.
- Private merchant quote approval stores a first-stage product-only GBP amount and a separately disclosed, indicative later shipping estimate.
- The buyer quote says that freight is not included, and requires a shipping-stage acknowledgement before a payment could start.
- The product payment webhook and buyer/merchant email instructions specify that shipping is not yet paid.
- Live checkout now has a separate fail-closed requirement named HEROCON_TWO_STAGE_SHIPPING_READY, which has NOT been configured. Do not enable it until stage-two invoicing and supplier dispatch-release have passed end-to-end testing.
- Current status: No real Stripe checkout charges, BuckyDrop supplier purchases or separate shipping payments are enabled.

## Missing technical work

- BuckyDrop API support for warehouse receipt, inspected quantities, QC image access, packed sizes/weights, final shipping amount/currency, holding items, and release/dispatch instructions.
- Actual order-scoped photo gallery with securely stored photos and authorisation checks; do not invent images.
- An independently approved shipping invoice with expiry, immutable amount, quote source, package IDs, supplier shipping channel and GBP conversion.
- Stripe second-stage shipping Checkout Session, confirmed shipping-payment webhook, idempotency, supplier shipment-release logic, manual payment, refunds and reconciliation.
- Notifications when QC photos or an approved shipping quote appear; warehouse storage duration, failure-to-pay workflow, country-specific taxes and claims handling.
- A proper account and order database before any membership launch.

## Future £9.99/month Herocon membership — NOT ACTIVE

- When guests click Add to cart, sign them in/register and return to the same selected product; browsing remains open.
- Charge £9.99 GBP monthly through Stripe Billing/Subscriptions, with secure authentication and verified subscription/renewal/cancellation webhooks.
- Require an active membership to make **new product purchases** after the future launch of the paywall.
- Never block existing customers from accessing their previously paid orders, QC photos, shipping invoices for already-owned items, tracking, refunds or support just because their membership lapses.
- An authenticated account dashboard should show My orders, Warehouse, QC Gallery, Shipping invoices, Parcels, Saved products, Membership, billing portal and help.
- Disclose recurring billing, renewal, cancellation and refunds separately from product and international shipping purchases. Membership billing, authentication and entitlement checks are not yet implemented.

## Questions for BuckyDrop

1. Can our custom Solution API create a purchase-only order that stays in the China warehouse until international shipping is paid?
2. What endpoint gives actual warehouse inbound and QC status, plus photo URLs or private photo assets, and may customers view them?
3. Can we retrieve final packed weight, dimensions, eligible shipping options and binding shipping fees including their currency and customs treatment?
4. Which API call or merchant-portal step releases a package after the buyer's separate shipping payment, and how do we pay BuckyDrop for freight?
5. How long can goods be stored? What happens with unclaimed packages, refused QC, refund requests, international restrictions or shipping quotes higher than estimated?

## UK pricing and consumer protection

UK CMA guidance requires mandatory delivery charges to be included in the presented total wherever reasonably calculable, and a clear calculation method where genuinely not predictable. A later shipping charge may be required but it cannot be a hidden fee. Do not activate product-only customer payment without reviewing the full model, prominently disclosing expected freight and delivery terms, and approving a legally workable refund/cancellation process.

- https://www.gov.uk/government/publications/online-retailers-including-mandatory-delivery-fees-in-the-total-price/open-letter-to-online-retailers-including-mandatory-delivery-fees-in-the-total-price
- https://www.gov.uk/government/publications/price-transparency-cma209/providing-clear-and-accurate-information-about-prices-summary
- https://www.buckydrop.com/en/how-it-works/
- https://docs.stripe.com/payments/checkout
- https://docs.stripe.com/billing/subscriptions/overview
