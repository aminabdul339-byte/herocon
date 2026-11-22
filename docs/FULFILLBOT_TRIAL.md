# Herocon → Fulfillbot: safe one-product trial

Status: integration prepared on a feature branch; **no order has been placed**.

Herocon already has a read-only Fulfillbot connector and a verified webhook receiver.
This adds one owner-only backend endpoint for a test sourcing quote, without
opening a public checkout or automatically purchasing anything.

## Why a sourcing request comes first

Herocon's imported marketplace URLs (1688, Taobao, Weidian) are not Fulfillbot
inventory product IDs. Under Fulfillbot's current API, the supported first
step for a new linked product is `POST /v1/requests/sourcing`: Fulfillbot
returns a **quote** which the account owner can review/accept in the portal.
Only products already set up in Fulfillbot can be used directly in
`POST /v1/orders/preview` and `POST /v1/orders`.

Official docs:
- https://docs.fulfillbot.com/developers/getting-started
- https://docs.fulfillbot.com/developers/reference/requests
- https://docs.fulfillbot.com/developers/reference/orders

## Production configuration (do not share secrets in chats or commits)

Existing Herocon Vercel project: `herocon-app`.

- `FULFILLBOT_API_KEY`: server-only secret, already present in the
  production environment. Verify this is a current **pak_** API key, has
  API access enabled and `requests:write` scope before a submission.
  A read-only key still supports the connection check but not submit.
- `HEROCON_CHECKOUT_ADMIN_KEY`: existing server-only owner secret;
  requests send it via `x-herocon-admin-key` over HTTPS.
- `FULFILLBOT_TRIAL_SUBMISSION_ENABLED`: **unset/false by default**.
  Set to `true` only when the one-item sourcing submission is approved;
  turn it off again after the trial.

Never put the Fulfillbot key in frontend code or browser localStorage.

## Endpoint (after merging and deploying)

`/api/admin/fulfillbot-trial` uses the same-origin server environment.
The route is not customer-facing and requires the owner key on every request.

### Step 1 — confirm connectivity and permissions (read-only)

Set the `HEROCON_ADMIN_KEY` environment variable locally from your
existing owner secret, without printing its value. Then:

```bash
curl --fail-with-body -sS 'https://herocon.store/api/admin/fulfillbot-trial' \
  -H "x-herocon-admin-key: $HEROCON_ADMIN_KEY"
```

This reports `connected` and `scopes` without exposing the API key.

### Step 2 — preview one real Herocon listing (no Fulfillbot write)

Choose a Herocon product ID with a verified original marketplace URL and
confirm the exact colour/size or SKU on the listing.

```bash
curl --fail-with-body -sS 'https://herocon.store/api/admin/fulfillbot-trial' \
  -H "x-herocon-admin-key: $HEROCON_ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "mode": "preview",
    "productId": "REPLACE_WITH_HEROCON_PRODUCT_ID",
    "specs": "REPLACE_WITH_EXACT_COLOUR_SIZE_OR_SKU",
    "countryCode": "GB"
  }'
```

The response shows a single-item `SHIP_TO_ME` draft sourced **from Herocon's
server catalogue**, not an arbitrary browser-supplied product URL.
It does not submit the draft to Fulfillbot. Prices and stock are not live
and international delivery, tax and fees have not been confirmed.

### Step 3 — submit a sourcing-quote request (explicit opt-in)

Only after confirming the source URL, product, specification and recipient
country, confirm `requests:write` is granted and the production flag
`FULFILLBOT_TRIAL_SUBMISSION_ENABLED=true` is set.

```bash
curl --fail-with-body -sS 'https://herocon.store/api/admin/fulfillbot-trial' \
  -H "x-herocon-admin-key: $HEROCON_ADMIN_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "mode": "submit",
    "confirm": "SEND_FULFILLBOT_QUOTE_REQUEST",
    "productId": "REPLACE_WITH_HEROCON_PRODUCT_ID",
    "specs": "REPLACE_WITH_EXACT_COLOUR_SIZE_OR_SKU",
    "countryCode": "GB"
  }'
```

On success, record `requestId` and `requestNumber` and follow it in the
Fulfillbot portal. The endpoint creates a **request for a quote**, not a
purchase order or an outbound parcel.

This test uses a stable payload-derived idempotency key so a repeated
submission of the exact same request is not duplicated by a typical
idempotent replay. Do not rely on it indefinitely if provider retention
expires. Turn the write flag off again after the trial.

### Step 4 — approve the quote and arrange purchasing (portal)

Inspect quoted product and variant, supplier and destination costs, shipping,
tax and fees. Fulfillbot requires portal action for accepting a quote and
paying purchase orders. There is no true sandbox: these are real account
operations and may commit funds when explicitly approved.

## Safety properties

- Not a customer checkout; no front-end key or generic external URL accepted.
- Existing Herocon admin secret required for GET, preview, and submit.
- No order/payment creation endpoint.
- Submit disabled by default, explicit confirmation string required.
- Exactly one unit per request; exact specifications required if catalogue
  shows multiple variants.
- Only known marketplace domains/URL patterns are accepted.
- Stable idempotency key, bounded request body, no logging of credentials.
- Use the partner webhook receiver for subsequent status changes.
