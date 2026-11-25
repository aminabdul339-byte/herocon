# Hiobuy fulfilment preview — release gate
Visit /warehouse for the interactive, explicitly simulated customer journey. It uses session storage, not a customer order ledger. No real charge, procurement, shipment or email is sent. Owner tools make actual read-only product parse, order preview and warehouse balance/channel requests when credentials and receiver configuration are available.
 
7% of merchandise only; Chinese domestic shipping included in stage one; international freight in stage two. Provider's 5% is internal. Payment processing and FX can consume the 2% spread.
 
The internal adapter includes documented procurement/create/pay and warehouse/shipment methods, but is deliberately not exposed to customer or Stripe endpoints. Do not enable writes before verifying exact response shapes in a WH-DEV environment.
 
Production blockers: paid plan and Taobao access, approved managed-procurement application, WH-DEV binding, confirmed China receiver, test wallet, durable transactional order storage, user ownership and parcel-level mapping, seller grouping, immutable Stripe quotes and verified signed payment webhooks for both payment stages, idempotent jobs/reconciliation, provider webhook verification and polling, customer/merchant notifications, shipping policy and taxes, production end-to-end pilot. Never use the demo as proof of fulfillment.
 
References: https://hiobuy.com/en/api-docs, https://hiobuy.com/en/api-docs/fulfillment-wh-dev-testing, https://hiobuy.com/en/guides/fulfillment-integration-guide.

## Managed production procurement (updated from provider launch guide)
One checkout may contain many sellers and channels. Group only by fresh provider channel and seller.id. Submit one order per group; retain every order_list[].order_id including partial results. Never pay an uncertain or partially created order without reconciliation. Procurement grouping and order-ID extraction are pure helpers; they are not a live Stripe orchestration pipeline. The source_product_id (not composite id) maps to offer_id; use sku_id as spec_id. Revalidate rotating Taobao IDs at checkout. The current launch guide specifies provider-managed channel credentials and warehouse binding for new integrations, not personal OAuth or manually acquired warehouse codes. Confirm managed receiver behavior and exact Money response contract before enabling a quote or write. Explicit merchandise and domestic amounts are required; do not infer goods from a fee-inclusive payable total. Application approval alone does not mean production activation has completed. 
