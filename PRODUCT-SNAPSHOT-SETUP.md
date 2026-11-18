# Herocon permanent BuckyDrop product snapshots

## Live behaviour

- Herocon stores the **first successful live** BuckyDrop `product/detail` response as one versioned, private Vercel Blob JSON record per canonical source link. No TTL is set; the record remains until manually deleted or storage access is lost.
- Saved title, seller, images (external URLs), description, product attributes, options, supplier SKU prices, stock, minimum order and domestic freight are available to the product page. All of these fields are **historical snapshots** and not binding customer checkout prices.
- Browsing catalogue results and rendering product pages **does not call BuckyDrop**. Product listing links have Next.js prefetch disabled.
- A new product's product page displays **Load & save supplier details**. That user-initiated same-origin `POST /api/buckydrop/product/:id` is throttled per server instance and, for a missing snapshot only, may call the billable supplier API once. The response is stored before reporting success. A non-billable `GET` reads the snapshot only and returns 404 if missing.
- A product-link lookup `POST /api/buckydrop/lookup` also reuses/saves the same snapshot. No whole-catalogue import or automatic batch crawl is enabled.
- Supplier lookup failures (including `70000028`, insufficient account funds) are **not** saved permanently. Visitors can retry by clicking again; no automatic retries occur on page load.
- This is **not a strict global spend cap**: simultaneously visiting a new, never-saved product across several server instances could cause duplicate BuckyDrop lookups; BuckyDrop's API fees are billed the following day. An adversary could also request multiple uncached products. Before traffic scales, implement an authenticated single-flight queue, durable daily quota and a cost limit using an authoritative shared store, and consider restricting supplier imports to merchant action.
- `BLOB_READ_WRITE_TOKEN` is kept server-side. Vercel Blob storage, reads, writes and data transfer have their own fees. Image URLs are recorded, not re-hosted, and may expire or disappear at the source.

## Ordering / stock checks

Herocon must continue to run `queryBuckydropProduct` **fresh** on the server before setting a final GBP checkout price and before supplier fulfilment. It must never use saved snapshot prices, client cart totals or saved stock for a paid order.

Stripe live checkout and BuckyDrop purchases remain disabled. Existing `/api/checkout/readiness` is explicitly user-invoked and still performs live SKU checks.

## Updating a saved snapshot

There is no automatic expiration or refresh. A merchant-only replacement workflow will be needed to update historical snapshots in place after independent cost, data-quality and concurrency controls have been configured.
