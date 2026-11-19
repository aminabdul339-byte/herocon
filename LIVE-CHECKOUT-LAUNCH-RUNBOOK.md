# Herocon checkout launch runbook — Nov 19, 2026

**Status: PARTIALLY IMPLEMENTED BEHIND FAIL-CLOSED FLAGS, NOT LIVE.**
**Important 19 Nov update:** The product purchase and freight payment are now designed as two separate customer charges. The first-stage product quote and an indicative later freight estimate exist, but the second-stage warehouse shipping invoice/payment/release is NOT implemented. The site refuses live payments until HEROCON_TWO_STAGE_SHIPPING_READY is explicitly enabled after testing.
See TWO-STAGE-WAREHOUSE-AND-MEMBERSHIP-ROADMAP.md for the current model and future £9.99 monthly membership.
Do not turn on customer-facing payments before the outstanding verification steps below.
Current storefront remains a discovery/catalogue service that cannot collect payments.

## What has been built

- Operator-only quote approval interface: \`/admin/checkout\`; API: \`/api/admin/checkout/quotes\`.
  - Independent header \`x-herocon-checkout-admin\` and server-only \`HEROCON_CHECKOUT_ADMIN_KEY\` (>=32 chars).
  - Operator inputs buyer email, original marketplace link and BuckyDrop SKU, quantity, **product-stage retail GBP price**, applicable stage-one product tax GBP, and a realistic **indicative future international shipping** estimate in GBP.
  - A new, private Vercel Blob approved quote is stored immutably. Fresh live BuckyDrop SKU/stock/price check is mandatory. Source lookups may be billable.
  - Quote expires after 23h and can be shared privately at \`https://herocon.store/checkout/<id>\`. It is **not** created from an untrusted browser cart total.
- Customer quote page shows frozen GBP PRODUCT-only amount due now and indicative later shipping amount **not included**; there is explicit second-shipping-payment disclosure. Pay button remains disabled until all launch gates pass.
- Server-only customer product-stage Stripe Checkout rechecks SKU and captures only the approved product-stage GBP amount; shipping requires a **future, separate** Stripe Session and warehouse-release flow not yet built. Restricted to GB in the initial pilot.
- \`/checkout/complete\` is navigation-only; it never treats the redirect as payment proof.
- Signed \`/api/stripe/live-webhook\` accepts live Checkout paid events, re-reads the session from Stripe, verifies paid status / GBP amount / intended quote / email / mode / purpose, reserves an immutable per-quote claim, then — **only if separately enabled** — sends the trusted paid order to Herocon's internal BuckyDrop Shop Order creation route.
- BuckyDrop paid-order submission rechecks actual SKU/stock/price and preserves a single-send reservation. Shop Order acceptance is **not** proof of supplier payment or shipment. Supplier funds are paid by the merchant in BuckyDrop's portal in the requested manual-payment model.
- Private read-only reconciliation API \`/api/admin/checkout/reconciliation\` and merchant dashboard show paid orders, unresolved claims, missing confirmations, tracking codes, and failed customer/merchant notifications. Do not auto-resubmit orders with unknown outcomes.
- Optional transactional confirmations use server-side Resend after a verified paid event. On email failure, records and tracking codes remain in private storage for merchant manual follow-up.
- Customer cart now provides a "Request final GBP quote" mailto link. **This is a controlled manually quoted pilot, not full automatic self-service live checkout.**

## Do NOT use the temporary CNY shipping setting to charge customers

\`BUCKYDROP_QUOTE_CURRENCY=CNY\` is an assumption for DISPLAY of shipping quotes, not proof of the currency of \`totalPrice\` from BuckyDrop's OpenAPI.
Before any paid order, obtain written confirmation of quote amount currency, and agree actual shipping, weight/dimensions, customs, VAT and merchant freight/margin policy. The first-stage quote discloses an estimated later shipping charge. The final stage-two payable shipping amount must be verified independently before the customer can explicitly pay it. No buyer-entered total is trusted.

## Launch gates, ALL initially default OFF

Set in the Vercel **Production** environment ONLY, after completing the corresponding milestone. Keys must remain sensitive server-side; never put secret values in chat, GitHub, browser, URL params or NEXT_PUBLIC_ vars.

| Environment variable | Launch prerequisite |
| --- | --- |
| \`HEROCON_CHECKOUT_ADMIN_KEY\` | New independently generated random operator key >=32 chars, stored on operator machine |
| \`HEROCON_STRIPE_KEY_ROTATED=true\` | Revoke the **previously exposed** live key and install a fresh matching Herocon live Stripe key (server-only) |
| \`STRIPE_LIVE_SECRET_KEY\` | Fresh restricted/approved live secret (existing value must be rotated/verified) |
| \`HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED=true\` | Read-only Stripe account verification succeeds; charge capability verified |
| \`STRIPE_LIVE_WEBHOOK_SECRET\` | Stripe **LIVE** endpoint signing secret for \`https://herocon.store/api/stripe/live-webhook\`, created and installed via Stripe Dashboard |
| \`HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED=true\` | Signed live event deliveries verified and test cases rehearsed |
| \`HEROCON_INTERNAL_FULFILMENT_KEY\` | Independent random backend-only supplier order key (>=32 chars) |
| \`HEROCON_ORDER_SUBMISSION_ENABLED=true\` | Only after BuckyDrop Shop Order API permission, supplier funding and single-send reconciliation have been verified |
| \`HEROCON_BUCKYDROP_MANUAL_PAYMENT_CONFIRMED=true\` | Confirm BuckyDrop **auto-fulfilment is OFF**, and manually paying/confirming supplier orders in BuckyDrop is supported for this app |
| \`HEROCON_FREIGHT_CURRENCY_CONFIRMED=true\` | Obtain BuckyDrop confirmation + complete final delivered GBP shipping/tax/cost policy |
| \`HEROCON_CHECKOUT_POLICIES_APPROVED=true\` | Correct seller-of-record, imprint, privacy, UK cancellation/refund/returns, duties, product safety/IP/compliance, taxes |
| \`RESEND_API_KEY\` | Server-side provider API key and verified sending domain |
| \`HEROCON_ORDER_EMAIL_FROM\` | Verified sender e.g. "Herocon <orders@herocon.store>" ONLY after DNS verification |
| \`HEROCON_ORDER_ALERT_EMAIL\` | Merchant order alert mailbox monitored daily |
| \`HEROCON_TWO_STAGE_SHIPPING_READY=true\` | **MUST remain unset/off** until separate final freight invoice, warehouse status/QC checks, signed shipping-payment webhook, and BuckyDrop shipping-release process are tested |
| \`HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED=true\` | **FINAL** production authorisation after both product and shipping stages pass end-to-end testing; last switch to set |

Shared private Blob token and existing BuckyDrop live credentials are already installed. Confirm permissions, balances, and operational costs before enabling supplier writes.

## 19 November 2026 — private checkout admin access provisioned

A new, independent `HEROCON_CHECKOUT_ADMIN_KEY` was added as a **sensitive Production Vercel environment variable** for the merchant-only checkout dashboard. It is delivered to the merchant separately in a locally downloadable protected text file; **its value is not committed to GitHub**.

This enables merchant login and approval of private supplier-verified GBP quotes once the latest Vercel production deployment is ready. It **does not enable real customer charges**, BuckyDrop order submission or a sandbox payment session. Stripe TEST secret/webhook, live webhook secret, email provider, supplier manual-payment permissions, verified freight, legal sign-off and an end-to-end trial remain outstanding.

## Merchant key setup and sandbox checkout test

The connected Mac is currently offline to ChatGPT, so Herocon cannot safely create and hand back a fresh merchant-owned key on that device.

On the merchant's Mac, generate an independent key without displaying it in chat:
\`\`\`sh
mkdir -p ~/.config/herocon && chmod 700 ~/.config/herocon
umask 077
openssl rand -hex 48 > ~/.config/herocon/checkout-admin-key
pbcopy < ~/.config/herocon/checkout-admin-key
\`\`\`
Paste the clipboard into **Vercel > Herocon project > Settings > Environment Variables > Production** as \`HEROCON_CHECKOUT_ADMIN_KEY\` (Sensitive type). Redeploy. To access \`/admin/checkout\`, copy the key again from the local file.

For independent Stripe TEST payments, set \`STRIPE_SECRET_KEY=sk_test_...\`, \`STRIPE_WEBHOOK_SECRET=whsec_...\` and \`HEROCON_STRIPE_TEST_CHECKOUT_ENABLED=true\` as server-only Vercel variables. Register \`https://herocon.store/api/stripe/webhook\` in Stripe **TEST mode** for checkout session paid events. Use the admin dashboard to create an approved quote (live BuckyDrop stock check may still be billable), then click "Generate Stripe TEST payment" and pay with Stripe's published test card numbers. The signed test webhook stores the paid GBP quote receipt but **cannot create any BuckyDrop supplier order**.

For LIVE mode, register a **separate** Stripe LIVE webhook destination and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, and `charge.dispute.closed`. Payment-complete events can trigger a supplier handoff only after session re-verification; refund/dispute events are read-only merchant reconciliation alerts and **never** auto-refund or re-submit an order.

For LIVE mode, register a **separate** Stripe LIVE webhook destination \`https://herocon.store/api/stripe/live-webhook\` and install its live \`whsec_...\`. Never use TEST secrets for LIVE mode. All live and supplier enable flags remain off until tests and merchant confirmations pass.

## Order flow during controlled live pilot

1. Buyer selects SKU(s) in cart and requests a final quote.
2. Merchant verifies stock, actual supplier purchase costs, shipping cost, profit, VAT and taxes.
3. Merchant approves frozen GBP quote in \`/admin/checkout\` and sends the private customer link.
4. Buyer reviews product-stage GBP amount plus an estimated later freight charge, acknowledges the second payment, and pays only the product amount through Stripe once enabled.
5. Stripe signs a webhook. Herocon fetches the paid session and compares it against its immutable quote.
6. Herocon reserves the paid quote and sends **one** BuckyDrop Shop Order. If there is a timeout/ambiguous response, it does not submit twice; merchant reconciles in dashboard.
7. Merchant receives alert and **manually confirms and pays BuckyDrop**. Merchant must keep enough funds in BuckyDrop even if Stripe's payout has not yet reached the bank.
8. BuckyDrop buys and receives items at the warehouse, performs QC and provides photo assets if supported. After verified weight and approved shipping quote, Herocon must create a separate customer freight payment and confirm the funds before any international dispatch. This stage is **not yet implemented**.
9. Merchant handles refunds, shipping disputes, changed supplier prices, and buyers' statutory cancellation/return rights.

## Test plan (required before setting last switch)

- [ ] Confirm legal operator information, UK VAT/tax responsibilities, returns/restrictions and support address; update all customer-facing legal pages (currently say checkout unavailable).
- [ ] Verify BuckyDrop Shop Order create + order detail + package/tracking scope, manual payment, no automatic procurement, and funding procedure. Never trigger a real supplier purchase just as a test.
- [ ] Rotate leaked live Stripe key; verify account \`acct_1TGeApDWTSpscVhc\`, GBP, charges/payouts and statement descriptor.
- [ ] Configure separate Stripe TEST keys and TEST webhook, then test one-time session handling with safe test card numbers and mock supplier handoff. The older £1 operator test is not a substitute for entire quote-to-fulfilment test.
- [ ] Test same webhook twice, simultaneous retries, delayed payment, failed payment, 3DS, session cancelled, refund/dispute event, Stripe timeout, BuckyDrop rejected/unknown response, stock increase/shortage, and price change.
- [ ] Verify sender domain and that both buyer and merchant receive emails; missing emails should show in reconciliation.
- [ ] Verify no access to private quotes, order records, tracking codes and admin operations without a strong key; confirm storage retention and data rights.
- [ ] Verify UK postcode/address/phone compatibility and real supplier freight eligibility.
- [ ] Reconcile a controlled full purchase, BuckyDrop **manual merchant supplier payment**, fulfilment and tracking through delivery.
- [ ] Activate only after controlled purchase passes, with an off switch and merchant support available.

## Known limitations

- Self-service **public cart to instant payable checkout** is not implemented; merchant approval is required for each first-stage product quote. Final international shipping is a separate, unimplemented payment after warehouse receipt.
- No provider-confirmed BuckyDrop shipping API currency or automated all-in tax calculation.
- No automatically executed refunds. Refunds/chargebacks must be handled with the merchant's real Stripe account, recorded and reconciled.
- Email requires Resend/domain verification. Failure does not erase a paid order but requires manual follow-up.
- The Stripe integration is not tested live until operator provides safe secrets and the provider approves merchant configuration.
- The BuckyDrop supplier API may not have app permission, or a Shop Order may still require merchant payment/confirmation in BuckyDrop.
- The current in-memory request throttles for public quote checks and tracking are not a distributed WAF. Add central paid-API abuse protection and monitoring before scaling.
