# Herocon Stripe setup — sandbox first

Date: 2026-11-18. Connected Stripe test account currently appears as **GLP1-Today**, UK, default GBP, with payments statement descriptor **HEROCON**. The public profile https://stripe.com/@herocon is branding, not an API credential.

Stripe's official integration planner accepted **Stripe-hosted Checkout** for Herocon's future one-time GBP physical-goods payments.

## What was built

- \`lib/stripe-gateway.ts\` — Node-only Stripe test Checkout session creator and raw-body Stripe-Signature HMAC verifier.
- \`POST /api/stripe/test-session\` — operator-only test session: exactly **£1.00 in TEST mode**, explicitly described as an integration test with **no order or shipment**. Requires a private admin key and a dedicated enable switch. The public cart does not call it.
- \`POST /api/stripe/webhook\` — signature-verifies sandbox checkout completed / asynchronous payment events, filters the expected test purpose, validates test-mode paid GBP £1.00, stores only a minimal private receipt in Vercel Blob. Repeated events don't create extra receipts; storage failure requests a retry. **This webhook never submits BuckyDrop orders**, even after payment.
- \`/payments/test-result\` — test-only return page, and specifically does not treat a redirect as proof of payment.

No Stripe API keys or webhook secret were generated, guessed, printed, placed in Git, or added as blank Vercel values. The connection from ChatGPT's Stripe plugin is NOT the website's Stripe API authentication.

## Required private Vercel configuration

In **Stripe test mode**, use the Herocon Stripe account's Dashboard → Developers → API keys to obtain the **test secret key** (prefix \`sk_test_\`). Do not use a live key or share it in chat. Save it only in Vercel's environment variables for the Herocon project:
- \`STRIPE_SECRET_KEY\`: test secret key, **sensitive**, server-only, NO \`NEXT_PUBLIC_\` prefix.
- \`STRIPE_WEBHOOK_SECRET\`: signing secret \`whsec_...\`, obtained after registering the **TEST-mode** webhook destination \`https://herocon-app-pi.vercel.app/api/stripe/webhook\` for \`checkout.session.completed\` and \`checkout.session.async_payment_succeeded\`. Use encrypted/sensitive server-only Vercel variable.
- \`HEROCON_STRIPE_TEST_ADMIN_KEY\`: independently generated random secret, at least 32 characters, server-only sensitive.
- \`HEROCON_STRIPE_TEST_CHECKOUT_ENABLED\`: \`true\` ONLY once the above are set and the Stripe endpoint is registered. Default absent/false.
- \`HEROCON_SITE_ORIGIN\`: optional; default \`https://herocon-app-pi.vercel.app\`. Must equal the actual site origin.

After adding or updating Vercel environment variables, redeploy production so server functions receive the updated configuration. A legitimate operator can submit an authenticated \`POST\` to \`/api/stripe/test-session\` with \`x-herocon-test-admin-key\` (do not put secret into a URL or frontend). The returned \`url\` opens **Stripe TEST checkout** for a synthetic £1 payment. Use Stripe's published test card numbers, not real cards. The signed Stripe event can be inspected in the Stripe Dashboard → Workbench → Webhooks deliveries, and its minimal receipt in private Vercel Blob. Never share raw webhook headers or keys.

Test checkout session uses Stripe's HTTPS \`/v1/checkout/sessions\`, \`mode=payment\`, one GBP 100-pence test line, and standard success/cancel redirects. The webhook signature uses Stripe's \`t=\` timestamp and \`v1=\` signatures with a 5-minute replay window. The session is explicitly marked \`herocon_integration_test\` and \`fulfilment=disabled\`.

## NOT IMPLEMENTED / OFF (do not interpret this sandbox as customer checkout)

1. **Public Herocon cart payment is disabled.** The test session deliberately does not use customer cart lines or shipping. It MUST NOT be used to receive real orders or money.
2. **Stripe production credentials are not configured.** No live Checkout Sessions or live charges can be created by the above code; \`sk_live_\` is rejected.
3. **BuckyDrop order submission remains disabled** because test payments must never create supplier purchases. Existing merchant-only BuckyDrop order submission requires its own independent flag, private server-only key, verified payment facts and rechecks stock, SKU and price. Do not enable it now.
4. The BuckyDrop live shipping quotes work, but the returned monetary field lacks a documented billing currency. The freight price and GBP total must be verified before charging customers.
5. Real checkout requires a server-authoritative quote and GBP selling price, supported payment methods and VAT/tax policy, merchant approval for BuckyDrop auto-fulfilment or manual portal confirmation, payment webhook → stored paid order → one guarded supplier submission → order confirmation/tracking key delivery, plus refund and error handling. BuckyDrop's public API does not pay/confirm a Shop Order.
6. Before any consumer-facing launch, test a **separate Stripe LIVE** integration after the above choices and test-mode workflow are finished. Don't copy test webhook secrets to live.

## Recommended full checkout architecture

- Customer selects SKUs and shipping destination in Herocon. Validate product lines server-side against fresh BuckyDrop stock and seller price.
- Calculate full final GBP payable cost and taxes with a real destination-eligible, currency-confirmed shipping quote; persist a signed/immutable private order intent. Quote expiry and cancellation handling are required.
- Create Stripe Checkout Session (one-time GBP payment) with the frozen final amount and an opaque private intent identifier, not customer-submitted price.
- Receive Stripe's signed webhook and independently verify session paid state, currency, amount, account/livemode and exact stored intent, with idempotent event handling. The return URL is for navigation only and never proves payment.
- Only after captured **LIVE** payment, submit exactly once through the protected BuckyDrop paid-order pipeline, preserving the original \`partnerOrderNo\` for reconciliation. Test payments must never hit live BuckyDrop writes.
- Confirm the BuckyDrop account setting for auto-fulfilment. When disabled, a merchant must confirm and pay in BuckyDrop's portal, and Stripe customer payment is not supplier payment. Clearly distinguish accepted, purchased, packed, shipped and delivered states.
- Send a confirmation email with Herocon's private access code and provide read-only tracking through \`/orders\`.

For the source of these rules, see Stripe-hosted Checkout and webhook official docs:
- https://docs.stripe.com/checkout/quickstart
- https://docs.stripe.com/webhooks/quickstart
- https://docs.stripe.com/keys-best-practices

See also \`BUCKYDROP-FULFILLMENT-PLAN.md\` for the supplier-side handoff.
