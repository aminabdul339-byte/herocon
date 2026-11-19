# Herocon operational readiness and next actions
As checked on 19 November 2026. Do not represent this document as independent legal sign-off, a penetration test or a completed live financial transaction.

## Running / deployed
- Public catalogue and supported 1688/Taobao/Tmall/Weidian product-link lookup, backed by BuckyDrop product-detail API when available.
- Free Supabase email-confirmed accounts, local cart per signed-in user, membership portal access.
- Public optional £9.99/month live recurring Stripe membership checkout, exact price verification and server-side membership entitlement checking. Products and shipping remain separate and unavailable.
- Live Stripe membership webhook endpoint with signature validation and a private event audit ledger. Verify actual delivery in the Stripe Dashboard before claiming full payment lifecycle readiness.
- Stripe-hosted cancellation-at-period-end and self-service payment method / invoice portal, configured in the live dashboard and validated again by the app on a payment attempt.
- Signed-in free, saved customer quote requests with durable private Vercel Blob storage, three per 24h limit, duplicate protection, client-owned history, and merchant-only review state/notes at /admin/checkout.
- Buyer/merchant email notification code for quote requests is installed but disabled operationally until RESEND_API_KEY exists in Vercel Production; no notification is promised in its absence.
- Hardening: origin checks, restricted source URL normalization, account verification, server-only secrets, security headers and private/admin data access. Vercel is configured with basic WAF rules. CI TypeScript check added; builds deploy only when compilation passes.

## Still NOT live
- Product-stage Stripe charges, BuckyDrop Shop Order submission, warehouse intake/QC photo proof, packed-weight validation, independently approved shipping invoices, second-stage international freight Stripe payment, shipping dispatch authorization, actual tracking through delivery, provider returns and refund reconciliation.
- The exact shipping quote currency from BuckyDrop is not documented in the API contract. Existing CNY display is an expressly provisional assumption, not an amount permitted for billing.
- Automatic merchant purchase or supplier settlement is never implied by a BuckyDrop order acceptance.
- A merchant quote does not imply a payable invoice until all verified product checkout conditions are satisfied.

## Merchant/vendor actions that cannot be performed from repo code alone
1. Complete /imprint with the verified sole trader/operator legal name, a lawful UK service/business address and all mandatory business contact disclosures. Do not publish an inferred address.
2. Review actual tax/VAT responsibilities, refunds/cooling-off and consumer subscription terms with a qualified UK adviser. Account for additional subscription legislation when effective.
3. Enable Supabase Auth leaked-password protection: the project's security advisor currently flags this as disabled. Documentation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
4. Install RESEND_API_KEY as a private production secret after creating an appropriate limited-permission Resend sending key, verify notification delivery to both buyer and aminabdul339@outlook.com.
5. Verify one genuine live £9.99 Stripe customer checkout, verify its signed webhook delivery in Stripe Workbench, account membership active status, invoice/receipt, card update, cancellation-at-period-end and expiration after term. Test refunds/chargebacks and webhook retries in Stripe TEST mode before scaling.
6. Ask BuckyDrop in writing: Is manual payment/approval supported for the Solution API account, can purchased goods remain on warehouse hold, can we retrieve order-level QC/warehouse receipt and actual package weight, what is the exact quote currency, which API endpoint or merchant-portal action releases shipping after payment, how long is storage allowed, and what happens to abandoned packages?
7. Test a full low-value supplier order using documented provider permissions, with merchant-authorized funding, no automatic double order, warehouse arrival, verified freight, shipping invoice, payment, dispatch, tracking, lost parcel/return/refund.
8. Only after all of (6)-(7) and end-to-end payment/consumer-policy checks should HEROCON_TWO_STAGE_SHIPPING_READY, HEROCON_ORDER_SUBMISSION_ENABLED and HEROCON_STRIPE_LIVE_CHECKOUT_ENABLED be considered for activation.
9. Move operational checkout and order tracking to a transactional indexed database and add distributed per-account and per-IP abuse protection before significant traffic. Vercel Blob is suitable for the low-volume preliminary enquiry queue but not a complete transactional order management platform.

## Suggested safe user acceptance tests
A. Sign up and verify email -> sign in -> add a product to cart -> return to cart after refresh.
B. Select up to five items -> submit a free UK quote request -> confirm its reference under /account/quotes -> verify another account cannot read it.
C. In /admin/checkout with the independent secret, load requests -> mark reviewing -> add a note -> customer sees the status -> close enquiry.
D. Sign in -> /membership/activate -> confirm £9.99/month and unavailable ordering disclosure -> open Stripe live Checkout -> pay using your own real card only if you intend a real recurring charge -> verify /account membership active -> open portal and cancel at period end -> ensure no immediate entitlement loss.
E. Check that requests to the customer product payment endpoint and supplier order endpoint still return disabled, and that no unapproved supplier order can be created.

## Live release guardrails
- No auto refunds from a mere customer cancellation. Follow the Stripe cancel-at-period-end arrangement and statutory rights.
- Never claim the £9.99 membership buys a functioning product/shipping service until that functionality exists.
- All three product/shipping charge/fulfilment flags remain absent or false until their respective milestones are actually verified.
- Keep screenshots, test timestamps and provider approvals in a private merchant-only log; do not expose keys or personally identifiable records publicly.
