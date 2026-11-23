# Owner-only BuckyDrop auto-buy pilot — draft, not activated

This branch replaces the owner sample-order **manual quote form** with a direct checkout preparation path:

1. Only the verified `HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID` may access the route `/pilot/buckydrop` or POST `/api/owner/automatic-purchase/prepare`.
2. Herocon finds the selected SKU inside the BuckyDrop private saved snapshot (v2/v1), **no new billable Product Detail API request**. The saved product must be BuckyDrop-live, have SPU+SKU, a price, stock and MOQ, and a snapshot less than 14 days old. It is not a live stock guarantee, and not all catalogue products have valid snapshots.
3. Internal cost config chooses an upfront all-inclusive GBP retail amount using supplier CNY times an approved **effective wallet GBP/CNY rate**, plus GBP allowances for estimated international freight, BuckyDrop fulfilment/packaging/domestic shipping, wallet/bank/FX charges, taxes and shipping-overrun buffer.
4. A server-only minimum-profit guard budgets **6% + 30p** for Stripe (planning figure, not a published card tariff) and requires at least **£2 or 12% of full customer revenue** contribution. The mandatory **99p service fee** appears separately. Limits: one SKU, 1–3 units, max £100 pilot retail total.
5. The auto-prepared record is immutable, stored in a private Vercel Blob, and expires in 2 hours. /checkout/[id] collects shipping address and phone number through Stripe; **Herocon** owns the Stripe transaction, not BuckyDrop.
6. Only after a valid signed live Stripe webhook (and independent Stripe session validation) can the existing handoff create exactly one BuckyDrop Shop Order via the signed Solution API. `snapshotOnly` passes a saved SPU+SKU and avoids repeat paid product detail queries. A private one-time claim and payment-derived partner order number guard against duplicate supplier orders.
7. BuckyDrop wallet funding and automatic procurement/parcel dispatch are **not controlled by this code**. Provider account settings must enable them, and sufficient wallet cash must exist **before** receiving new orders. BuckyDrop may reject procurement, change price or charge more after packing. A successful Shop Order creation only means **accepted**, not **purchased, wallet settled or delivered**. Merchant reconciliation, email alerts, refunds, tracking and customer-support obligations remain.

## Configuration required before any real charge

The following are OFF/missing until a human verifies costs, Stripe and provider settings:

```
# Owner-only automatic pricing. Set this once as merchant; no per-product quote form.
HEROCON_OWNER_AUTOBUY_PRICING_APPROVED=true
HEROCON_OWNER_PILOT_SHIPPING_BUDGET_APPROVED=true
HEROCON_OWNER_PILOT_FX_GBP_PER_CNY=<approved effective rate>
HEROCON_OWNER_PILOT_SHIPPING_GBP=<conservative UK freight allowance PER UNIT>
HEROCON_OWNER_PILOT_BUCKYDROP_FEES_GBP=<sourcing/handling/domestic freight allowance PER UNIT>
HEROCON_OWNER_PILOT_WALLET_FEES_GBP=<wallet top-up/bank fee allowance PER UNIT>
HEROCON_OWNER_PILOT_SHIPPING_BUFFER_GBP=<extra freight risk reserve PER UNIT (>=0.50)>
HEROCON_OWNER_PILOT_TAX_DUTIES_GBP=<tax/duty that Herocon bears PER UNIT>

# Existing independent gates needed for live payments and BuckyDrop order writes
HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED=true
HEROCON_ONE_PAYMENT_LIVE_APPROVED=true
HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED=true
STRIPE_LIVE_WEBHOOK_SECRET=<valid live Stripe webhook endpoint signature>
HEROCON_ORDER_SUBMISSION_ENABLED=true
HEROCON_INTERNAL_FULFILMENT_KEY=<independent 32+ char random server secret>
HEROCON_BUCKYDROP_AUTO_FULFILMENT_CONFIRMED=true
HEROCON_BUCKYDROP_PREPAID_WALLET_CONFIRMED=true
HEROCON_ALLOW_PREFUNDED_AUTO_SUPPLIER_RELEASE=true
HEROCON_ALL_IN_DELIVERED_PRICING_APPROVED=true
HEROCON_FREIGHT_CURRENCY_CONFIRMED=true
HEROCON_CHECKOUT_POLICIES_APPROVED=true
HEROCON_ORDER_EMAIL_FROM=<domain-verified sender>
HEROCON_ORDER_ALERT_EMAIL=<merchant inbox>
RESEND_API_KEY=<valid server-side key>
# Plus existing BuckyDrop live credentials, Stripe live secret, Blob, admin keys.
```

### Unresolved / do not enable prematurely

- A **single flat freight allowance per unit** is a merchant-approved *planning budget*, not a BuckyDrop carrier-specific rate. It is NOT sufficient for arbitrary heavy, oversized, battery, liquid or restricted items. Those must be blocked or routed to separately verified shipping categories before public rollout. The company must absorb overages on an all-inclusive price; a later invoice cannot be imposed without consent.
- The current project has live Stripe product credentials configured, but there is no verified **live product-payment webhook signature**, internal supplier-write secret, all-in freight currency confirmation or any positive evidence of adequate BuckyDrop wallet funding. The connected Stripe plugin provides **test-mode** access only. Never set live flags to true just to make a Buy button work.
- Current frontend has a second buyer-facing bulk review in the cart, but this first auto-price pilot supports **one line only**. Do not claim bulk order support is automatically payable until basket-level shipping and consolidated buyer records are built.
- Run a complete Stripe TEST payment+signed webhook (without provider writes), then one **explicitly authorized** low-value order from the verified owner with funded BuckyDrop wallet and tracking/status follow-up.
- The quoted supplier snapshot can become stale. Production should add price ceiling policy / provider acceptance verification / automated refund exception handling and use product exclusions.
- The system has a **signed webhook and one-time supplier claim**, not a distributed transactional order/payment ledger; exceptional failures after Stripe payment can still need manual refund and order reconciliation.
- Profit guard is **projected contribution**, not guaranteed net profit. Taxes on business income, refunds, losses, chargebacks, overhead and delays can wipe out the margin. Work with a UK accountant and legal reviewer on all-in price disclosures and fulfilment obligations.

## What this branch changes

Code and UI only, behind existing disabled-by-default operational gates. No real customer charge, API supplier write, BuckyDrop wallet debit or public launch was performed. Vercel preview deployment is safe to inspect; it does **not** imply that live payments or supplier purchases are enabled.
