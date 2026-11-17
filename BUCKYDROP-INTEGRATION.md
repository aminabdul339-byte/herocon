# Herocon / BuckyDrop OpenAPI integration

Implemented from user-supplied BuckyDrop OpenAPI 1.2.6 specification (published 11 November 2026).

## Implemented, disabled by default
- Signed server-side Product Detail Query (POST /api/rest/v2/adapt/openapi/product/detail), using MD5 of appCode + exact JSON body + timestamp + appSecret.
- Fixed endpoint allowlist for sandbox and live gateways.
- Validate source URLs against recorded marketplace providers. Never accept arbitrary user URL input for product lookups.
- Normalise descriptions, photo galleries, CNY list and offer prices, variant options, SKU codes, stock, MOQ, domestic freight and availability.
- Store secrets only in server environment variables. Supplier HTML never renders as trusted HTML.
- Feature-flagged optional detail panel on a Herocon product page.
- GET /api/buckydrop/product/[id] returns a normalised product for an existing Herocon product ID, otherwise an appropriate error. 
- No order creation, cancellation, shipping purchase or checkout is enabled.

## Server-side environment variables
- BUCKYDROP_ENABLE_PRODUCT_LOOKUP: must equal true to enable. Default: OFF.
- BUCKYDROP_ENV: sandbox (default) or live.
- BUCKYDROP_APP_CODE: dedicated BuckyDrop application code.
- BUCKYDROP_APP_SECRET: dedicated BuckyDrop secret; never commit or expose publicly.

Do not enable the integration on a public production site using BuckyDrop shared sandbox credentials. The sandbox contains artificial SAMPLE products and does not support arbitrary real marketplace links. Testing real 1688, Taobao and Weidian listings requires BuckyDrop live authorisation and dedicated live credentials.

## Next steps
1. Verify signed sandbox calls in a controlled private environment with the fixed BuckyDrop sample product SAMPLE-TB-002, using the sample URL from the OpenAPI document.
2. Obtain live credentials, API quota, endpoint permission and commercial redistribution/caching terms from BuckyDrop.
3. Test five approved Herocon source links in the authorised live API. Some live products may lack variants or images.
4. Add per-user throttling and shared server caching before public rollout.
5. Activate the feature flag in Vercel after validation.
6. Separately implement payments, mapping to live SKU codes, UK shipping quotations, order idempotency and verified webhooks before allowing direct sales.

## Verification so far
- TypeScript and Next.js production builds passed.
- With feature flag OFF, the local API returns HTTP 503 and existing Herocon product page still returns HTTP 200 with no BuckyDrop panel.
- Sandbox request from connected Mac failed at the network level; no successful live or sandbox BuckyDrop response has been observed.