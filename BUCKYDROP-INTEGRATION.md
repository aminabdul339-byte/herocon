# Herocon / BuckyDrop OpenAPI integration

Implemented from user-supplied BuckyDrop OpenAPI 1.2.6 specification (published 11 November 2026).

## Implemented, disabled by default
- Signed server-side Product Detail Query (POST /api/rest/v2/adapt/openapi/product/detail), using MD5 of appCode + exact JSON body + timestamp + appSecret.
- Fixed endpoint allowlist for sandbox and live gateways.
- Validate source URLs against recorded marketplace providers. Never accept arbitrary user URL input for product lookups.
- Normalise descriptions, photo galleries, CNY list and offer prices, variant options, SKU codes, stock, MOQ, domestic freight and availability.
- Store secrets only in server environment variables. Supplier HTML never renders as trusted HTML.
- Feature-flagged integrated seller gallery, SKU-level colour/size selectors, price, stock, supplier identity, domestic freight and product description **inside the primary product page** (with the existing catalogue page retained as a fallback).
- GET /api/buckydrop/product/[id] returns a normalised product for an existing Herocon product ID, otherwise an appropriate error. Successful results are cached server-side for one hour to reduce unnecessary requests; product updates will not be immediate. 
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
4. Review request quotas and introduce per-user throttling / abuse controls before wider rollout. Shared one-hour server caching is already in place.
5. Activate the feature flag in Vercel after validation.
6. Separately implement payments, mapping to live SKU codes, UK shipping quotations, order idempotency and verified webhooks before allowing direct sales.

## Verification so far
- TypeScript and Next.js production builds passed.
- With feature flag OFF, the local API returns HTTP 503 and existing Herocon product page still returns HTTP 200 with no BuckyDrop panel.
- Sandbox request from connected Mac failed at the network level; no successful live or sandbox BuckyDrop response has been observed.
## Product-page interaction
When enabled with live credentials, opening any eligible product page triggers a single asynchronous product-detail lookup via Herocon’s own server. The customer initially sees the existing recorded listing. Successful lookups fill in seller images, grouped options, SKU pricing in CNY, stock figures, domestic shipping, MOQ and description on that same page. If the lookup fails, the saved listing remains available. Selecting a colour or size does not create an order or reserve stock. The existing agent links still open separately; the chosen SKU is **not** automatically transmitted to agents, so the customer must reselect it on their website.
## Customer-entered product-link lookup

The `Paste a product link` interface is available at `/find-product` and via dedicated forms on the homepage and `/search`. It accepts original, fully qualified HTTPS 1688, Taobao, Tmall and Weidian URLs. The product is **not** added to the Herocon catalogue when looked up.

Client flow: `GET /find-product?url=<url>` renders the lookup form; the browser then sends a same-origin JSON `POST /api/buckydrop/lookup` containing `{ "url": "..." }`. The server validates an exact marketplace hostname and product ID path, strips tracking parameters, checks same-origin JSON requests, performs a best-effort per-instance rate limit (eight submissions per minute), and queries BuckyDrop's existing live product-detail API using private Vercel credentials. The returned product data uses the same `ProductExperience` gallery, variants, CNY and approximate GBP reference conversion as catalogue products. No purchasing or payment action is triggered.

Successful product details are cached server-side for one hour. On multi-instance deployments the in-memory limiter is not a global quota: **add shared request throttling / Vercel WAF and usage monitoring before large-scale promotion**. If a supported marketplace link cannot be retrieved, the user sees a friendly error. Short links such as `m.tb.cn/h.*` are not expanded (to avoid redirect SSRF and link-resolution complications); users need to paste the original full listing URL.
## Fast catalogue product pages (November 2026)

Original Herocon catalogue product pages now resolve BuckyDrop seller details and an indicative CNY→GBP reference rate in a streaming **server component**, not with a separate browser lookup after the old saved listing first appears. The product section displays an intentional loading skeleton while the seller API responds, then the enriched seller page directly. The existing `/api/buckydrop/product/[id]` and SSR page share `getCachedBuckydropProduct` (one-hour server cache). Supplier data is not permanently verified; cache entries may be one hour old. On a BuckyDrop error, the saved catalogue listing appears as the fallback after the skeleton. The GBP reference rate is cached by Next.js for six hours. BuckyDrop product images still use `referrerPolicy="no-referrer"` to prevent Alibaba-CDN hotlink issues.

Public navigation keeps the dedicated `/find-product` page, but the paste-a-link form is no longer embedded on the homepage or catalogue search page. Product details and paste-a-link results no longer link out to the original marketplace seller; original URLs are retained server-side for sourcing and optional copying of selected variants.

## Persistent customer-discovered catalogue

A successful POST /api/buckydrop/lookup now checks whether the original marketplace URL is already in the committed catalogue; if not, it saves a compact product summary in the project-linked private Vercel Blob store. Each product uses a deterministic hash-based path (catalogue/discovered/v1/link-ID.json). Duplicate searches reuse the same record. Listings are marked listingStatus=unreviewed, not approved.

The getProducts() loader merges committed JSON records with durable discovered records, so additions appear in Explore Products, their categories and ordinary /product/ID routes. The list cache revalidates every five minutes and is invalidated after a successful save. Each record occupies one Blob object, which provides safe concurrent deduplication. For larger-scale usage replace the per-object list/read model with an indexed relational or key-value database.

BLOB_READ_WRITE_TOKEN is set automatically by the connected private Vercel Blob store and stays server-side. The link-search form discloses that successful searches may be saved to the public catalogue. Monitor provider API costs and Blob operation quotas; the existing per-instance request limit is not a global spam control.

If storage is unavailable, lookup remains functional but the API reports catalogueSave.status=unavailable and the page must not claim the item was saved.