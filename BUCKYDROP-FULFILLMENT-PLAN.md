# Herocon ↔ BuckyDrop: live shipping, paid orders, and tracking (2026-11-18)

Based on the user's local BuckyDrop OpenAPI skill package v0.5.7, contract v1.2.6, catalog dated 2026-11-06.

## Current deployment and control boundaries

- Existing Vercel production environment contains encrypted/sensitive \`BUCKYDROP_APP_CODE\` and \`BUCKYDROP_APP_SECRET\`; \`BUCKYDROP_ENV=live\` and product lookup is enabled. No credential values are stored in GitHub or exposed to React.
- \`lib/buckydrop-gateway.ts\` supports **only** five allowlisted BuckyDrop OpenAPI operations: shipping quote, Shop Order creation, order detail, package detail, tracking. It uses signed HTTPS POSTs and a fresh millisecond timestamp for each request.
- Public \`POST /api/buckydrop/shipping-quote\` makes **one live, read-only** shipping-quote request when a visitor explicitly asks. Per-instance throttling, same-origin JSON requirements, input bounds and output field filtering are present; a shared Vercel WAF / distributed rate limiter is still recommended before promotion. A request may be billable on the merchant's BuckyDrop plan.
- Shipping request sends \`item.countryCode\`, one product with **kg** weight and **cm** dimensions. It forwards results from \`/api/rest/v2/adapt/adaptation/logistics/channel-carriage-list\`, including route name, provider, pricing amount, eligibility, risks, transit days, billable weight, and applicable notices.
- **Price currency caveat (temporary operator assumption, 19 November 2026):** Contract v1.2.6 exposes `records[].totalPrice` and `records[].price` but does not explicitly state their currency. At the merchant's request, production now sets `BUCKYDROP_QUOTE_CURRENCY=CNY`, displaying the API numeric amounts as **CNY (assumed)**. A rough GBP conversion may be shown for reference. This is **not verified** for the exact API field, and must not be used for binding checkout totals until BuckyDrop confirms its billing currency in writing.
- No shipping purchase or parcel creation is triggered by the estimator.

## Payment and supplier procurement: required launch sequence

**Current customer checkout stays OFF**. The BuckyDrop public API does not expose a Store Order Confirm, settlement or payment operation. Acceptance of a Shop Order does not mean purchased, paid, or shipped; with BuckyDrop auto-fulfilment disabled it stays awaiting confirmation in the merchant portal, where the merchant must confirm and pay.

Recommended commercial integration: **Stripe Checkout** (or another licensed UK-compatible payment service) for GBP customer collection. Before launch, implement the payment provider, verified signed webhook, invoice/tax treatment, refunds/chargebacks and a customer email system. The payment webhook must verify the signature and \`payment_status=paid\`/captured status *using provider records*, ensure the order isn't fulfilled already, and call the merchant-only order submission endpoint. Never accept browser \`paid=true\`, cart prices, shipping estimate or a customer-supplied payment reference as payment verification.

The merchant-only \`POST /api/buckydrop/orders/submit\` requires **all**:
- \`HEROCON_ORDER_SUBMISSION_ENABLED=true\` — **do not set this now**.
- A high-entropy \`HEROCON_INTERNAL_FULFILMENT_KEY\` of at least 32 characters, sent only by a server-to-server payment-verified backend.
- Existing live BuckyDrop credentials and private Blob storage.
- A verified payment reference, GBP payment total, trusted GBP selling-unit amounts, recipient details, and original marketplace URL + actual seller SKU + quantity.

The submission endpoint fetches *fresh* BuckyDrop seller details server-side, checks source platform, SPU/SKU, availability, stock, MOQ and CNY supplier unit price, and maps the invoice selling price to \`partnerSalePrice\` + \`partnerSaleCurrency=GBP\` while preserving the supplier CNY \`productPrice\`. It never sends browser cart prices to BuckyDrop.

Each trusted paid reference deterministically maps to \`HC-<sha256-prefix>\`. The full original Shop Order request and the one-time access-code hash are reserved in a **private** Vercel Blob object using \`allowOverwrite:false\` *before* sending the BuckyDrop create call. If a callback repeats or a BuckyDrop response is unknown, the operation does **not** resubmit; the merchant reconciles using the original \`partnerOrderNo\`. This guards against duplicate fulfilment but is not a replacement for transactional distributed order storage, a dedicated queue, audited webhook processing or operational monitoring.

BuckyDrop Store Order creation path: \`/api/rest/v2/adapt/adaptation/order/shop-order/create\`; read-back: \`/api/rest/v2/adapt/adaptation/order/detail\`.

**Required before enabling**:
1. Merchant confirms the BuckyDrop live application grants \`create-shop-order\`, \`order-detail\`, \`package-detail\` and \`logistics-tracking\`; confirm whether each operation is charged.
2. Merchant decides and configures BuckyDrop **automatic fulfilment vs manual portal confirmation**. Document account balance, currency, sourcing fees, VAT/insurance and final shipping allocation; BuckyDrop's public API cannot confirm/pay an SO. Test exact production settings and a low-value order in an authorized environment.
3. Verify payment provider webhook in a private test deployment. The internal submission key is not a customer checkout secret, is never given to browsers, and is not an alternate substitute for payment verification.
4. Add durable payment/order event table, financial reconciliation, customer support / returns, order confirmation email that securely distributes the private access code, cancellation/refund rules, and merchant admin tools to reconcile pending/unconfirmed orders.
5. Implement a reliable way to collect accurate product costs and delivery charges **before** charging the customer. The quote endpoint is a read-only estimate and does not guarantee the eventual cost.
6. Complete an end-to-end test for paid order, supplier acceptance, warehouse stage, parcel, tracking, and refund/exception. Confirm and document buyer terms and data privacy before making checkout live.

## Customer order status and tracking

- \`/orders\` is a read-only customer page. It takes the Herocon partner order number and a private access code (received at future order confirmation), never account-wide order searches.
- \`POST /api/buckydrop/orders/status\` verifies a stored SHA-256 access-code hash before any BuckyDrop calls. It only queries the original accepted/uncertain paid reference and actual linked package codes, not arbitrary user-provided BuckyDrop identifiers. It returns filtered sales/PO/parcel status and tracking events, omitting recipient details and purchase payloads.
- Order detail is not an order-list API. Parcel status, normal parcel status and tracking status are different enumerations; the latter is the relevant signal for delivery, and absence of tracking is normal before dispatch.
- Read-only tracking can function for orders previously submitted **through this guarded pipeline**, once merchant has delivered access codes. It does not expose a search of all existing BuckyDrop orders.

## API permission and configuration checkpoints

| Setting | Value/current state |
| --- | --- |
| \`BUCKYDROP_ENV\` | \`live\` configured in Vercel production |
| \`BUCKYDROP_APP_CODE\` / \`BUCKYDROP_APP_SECRET\` | Already present in protected Vercel production environment; **do not display or commit** |
| \`BUCKYDROP_ENABLE_PRODUCT_LOOKUP\` | Already \`true\` in production |
| \`BLOB_READ_WRITE_TOKEN\` | Existing private Vercel Blob store |
| \`BUCKYDROP_QUOTE_CURRENCY\` | **Not configured** pending billing-currency verification |
| \`HEROCON_ORDER_SUBMISSION_ENABLED\` | **Unconfigured / OFF**; keep disabled until paid checkout integration passes |
| \`HEROCON_INTERNAL_FULFILMENT_KEY\` | **Not configured**; add sensitive production-only secret after trusted backend is ready |

Sources: BuckyDrop v0.5.7 local package \`README.md\`, \`SKILL.md\`, \`references/integration.md\`, \`references/workflows/products.md\`, \`orders.md\`, \`parcels.md\`, \`interface-contracts.md\`, and the \`describe\` contracts. The package documents 26 public operations in its 2026-11-06 catalog. Public API docs: https://solution-api.buckydrop.com/en/api.
