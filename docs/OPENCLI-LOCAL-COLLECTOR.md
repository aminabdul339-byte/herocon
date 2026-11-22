# Herocon OpenCLI marketplace product enrichment

**Purpose:** Collect public information visible in a logged-in Chrome browser
through [OpenCLI](https://github.com/jackwener/OpenCLI), then save it as
**historical, private Herocon catalogue snapshots**. No BuckyDrop product-detail
API calls are made by this workflow.

Upstream OpenCLI source is licensed Apache-2.0 (Copyright OpenCLI contributors).
This integration **invokes the externally installed OpenCLI CLI**; it does
not bundle OpenCLI itself or copy its adapter code. Respect marketplace terms,
content rights, login challenges, and applicable access restrictions.

## Supported channels today

| Channel | Command | Available fields |
| --- | --- | --- |
| 1688 | `opencli 1688 item <url> -f json` | title, seller, photos, CNY prices/price tiers, MOQ, visible attributes |
| 1688 optional | `opencli 1688 assets <url> -f json` | additional main/SKU/detail images visible on page |
| Taobao | `opencli taobao detail <id> -f json` | title, observed CNY price, shop name; photo uses Herocon's existing catalogue image |
| Tmall | Not enabled | No confirmed adapter |
| Weidian | Not enabled | No confirmed adapter |

**Neither 1688 nor Taobao currently yields a reliable, structured SKU list
(complete size/colour combinations with IDs, stock and price).** SKU thumbnails
from `assets` are images, not proof of selectable variants. Do not invent
variant combinations or use these snapshots as checkout authority.

## Merchant Mac setup

1. Install Node.js 20.18.1 or later, Chrome, and OpenCLI:

   ```bash
   node --version
   npm install -g @jackwener/opencli
   opencli doctor
   ```

2. Install the [OpenCLI Browser Bridge extension](https://chromewebstore.google.com/detail/opencli/ildkmabpimmkaediidaifkhjpohdnifk)
   into **your own Chrome**.
3. Sign into 1688.com or Taobao in Chrome normally. Complete any visible
   verification yourself. Never export session cookies or send credentials
   to the Herocon server.
4. Check an item first:

   ```bash
   opencli 1688 item 841141931191 -f json
   # or:
   opencli taobao detail 827563850178 -f json
   ```

5. Set your **existing** merchant catalogue-import key in your Mac Terminal
   without pasting it into chat or committing it. Interactive masked entry:

   ```bash
   read -s HEROCON_CATALOGUE_IMPORT_KEY
   export HEROCON_CATALOGUE_IMPORT_KEY
   ```

6. Run this integration from the Herocon repository root. When testing
   locally, run `npm run dev` in another terminal and use:

   ```bash
   node scripts/opencli-enrich.mjs --site http://localhost:3000 --limit 20 --marketplace 1688 --dry-run
   node scripts/opencli-enrich.mjs --site http://localhost:3000 --limit 20 --marketplace 1688
   ```

   For a deployed **preview of this branch**, replace `--site` with the
   full Herocon preview origin. The preview must have private Blob
   storage and the existing admin key configured. **The production domain
   will not support this integration before its PR is merged.**

   To include extra page-visible photos on 1688, add `--assets`. This
   performs a second browser read of each listing. The default makes only
   one OpenCLI item command per product. Change `--delay-ms` if required;
   it cannot be lower than 3000 ms.

## Design

- `GET /api/admin/opencli?limit=20&marketplace=1688` returns unsaved
  1688/Taobao canonical URLs from Herocon's **existing** catalogue.
- The CLI runs **only on your Mac**, using your logged-in Chrome.
- The CLI validates the original product ID and translates OpenCLI's
  actual JSON output into a constrained record.
- `POST /api/admin/opencli` saves that record, using the existing
  `HEROCON_CATALOGUE_IMPORT_KEY`; unknown links are refused.
- Private Vercel Blob:
  `catalogue/opencli-snapshots/v1/<sha256(canonical-url)>.json`
- Herocon product pages read saved observations and fill missing
  title-independent fields, image galleries, CNY reference price and
  seller information without calling OpenCLI or BuckyDrop.
- Existing catalogue IDs, editorial titles, GBP references, saved
  seller SKU variants and BuckyDrop snapshots remain unchanged.
- Snapshots are **create-only** and are not silently refreshed.
  Replacing a snapshot requires a future explicit merchant refresh workflow.
- The flow makes **no new purchase, fulfilment, shipping or payment actions**.

## Public pasted-product links (no new paid lookups)

The **Paste a product link** page now calls
`POST /api/marketplace/lookup`, not `/api/buckydrop/lookup`. It reads,
in order, the existing catalogue record, an OpenCLI observation and any
already-saved BuckyDrop supplier snapshot. It does **not** call
`queryBuckydropProduct` or perform browser automation.

If an original 1688/Taobao link has not yet been collected, it cannot be
resolved instantly by Vercel. The customer sees a clear unavailable message
instead of a surprise paid API request. Existing catalogue-only products
remain browsable. This is a deliberate initial limitation until a
fully authorised, reliably hosted marketplace-access workflow exists.

The legacy public BuckyDrop lookup now returns 410 for valid links
by default. Restoring billable public lookups requires the explicit
`HEROCON_ALLOW_BILLABLE_PUBLIC_LINK_LOOKUP=true` server setting.
**Do not configure that setting for the free collector workflow.**
Existing BuckyDrop checkout and merchant-only import behaviour is unchanged.

## Cost and operational limits

The OpenCLI software is free and does not charge BuckyDrop API units.
Vercel Blob writes/reads and hosting still follow existing plan pricing,
and marketplace sites can limit automated access or restrict data reuse.
Do not promise free warehousing, shipping or unlimited collection.

The runner defaults to a **20-product test** and cannot request more than 20
products per invocation. It processes sequentially, with a 4-second pause
between products, and stops at security verification or rate limits. No
bypass, anti-bot circumvention, distributed crawling, or bulk parallelism
is implemented.

## Validation checklist

- Run `node --test tests/opencli-enrich.test.mjs`, `npm run typecheck`,
  and `npm run build`.
- Confirm admin queue rejects invalid admin keys.
- Run `--dry-run` on the preview to verify source URL/ID matching.
- Test a **single 1688 item**, then a single Taobao item whose existing
  catalogue photo is available.
- Verify original product page displays recorded seller/CNY data and
  photos with a historical-source disclaimer.
- Confirm a second run skips already saved products and makes no
  BuckyDrop API requests.
- Check inaccessible/login-gated items stop or skip without fake details.
- Do not enable any live product checkout or shipping payment as part
  of this change.

## Why Chrome must run locally

OpenCLI's adapters depend on a logged-in browser and its Browser Bridge.
A Vercel request cannot reach a private Chrome session on your Mac.
This implementation uses a local push worker that submits **only product
observations**, never browser cookies, passwords or session tokens.
