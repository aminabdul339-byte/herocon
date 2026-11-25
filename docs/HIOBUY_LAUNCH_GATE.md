# Launch gates — 25 November 2026
Current HioBuy policy (27 October 2026): new Sandbox/WH-DEV environments discontinued. Trial includes 1688/Weidian reads, Taobao requires paid plan. Production activation still required for real supplier mutations. Do not use old test-warehouse instructions for new applications.
 
## Owner rehearsal
Visit /warehouse/rehearsal, sign in as the configured owner. Mock mode uses fixed server-owned example products and freight, persistent private Blob event records scoped to verified account ID. No supplier writes, no real address or email, no live payments. State events are immutable. Rehearsal supports one consolidated shipment for the two example seller orders; cross-checkout consolidation remains a production requirement.
 
Optional real Stripe test-mode Checkout: configure STRIPE_SECRET_KEY (sk_test_ only) and HEROCON_HIOBUY_REHEARSAL_STRIPE_ENABLED=true in preview. Set HEROCON_HIOBUY_REHEARSAL_WEBHOOK_SECRET and configure Stripe test webhook /api/hiobuy/rehearsal-webhook. Verify test product and freight payment via signed webhook or independent server retrieval. Do not use live Stripe credentials. Use test card 4242 4242 4242 4242 with future expiry and arbitrary CVC. No HioBuy wallet calls are made.
 
## Production release prerequisites (not yet satisfied)
- Confirm Hiobuy application, plan, scopes, managed account activation, wallet and receiver behavior. Test read-only 1688/Taobao live product IDs and SKU response; verify domestic quotes by seller.
- Implement actual verified live-price checkout for catalogue cart and taxes/FX; 7% merchandise fee only; measure margin after 5% procurement, Stripe fees, FX, refunds and VAT.
- Implement production transactional order ledger and durable outbox/retry/reconciliation, separate purchase records for each verified seller/channel, provider order IDs (all), actual package ownership and cross-checkout consolidation.
- Provider signed webhook and polling, customer emails with durable notification deduplication, live freight quote and packed final payment, tracking, returns/refunds, support and wallet alerts.
- Controlled low-value real order after approval, explicit spend ceiling and authorization. Verify both stages, actual wallet debits, warehouse package, shipment and webhook events before opening checkout.
- Review UK consumer terms, returns, delivery and tax/import disclosures, privacy, restricted products and compliance. No public paid checkout until gates are satisfied.
 
References: https://hiobuy.com/en/guides/hiobuy-platform-update-october-2026 and https://hiobuy.com/en/api-docs/fulfillment-setup.

## Provider event inbox
Endpoint /api/hiobuy/webhook. Configure HIOBUY_WEBHOOK_SECRET and HIOBUY_APP_ID only on the server. Accepts signed portal test events; live events disabled unless HEROCON_HIOBUY_LIVE_EVENT_INBOX=true. Events are deduplicated and persisted privately as pending_reconciliation, not yet applied to customer records. Set up Hiobuy Portal Send test after activation permits webhook configuration. Live ingestion must be followed by a customer-ownership-aware reconciliation consumer and durable notification delivery before launch. See https://hiobuy.com/en/guides/webhooks-demo-cloudflare.
