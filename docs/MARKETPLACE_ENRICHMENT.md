# Herocon catalogue enrichment without BuckyDrop

## What happened in the initial pilot

The first two Start a Business 1688 links returned `public_metadata_unavailable`. The first two Shop for Yourself Weidian links returned `marketplace_redirected`. These were real results, not successful supplier lookups. Direct HTML pages do not consistently expose SKU, gallery, price or stock. We should not continue blindly through the remaining pages.

## Current workflow

Both Herocon collections already carry canonical 1688, Taobao and Weidian product links. Herocon preserves imported image, variant and description data, and the Shop for Yourself product page now reuses matching records from Start a Business where the **same** normalized supplier URL appears.

The owner enrichment tool at `/enrichment` now shows existing data coverage and **pauses further supplier requests until a product-data API is connected**. It does not repeat the failed server-side HTML approach.

The supported HioBuy option is `POST https://api.hiobuy.com/v1/products/detail` with `{channel,url,language:"en",response_format:"standard"}`. HioBuy's documented standard product response can return supplier title, seller, images, structured product attributes, SKU IDs, prices in CNY and stock. Supplier variant attributes `name`/`value`, plus original-language fallbacks, are normalized into Herocon's variant labels. We use the API with a confirmed marketplace URL only and store a provenance-tagged snapshot in private Vercel Blob.

Public product pages read saved snapshots and existing imported data only, never billable product API calls. Herocon checkout stays disabled until merchant payment and supplier purchasing are independently verified.

## Connect HioBuy (requires account owner)

1. Visit https://developers.hiobuy.com, create a developer account, create an app, and generate an API key.
2. In HioBuy, confirm that **1688** and **Weidian** product details are authorised for the app. Published free trial: 7 days, 100 shared product API units/day, with 1688 and Weidian; Taobao requires an active paid subscription. Product detail usually consumes 1 unit.
3. In Vercel > project **herocon-app** > Settings > Environment Variables, set `HIOBUY_API_KEY` to the issued key, **Production** only, secret/sensitive. Never commit the key or post it in chat.
4. Redeploy the project's current `main` commit (changed environment variables do not retroactively apply to existing running deployments).
5. Sign in with the owner Herocon account and open `https://herocon.store/enrichment?collection=business`, then test a 12-product page. Also test `collection=personal`. An API key being configured does not prove product access or subscription approval; the provider may return precise auth/quota errors.
6. Verify one returned variant's SKU, gallery and CNY price against the supplier before bulk import. Quota, cost and source refresh planning are required for ~4,561 catalogue entries (some supplier URLs may be duplicated).

## Scope, safeguards and future work

The backend accepts a **Herocon product ID and collection**, resolves the canonical marketplace URL server-side, enforces owner authentication and origin checks, and rate-limits per source. API responses are sanitised, saved privately and overlaid without changing original catalogue records. Never accept arbitrary URLs or expose API credentials to browsers.

The current UI is a 12-item owner pilot, not an unattended full-catalogue queue. After a successful live API test, next steps are a durable rate-limited queue, stable SKU provenance, deduplication across collections, per-day API quotas, and safe retry of transient failures.

### Provider sources

- https://hiobuy.com/en/api-docs
- https://hiobuy.com/en/api-docs/product-detail
- https://hiobuy.com/en/api-docs/product-response-models
- https://hiobuy.com/en/api-docs/authentication
