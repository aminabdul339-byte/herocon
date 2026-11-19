# Herocon £9.99 monthly membership — launch checklist

Updated 19 November 2026. Subscription code and test billing integrations are built. **No real membership charges are enabled.** Free sign-up and Add to cart remain free; membership is checked only when trying to buy products.

## Built and deployed

- Supabase-verified account required before a subscription session.
- Stripe-hosted recurring subscription Checkout; server validates price is exactly GBP 999 pence per month before creating a payment page.
- Private Vercel Blob mapping from signed-in account UUID to Stripe Customer ID, separate test and live records.
- Read-only Stripe status check (including item billing-period expiry) on every product purchase, so cancellations and failed payments cannot be bypassed by client flags.
- Billing Portal for invoices, payment methods, cancel-at-period-end.
- A separately signed Stripe test/live webhook records subscription, invoice and cancellation events.
- Membership page and purchase gate present Subscribe and Manage billing controls only when the required configuration is complete. Test subscriptions never enable live product orders.

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

## Complete LIVE configuration

1. Rotate previously exposed STRIPE_LIVE_SECRET_KEY, install the new key securely, and only then set HEROCON_STRIPE_KEY_ROTATED=true.
2. Confirm Herocon's actual live Stripe account, tax obligations (including UK VAT if relevant), customer refund/cancellation policy and merchant descriptor.
3. Create a separate LIVE £9.99/month Stripe Price, and set HEROCON_MEMBERSHIP_LIVE_PRICE_ID.
4. Register a separate LIVE webhook at the same route; store its distinct signing secret as HEROCON_MEMBERSHIP_LIVE_WEBHOOK_SECRET.
5. Create a LIVE Billing Portal configuration supporting cancellation, payment methods and invoices; set HEROCON_MEMBERSHIP_LIVE_PORTAL_CONFIGURATION_ID.
6. Complete end-to-end product order and separate warehouse shipping checkout BEFORE charging customers recurring membership for sourcing access.
7. After complete testing, set HEROCON_MEMBERSHIP_POLICIES_APPROVED=true and HEROCON_MEMBERSHIP_LIVE_ENABLED=true. Redeploy and test a controlled live subscription.

Product and shipping payments remain separate and disabled. Never collect £9.99 for a service that cannot be used yet.

Sources: https://docs.stripe.com/billing/subscriptions/overview ; https://docs.stripe.com/customer-management ; https://docs.stripe.com/webhooks
