# Herocon — production Stripe connection readiness

Updated 2026-11-18. This is **not** an instruction to launch public payment collection.

## Current status

- Existing Stripe account seen through connected Stripe: \`acct_1TGeApDWTSpscVhc\` (UK/GBP), dashboard display name \`GLP1-Today\`, statement descriptor \`HEROCON\`.
- \`https://stripe.com/@herocon\` is a public profile/branding URL, **not** a secret key or Checkout endpoint.
- Existing operator-only Stripe **test** payment integration is unchanged and separate.
- Herocon public Cart / Buy Now **cannot charge** the customer; BuckyDrop supplier order submission remains off.
- A live Stripe key was exposed in chat and the pasted value ended with placeholder dots. **Rotate/revoke the exposed key. Do not store or reuse it. Never paste a replacement into chat.**

## What has been prepared

- \`lib/stripe-live.ts\`: separate LIVE key loader and a **read-only** \`GET https://api.stripe.com/v1/account\` verification. It checks the account ID is the expected Herocon account and returns only safe business and capability fields.
- \`POST /api/stripe/live-connectivity\`: disabled by default. Requires \`HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED=true\`, a fresh \`sk_live_\` key stored in Vercel, and independent sensitive operator admin key header \`x-herocon-stripe-admin-key\`. It **does not** create sessions, charges, transfers, payment methods or orders.
- \`POST /api/stripe/live-webhook\`: disabled by default, supports verified Stripe live \`checkout.session.completed\` and \`checkout.session.async_payment_succeeded\` only with a **distinct live webhook signing secret**. If explicitly enabled, it stores a minimal private receipt for sessions with expected metadata and \`fulfilment=disabled\`, but **never calls BuckyDrop or fulfils anything**.
- Stripe's test webhook remains separate at \`/api/stripe/webhook\` and rejects live events.

## Secure configuration in Vercel (after key rotation)

Use the Herocon project's **Vercel → Settings → Environment Variables**, Production only, and set these directly as sensitive server-side values:

| Variable | Meaning | Default / instruction |
| --- | --- | --- |
| \`STRIPE_LIVE_SECRET_KEY\` | **Freshly rotated** production secret from Herocon Stripe account | Required for live account verification; never use \`NEXT_PUBLIC_\` prefix |
| \`HEROCON_STRIPE_LIVE_ADMIN_KEY\` | New independently generated high-entropy private admin secret, at least 32 characters | Required for read-only account verification |
| \`HEROCON_STRIPE_LIVE_CONNECTIVITY_ENABLED\` | Enables only operator-authorised read-only account checks | Defaults off; may be enabled after the above two values exist |
| \`STRIPE_LIVE_WEBHOOK_SECRET\` | Signing secret from a **live-mode** Stripe webhook destination | Distinct from test-mode \`STRIPE_WEBHOOK_SECRET\`; never share |
| \`HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED\` | Enables verified event receipt only | Defaults off; should remain off until live endpoint is registered/tested |
| \`HEROCON_ORDER_SUBMISSION_ENABLED\` | Merchant BuckyDrop supplier writes | **Must remain false** |
| \`HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED\` | Future commercial customer checkout | **Not implemented**; leave unset |

Live Stripe webhook destination, if later configured: \`https://herocon-app-pi.vercel.app/api/stripe/live-webhook\`.

After setting Vercel secrets, redeploy the project to make environment updates available. Never store credentials in GitHub, browser code, URL parameters or chat. Never copy the exposed or incomplete value into Vercel.

## Remaining work before taking real money

1. Verify the BuckyDrop freight quote's currency and currency conversion, plus weight/size eligibility.
2. Determine and disclose **all-in GBP payable product cost**, margin, service fees, shipping, duty/VAT and returns policy. Use a server-authoritative immutable order-intent and supplier stock/price validation.
3. Implement customer-facing Stripe Checkout Sessions with the frozen server-side amount and order intent. Restrict supported countries, reject tampered amounts and preserve reconciliation records.
4. Verify *live* webhook signature, exact paid status, account, order-intent ID, amount and currency and handle asynchronous methods/refunds/disputes idempotently. A success-page redirect is **not** proof of payment.
5. Finish BuckyDrop automatic-vs-manual confirmation decisions and supplier funding. An accepted Shop Order does not mean supplier payment or final fulfilment.
6. Add merchant reconciliation/alerts, customer confirmation and secure tracking code delivery, and a complete refund/exception flow.
7. Thorough end-to-end sandbox tests and a controlled live trial before enabling any payment button or supplier write.

Official Stripe security guide: https://docs.stripe.com/keys-best-practices. Existing instructions: \`STRIPE-SETUP.md\`, \`BUCKYDROP-FULFILLMENT-PLAN.md\`.
