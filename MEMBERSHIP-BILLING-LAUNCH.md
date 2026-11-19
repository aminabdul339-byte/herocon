# Herocon £9.99 monthly membership — launch checklist

Updated 19 November 2026. **Public £9.99/month LIVE membership checkout has been enabled for any verified Herocon account**; customers explicitly acknowledge recurring billing and early-access limitations. A successful end-to-end customer payment, cancellation, webhook and invoice lifecycle still requires verification. Free sign-up and Add to cart remain free; product ordering and international shipping checkout are independently disabled.

## Built and deployed

- Supabase-verified account required before a subscription session.
- Stripe-hosted recurring subscription Checkout; server validates price is exactly GBP 999 pence per month before creating a payment page.
- Private Vercel Blob mapping from signed-in account UUID to Stripe Customer ID, separate test and live records.
- Read-only Stripe status check (including item billing-period expiry) on every product purchase, so cancellations and failed payments cannot be bypassed by client flags.
- Billing Portal for invoices, payment methods, cancel-at-period-end.
- A separately signed Stripe test/live webhook records subscription, invoice and cancellation events.
- Membership page and purchase gate present Subscribe and Manage billing controls only when the required configuration is complete. Test subscriptions never enable live product orders. Public live membership is available, but product ordering and two-stage shipping charges remain disabled and prominently disclosed.

## Configured in Stripe TEST

- Stripe account: acct_1TGeApDWTSpscVhc (connected to ChatGPT in TEST mode).
- TEST webhook: https://herocon.store/api/stripe/membership-webhook
- Its signing secret is already saved in Vercel Production as HEROCON_MEMBERSHIP_TEST_WEBHOOK_SECRET.
- Stripe TEST Billing Portal configuration: bpc_1UdaSKDWTSpscVhcUkFnU6Do
- Its ID is already saved as HEROCON_MEMBERSHIP_TEST_PORTAL_CONFIGURATION_ID in Vercel Production.
- TEST Stripe API key and recurring Price ID are still missing, so no Stripe TEST subscription can be charged yet.

## Complete TEST configuration

1. In https://dashboard.stripe.com/test/products create a product called Herocon Membership with monthly recurring **GBP £9.99** pricing. Confirm VAT/tax treatment first; do not assume VAT registration or whether tax is included.
2. Add its TEST price_ identifier to Vercel Production as HEROCON_MEMBERSHIP_TEST_PRICE_ID.
3. Create a Stripe TEST API key at https://dashboard.stripe.com/test/apikeys and add it in Vercel Production as Sensitive STRIPE_SECRET_KEY. Never post it into chat or GitHub.
4. Set HEROCON_MEMBERSHIP_TEST_ENABLED=true in Vercel Production and redeploy.
5. Test subscription, renewal, failure, cancellation, invoice history and account access at https://herocon.store/membership/activate. TEST mode never accepts real money and never unlocks LIVE purchasing.

## LIVE membership status and outstanding verification

1. The merchant confirms the previously exposed STRIPE_LIVE_SECRET_KEY was replaced, and HEROCON_STRIPE_KEY_ROTATED=true is configured. The live Stripe API key's identity, permissions and complete payment cycle have NOT been independently verified by this development session.
2. Confirm the live Stripe account, current VAT/tax obligations, customer cancellation/refund rights, merchant descriptor and missing legal operator information. Stripe's live connected ChatGPT plugin currently exposes TEST mode only.
3. The live recurring Price ID and exact £9.99/month GBP server-side price validation are configured.
4. The live Stripe membership webhook and its private signing secret are configured. Send and verify an actual signed event and confirm the receipt in the private audit ledger.
5. The live Billing Portal ID is installed. Stripe's customer portal was observed with cancel-at-period-end, payment method updates and invoice history enabled; verify the complete customer path.
6. Product ordering, supplier purchasing, warehouse stage-two shipping payment and dispatch release are NOT live. Membership is presented as optional early access/support during buildout; this scope is clearly disclosed. Obtain commercial and legal approval before advertising full sourcing/fulfilment as available.
7. HEROCON_MEMBERSHIP_POLICIES_APPROVED=true and HEROCON_MEMBERSHIP_LIVE_ENABLED=true are already set, with owner-only pilot OFF. Do not misinterpret those flags as independent legal sign-off or evidence of a completed Stripe transaction.

Product and shipping payments remain disabled. Before promoting membership, confirm that the early-access services paid members receive are genuine and clearly described, and handle statutory refunds, cooling-off requests and disputes fairly.

Sources: https://docs.stripe.com/billing/subscriptions/overview ; https://docs.stripe.com/customer-management ; https://docs.stripe.com/webhooks
