# Herocon production security baseline

Last reviewed: 19 November 2026
Website: https://herocon.store

## Enabled

- **TLS/HTTPS:** Served by Vercel on the custom domain. Site-wide HSTS directs browsers to HTTPS.
- **Browser security headers:** Content-Security-Policy, frame-ancestors none, X-Frame-Options DENY, nosniff, Referrer-Policy, restricted camera/microphone/location permissions, and no X-Powered-By.
- **Origin checks:** Public JSON mutation endpoints check same-origin requests and strictly validate inbound lengths and supported marketplace URLs.
- **Bounded third-party inputs:** Marketplace URLs are canonicalized and allowlisted for exact trusted hosts and product ID formats; arbitrary URLs are not fetched.
- **Private credentials:** Partner APIs, fulfilment controls and Stripe keys remain in server-side environment variables. Never use NEXT_PUBLIC_ prefixes for secrets. Review Vercel project env access and rotate exposed keys.
- **Merchant import:** Protected by a long operator key; the public product-detail POST route does not trigger paid third-party lookups. Imports use the separate authenticated /api/admin/catalogue/import-buckydrop endpoint, with saved-snapshot deduplication.
- **Payments / order submission:** Live recurring membership checkout is enabled with authenticated Stripe-hosted billing and a signed membership webhook. Separate product checkout, second-stage international shipping payment and automated BuckyDrop ordering remain disabled. The membership webhook cannot trigger supplier orders.
- **Customer quote requests:** Authenticated customers can save up to three free, private UK quote enquiries in a rolling day, with their own account-scoped reading, merchant-key-protected review status, and no payment or supplier submission. The general contact page still uses mailto. Quote notifications are prepared for Resend but RESEND_API_KEY is not yet configured.
- **Vercel firewall:** An active deny rule filters common /.git, /.env, wp-admin, wp-login.php and phpmyadmin scanners. Platform DDoS mitigation remains active.
- **Dependency maintenance:** Dependabot is configured for npm and GitHub Actions weekly review.

## 19 November 2026 checkout security update

Checkout quote approvals, TEST Stripe quotes, LIVE Stripe quote sessions, verified paid-order handoff, merchant email and read-only reconciliation have now been implemented with default-off financial flags. The public **product** payment route refuses attempts until the merchant confirms rotated live keys, live product webhook signature, email delivery, manual BuckyDrop supplier-payment mode, final shipping currency/cost and legal compliance. **No product checkout or order-submission launch flags have been enabled.** Live recurring membership billing is separately enabled and is not proof of operational product fulfilment. Review \`LIVE-CHECKOUT-LAUNCH-RUNBOOK.md\` and complete an end-to-end controlled test before any production charge.



1. **No software is guaranteed impossible to hack.** Commission penetration testing and continuous monitoring before paid orders or sensitive customer records are launched.
2. **Supplier API abuse controls:** A Vercel WAF per-IP rate-limit rule was attempted, but rejected with 402 (the per-IP rate-limit key is not included in the current security entitlement). Existing per-instance throttles are best-effort, *not* a reliable distributed budget. Enable a plan-supported shared WAF limiter or a durable central rate limiter before heavy public use.
3. **Content Security Policy:** App Router currently needs inline bootstrap scripts; the policy permits 'unsafe-inline'. Migrate to nonce-based CSP for stronger script-injection resistance, after testing all dynamic and cached routes.
4. **Support form:** Herocon currently uses mailto rather than a server-side delivery service. To allow on-site contact form submissions directly to Outlook, configure a verified sender domain, provider API credential, server-side spam/rate protection and GDPR-compliant retention policy.
5. **Passwords:** Enable multi-factor authentication and least-privilege access on GitHub, Vercel, BuckyDrop, domain registrar and Stripe. Rotate keys previously pasted into chat or other untrusted places. Avoid sharing keys in support email.
6. **Supply-chain review:** Dependabot PRs require review and build/testing. Run npm audit/CodeQL and patch security advisories; perform periodic external scans.
7. **Privacy:** Before accepting live orders, define policies for customer data access, encrypted storage, retention, deletion, incident response, refund/return and UK data-protection notices.
8. **Payment/fulfilment:** Keep live checkout and supplier order submission disabled until successful end-to-end signed webhook, frozen prices, tax/shipping, customer privacy and refund testing.

## Deployment checks

- GET /, /contact, /how-it-works return 200.
- Footer contains Contact us and the Outlook email address.
- GET / responds with CSP, HSTS, X-Frame-Options, nosniff and Referrer-Policy.
- POST /api/buckydrop/product/:id returns 405; GET remains the read-only saved record path.
- POST /api/admin/catalogue/import-buckydrop without a valid admin key returns 401.
- POST /api/buckydrop/lookup with invalid or foreign origin returns 403.
- Test that saved cart/browse/source links and mobile nav still work.

This is a security hardening pass, **not** a certification, penetration test or assurance against all attacks.
