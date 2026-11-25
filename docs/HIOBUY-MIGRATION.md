# HioBuy migration — 25 November 2026

- New BuckyDrop live product calls, shipping quotes and new order creation are gated off. Historical snapshots and existing order status reads are retained.
- Owner keyword, image and link discovery already uses HioBuy. Public link lookup is saved-only during migration. Do not expose owner search history or enable unlimited paid search on the trial.
- Owner connectivity checks are read-only; no live create/pay calls. Fulfilment permissions, wallet and UK channels still require verification.
- The existing cart references are not order-ready. Resolve each marketplace link with HioBuy, require its fresh opaque product id and variants[].sku_id, explicitly match the customer's selection, and group by channel and seller. Never reuse BuckyDrop SPU or SKU codes. Product API prices are CNY yuan; order/fulfilment amounts are integer fen. Use order preview and review procurement fee, domestic freight, FX, taxes and refunds before a payment.
- Implement durable idempotency, authenticated ownership, verified payment webhooks, order creation/payment, packages, shipping quotes, consolidation and shipment tracking. Validate against the current OpenAPI contract and WH-DEV/sandbox credentials first. Do not blindly retry uncertain payment responses.
- Public search and live checkout require adequate subscription/quota, approved scopes, tested payment and refund lifecycle, wallet funding, customer terms and merchant approval. No data-only catalogue expansion inconsistent with HioBuy acceptable use.

References: https://hiobuy.com/en/api-docs ; https://hiobuy.com/en/guides/fulfillment-integration-guide ; https://hiobuy.com/en/guides/product-ids-search-orders-1688-taobao ; https://hiobuy.com/en/guides/wh-dev-vs-sandbox-warehouse-testing
