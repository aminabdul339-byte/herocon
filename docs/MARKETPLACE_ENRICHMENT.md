# Herocon marketplace-link enrichment (without BuckyDrop)

Both sourcing collections already have their original marketplace URLs:

- **Start a Business:** main canonical catalogue from `getProducts()`.
- **Shop for Yourself:** `personalShopProducts` from the curated personal collection.

The same normalized 1688, Taobao and Weidian URL identifies the saved enrichment record across both collections.

## Pilot workflow

The signed-in owner visits `/enrichment?collection=business` or `/enrichment?collection=personal` and selects **Enrich this page**. Each page checks up to 12 source links sequentially, with a delay and early stop after repeated blocked/no-metadata responses. Already saved links are skipped. An owner-only **Enrich this product** button also appears on product detail pages.

The browser sends only a collection identifier and Herocon product ID to `POST /api/marketplace-enrichment`. Server-side lookup resolves the source URL from Herocon's catalogue; the client cannot supply arbitrary URLs. Every new read is an explicit owner action. Product-page rendering only reads stored snapshots.

## Data sources

1. With no extra API key, the backend tries a bounded GET to the original supplier product page, without cookies, executing scripts, following redirects or bypassing any access controls. It extracts public OG/Twitter metadata and JSON-LD Product data where present. It cannot promise live SKU, stock or price when those are loaded through private marketplace APIs. If the supplier blocks access, the result is an explicit failure; it does not invent details.
2. Optional HioBuy Product Detail API: configure `HIOBUY_API_KEY` as a **server-side Vercel secret** and enable marketplace channels in HioBuy's developer portal. `POST https://api.hiobuy.com/v1/products/detail` receives `{channel,url,language:"en",response_format:"standard"}`. The API can return translated title, description, images, seller, actual variant SKUs, stock and CNY price. Product access depends on the account's channel permissions, trial and subscription; Taobao requires a paid subscription under current published plans.

For API setup, see https://hiobuy.com/en/api-docs and https://hiobuy.com/en/api-docs/product-detail. Keep API credentials server-side; never paste them into public site fields or commit them to GitHub.

## Storage and rendering

Successful provider responses are saved into private Vercel Blob paths under `catalogue/source-enrichment/v1/<sha256-of-canonical-url>.json` with source provenance, retrieval timestamp and sanitized title, gallery, description, specs and optionally SKU/pricing data. Existing catalogue records are left intact. Both product-detail routes load the overlay, use new fields when present and retain saved old data only as fallback. No BuckyDrop API calls are made by this enrichment feature.

**Public display is not a live checkout quote.** Historical marketplace prices, stock and descriptions may change. The site continues to prevent public product checkout until a verified procurement path is connected.

## Safety and scale

- Fixed allowlist of marketplace hosts and canonical URL patterns; no arbitrary URL fetching.
- No redirects, marketplace cookies, challenge-solving or browser impersonation.
- Response size cap 750 KB, timeout 9 seconds for public-page reads and 12 seconds for HioBuy.
- One at a time in owner batch, small delay, 25-second per-link throttle and immediate stop on repeated access blocks.
- Stop at a pilot scale when source pages reject access. Full-catalogue enrichment requires authorised structured product-data APIs and a rate-limited durable queue, not repeated direct HTML scraping.

## Current limitations

This new adapter is **not** yet a full automated catalogue-wide ingestion service. It enriches selected items and owner-invoked small batches; it doesn't background-crawl the whole supplier catalogue. Direct marketplace pages often omit variants/stock or block server-side reads. Full details need a working, authorised product-data key. No supplier order or payment is created.
