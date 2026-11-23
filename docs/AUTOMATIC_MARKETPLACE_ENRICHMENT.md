# Herocon automatic product-detail enrichment

**Implemented 23 November 2026.** Product enrichment now runs independently of BuckyDrop through the HioBuy Product Details API. The owner no longer needs to click through pages to enrich them.

## Production scheduling

- The Vercel Cron configuration in `vercel.json` schedules GET `/api/cron/product-enrichment` at **05:15 UTC daily**. Vercel may start the job anywhere within the scheduled hour on Hobby plans.
- Vercel supplies `Authorization: Bearer <CRON_SECRET>`. The server rejects requests without a matching strong, Production-only secret and does not expose it. The secret is a sensitive Vercel environment variable, never committed.
- `maxDuration=240` seconds, in-process runtime guard 210 seconds. Work occurs in batches of up to **3 concurrent HioBuy Product Details calls** and at most **36 source URLs/day**. This is deliberately under the trial's shared allowance to protect credits.
- The worker gets the original links from both `getProducts()` and `personalShopProducts`, normalizes, deduplicates and sorts them by SHA-256. Both collections share one saved source record for matching links.
- It indexes private Blob snapshots under `catalogue/source-enrichment/v1/` and skips sources already enriched. A persisted hash cursor under `catalogue/automatic-enrichment/v1/state.json` allows continuation across days; after a full pass it wraps.
- An immutable per-day run-lock file prevents double runs from simultaneously spending supplier quota. State is checkpointed after every small batch. A failed run is not retried until the next day; the provider rate/quota gate may also stop a run early.
- Taobao/Tmall product reads are skipped until `HIOBUY_TAOBAO_ENABLED=true` is enabled after verifying a paid entitlement. If another marketplace returns `PAID_SUBSCRIPTION_REQUIRED`, `CHANNEL_NOT_AUTHORIZED` or `CHANNEL_CAPABILITY_NOT_SUPPORTED`, that channel is paused for 7 days. Global auth/rate/quota errors stop the run to avoid repeated charges.
- This is a **scheduled daily batch**, not instant enrichment of every product. An existing live HioBuy trial can end after seven days; expanding across thousands of links will require provider-approved production terms, quota and billing. No partner purchase, payment or stock reservation happens.

## Correct product rendering

Saved HioBuy snapshots now feed `ProductExperience` using `toDisplaySupplierDetails`, which preserves the HioBuy source identity and adapts SKU IDs, labels, option attributes, variant prices, images and seller specifications to the existing UI. Source prices and stock remain dated snapshots, not checkout price or inventory guarantees.

The main `/product/[id]` and personal `/shop-for-yourself/[id]` details both pass enriched supplier data and galleries. Visible cards on Start a Business, Search and Shop for Yourself also use saved enrichment photos (index-backed to avoid one missing Blob GET per card). Unrelated base catalogue data is not deleted or overwritten.

## Owner reporting

The private `/enrichment` dashboard now shows distinct source-link progress, last recorded job, counts/errors, channel restrictions and the existing saved details for each displayed product. There is **no requirement to click Enrich this page**. No automatic supplier API calls occur when a customer views the site.

## Validation and follow-up

- Vercel preview Next.js compilation must pass.
- After production deploy, check the Vercel dashboard for the Cron registration and for the first actual run log `[herocon-enrichment-cron]`. Deployment readiness **does not prove that the cron has run**.
- Verify enriched product gallery and exact variant selector for existing six successful HioBuy snapshots, including example source ID `link-5a62bac31c63b6ef21f40b21c186`.
- Revisit quota/contract terms for a larger automatic catalogue import. At 36/day, 4,500 unique links would take months, assuming no subscription blocks or supplier failures.
- For security, rotate HioBuy credentials previously shared in conversation; update the sensitive Vercel environment variable and redeploy, without ever committing the key.
