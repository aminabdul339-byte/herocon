# Automatic purchasing for Herocon

## Target experience

Customers select a live verified SKU in Herocon, pay an agreed total, then Herocon automatically purchases it through a procurement partner and tracks receipt, quality check and delivery. Supplier exceptions must not require manual approval on every normal order.

## Existing assets

Herocon's BuckyDrop live product API credentials and product-detail adapter are already configured. The adapter returns SKU codes, current price in CNY, stock and minimum order quantity, but does not create purchase orders. The owner-only automatic-purchasing/preflight endpoint performs an explicit live lookup for a verified product URL, and cannot create or pay for anything.

Fulfillbot's current v1 API can create dropship orders for registered SKUs and offers scheduled auto-purchase. Its older v1/open documentation shows POST /orders for purchase orders with provider productId and skuId; access and support for arbitrary marketplace URLs are unverified.

HioBuy offers POST /v1/products/parse for 1688/Taobao/Weidian, and SKU-specific POST /v1/orders/preview, POST /v1/orders/create with external_order_id, and POST /v1/orders/pay for 1688/Taobao. Its warehouse mode supports international fulfilment. Weidian purchase-order creation is not established by published order-preview docs. Production credentials require developer approval and wallet/warehouse setup; sandbox test keys mock procurement but not shipping.

## Required production phases

1. Lookup original marketplace URL with live partner, refresh prices and variants, identify exact SKU, stock and minimum quantity.
2. Calculate landed price and shipping estimate before accepting payment. Reject missing price and unavailable SKU, don't sell at saved catalogue prices.
3. Create a Herocon merchandise checkout and persist the quote, selected SKU, original link, user ID and shipping address in secure order storage.
4. After a verified Stripe merchandise payment webhook, enqueue one partner purchase, with durable idempotency, spending ceiling, retries, stock/price checks, and a state machine.
5. BuckyDrop path: obtain Solution API order/parcel/shipping endpoint documentation and activation from its partner Control Center; do not guess its request payload.
6. HioBuy fallback: onboard through developers.hiobuy.com, acquire hio_test API key in warehouse mode, test product parse, SKU, preview/create/pay and logistics. Use HioBuy only for channels and products proven supported.
7. Send QC, parcel and international tracking updates into a private My Orders page. Provide refund/replacement logic for exceptions.
8. Test duplicate webhook, seller stock-out, changed price, declined payment, low procurement wallet, UK shipping restrictions, and shipping fee changes, then one low-value real end-to-end order.

## Launch safeguard

All customer purchase buttons stay disabled until live supplier SKU resolution, partner write capability, merchant checkout, order persistence and fulfilment tracking are actually verified. No real procurement or payment is made by the current owner-only supplier preflight.

## Primary documents

BuckyDrop: https://solution-api.buckydrop.com/
HioBuy: https://hiobuy.com/en/api-docs
HioBuy sandbox: https://hiobuy.com/en/api-docs/sandbox
Fulfillbot current: https://docs.fulfillbot.com/developers
Fulfillbot older API: https://app.fulfillbot.com/developer/api-docs/reference
