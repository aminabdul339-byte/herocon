# No-login marketplace enrichment: results and safe reuse

## Requirement
No personal login to 1688, Taobao or Weidian; no OpenCLI Chrome extension
login; no manually copying individual products; no paid BuckyDrop/HIOBuy
product-details API; cover **both** Herocon collections.

## Source inventory (23 November 2026)
- Start a Business: about 2,700 base/additional records with about 2,694
  distinct original marketplace links across existing JSON files.
- Shop for Yourself: 2,004 source records, mostly Weidian.
- 29 product links appear in both sources after original-link normalization.
- Some records may already have saved provider details in private Vercel Blob,
  but this report **does not claim** a fresh supplier retrieval.

## Real no-login access trial

GitHub Actions read-only probe on 23 November 2026:
[run 45165889156](https://github.com/aminabdul339-byte/herocon/actions/runs/45165889156).

| Catalogue | Marketplace | HTTP result | Product fields |
|---|---|---|---|
| Start a Business | 1688 | 200, generic page (2,829 B) | none |
| Start a Business | Taobao | 200, generic page (5,365 B) | none |
| Shop for Yourself | Weidian | 301 redirect | none |
| Shop for Yourself | Taobao | 200, generic page (5,365 B) | none |
| Shop for Yourself | 1688 | 200, generic page (2,829 B) | none |

**0 of 5** returned verified public product details (title/image/price
combinations). Generic HTTP 200 pages are not success. We did not follow
cross-site redirects, access logged-in pages, solve challenges, retry
blocked responses, or fetch private product endpoints.

The present anonymous HTTP method **cannot** be assumed to enrich the full
catalogue. Running it thousands of times would waste resources and
risk unnecessary requests to the source sites. No bulk crawl is enabled.

OpenCLI's existing 1688/Taobao adapters expect Chrome/browser access with
a logged-in marketplace session; they do not eliminate that requirement.
There is no equivalent ready-to-use Weidian adapter in the upstream repo.

## Free improvements in this PR

1. Keep the underlying source JSON exactly as it is.
2. Cross-link Start a Business catalogue records to Shop for Yourself
   metadata by the *canonical original marketplace URL*, reusing another
   recorded photograph/CNY reference when genuinely available.
3. Reuse existing private source-enrichment snapshots on visible cards in
   both storefronts, with a cached index so missing records do not cause
   thousands of individual Blob reads.
4. Reuse legacy saved BuckyDrop records only when already present.
5. No source API calls occur just because a user visits a page.
6. No new backend subscription, cookies, scraped credentials, fake SKUs,
   customer payments or order actions.

Private Vercel Blob **storage operations** still follow the current plan
and may count toward existing usage.

## What is not possible from this evidence

This PR does not create 2,000+ verified seller variants, live stock,
fresh photo galleries or current prices. The listing pages themselves
haven't provided the necessary public data.

Full no-login enrichment would require an independently accessible,
authorised and sufficiently complete bulk data source, or an actual
marketplace/provider endpoint with an appropriate free commercial
allowance. Validate its legal data-use permissions, coverage and
cost before connecting it. Do not circumvent authentication or access
restrictions.

## Verify

- `npm run typecheck`
- `node --test tests/public-marketplace-probe.test.mjs`
- Confirm both storefronts render when there are **zero** saved records.
- Verify an already saved enrichment yields photographs/seller fields on
  its listing card and full detail page without a network call upstream.
- Confirm that exact-link merging does not turn historical prices into
  binding checkout prices.
- Keep live purchasing and international shipping payments gated off.
