# Herocon: Free registration at Add to cart; £9.99 membership only at purchase

## Intended customer experience

- Browsing public products is free; opening a product page is free.
- **Add to cart** checks a verified customer identity. If signed out, the selected seller SKUs and quantities are held for up to 30 minutes in this browser across tabs, and the shopper is redirected to /account. They can **register or sign in for free**. After email verification their pending selection is placed in their user-specific local browser cart. No subscription is required for this action.
- **Buy now** follows the same free sign-up path if needed, then takes the user to /membership/activate. A signed-in shopper can add items without paying.
- **Continue to purchase** from /cart checks that the customer has a currently active membership in the server-owned membership table. The subscription is proposed at **GBP £9.99 per month**; product and later international shipping payments are separate.
- Free account customers without a paid membership can still view and manage their cart. They cannot start a new product purchase.
- **Existing order receipts, warehouse items, QC images, international shipping invoices for existing purchases, refunds, and customer support must remain available even after membership cancellation.** This is a future access-control requirement.
- The current site DOES NOT take real checkout or membership payments; its Stripe live switches remain disabled. The signup UI is wired to Supabase Auth but remains unavailable until the user connects/configures a real Supabase project.

## Authentication setup — external merchant action required

Supabase was suggested for connecting secure customer accounts. It is NOT connected or configured yet. To activate registration:

1. Create or connect the merchant-owned Supabase project. **Enable email confirmation** before signup. Review bot/CAPTCHA, abuse rate limiting, email verification and password policy.
2. Add **server-only** sensitive Production Vercel environment variables:
   - HEROCON_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
   - HEROCON_SUPABASE_PUBLISHABLE_KEY = Supabase publishable/anon key (not service role)
   Use a legitimate merchant-owned project; do not share secrets in chat or the repo.
3. Supabase Auth: set Site URL to https://herocon.store and use an approved production SMTP provider for confirmation/reset mail. In authentication email templates, set **Confirm signup** link to:
   https://herocon.store/api/account/confirm?token_hash={{ .TokenHash }}&type=signup
   Set **Reset password** link to:
   https://herocon.store/api/account/confirm?token_hash={{ .TokenHash }}&type=recovery
   Add https://herocon.store/api/account/confirm to allowed redirect URLs.
4. Redeploy Vercel after variables change. Test creating an account in a private browsing session; check that an email confirmation actually arrives and verifies the browser session. Test login/logout, wrong password, expired link, password reset, pending product restoration, and separate users' carts.
5. Update privacy/data-retention and user deletion policy before inviting customers. The cart is scoped to the verified user ID in the local browser, but is NOT yet synced across devices; a secure account database is needed for server-side cross-device cart history.
6. Test the site fully (mobile included). Do not enable real payment by simply adding identity credentials.

## Membership billing — separate future launch

The migration at supabase/migrations/20261119_herocon_memberships.sql creates the future read-only-to-customers entitlement table with Row Level Security. **Do not apply it to any database without checking backups and access first.**

The membership activation page checks /api/account/membership. Its GET handler returns verified membership active only after:
- HEROCON_MEMBERSHIP_PURCHASE_GATE_ENABLED=true
- HEROCON_STRIPE_MEMBERSHIP_BILLING_READY=true
- the customer has a verified account
- the Supabase database row is supplied by signed Stripe Billing webhook logic and has status active or trialing with non-expired paid period

No membership-subscription checkout or webhook has been deployed. No customer can pay £9.99 yet. This must be built with Stripe recurring subscription creation, a stable Stripe customer mapping, secure webhook subscription/invoice changes, cancellations, upgrades/downgrades, billing portal and UK subscription disclosures. Do not set either flag merely to make a pay button appear.

For a test, use Stripe TEST mode and inspect signed test subscription webhook deliveries before enabling real recurring charges. Never trust client-side session data, email address alone or checkout redirect as proof of entitlement.

## Backend gates

- /api/checkout/start-session requires an authenticated verified user, an active membership record, a quote addressed to their account email, and the existing independent supplier/finance launch gates.
- /api/checkout/readiness requires a free verified user (supplier lookups can have fees).
- Merchant-admin quote approval remains protected by its separate merchant key and does not create customer authentication or a membership.
- Existing customer checkout remains disabled because the two-payment warehouse shipping process, live Stripe webhook, BuckyDrop manual-payment mode and legal checks have not been fully verified.

## Notes

This design follows Supabase password authentication and verified httpOnly cookie sessions. The current implementation uses Supabase Auth REST without needing additional npm packages. It does not self-host or store passwords in Herocon. No Supabase connection exists as of 19 November 2026.

Documentation:
https://supabase.com/docs/guides/auth/server-side
https://supabase.com/docs/guides/auth/passwords
https://supabase.com/docs/guides/auth/rate-limits
https://docs.stripe.com/billing/subscriptions/overview
