# Herocon internal product-page patch

Changes:
1. `app/page.tsx`: product cards now link to `/product/[id]`, never to `product.productUrl`/Doppel.
2. `app/product/[id]/page.tsx`: new Herocon-branded product page reading the existing `public/herocon-products-import.json` without modifying it.
3. `app/go/sugargoo/[productId]/route.ts`: Herocon-controlled Sugargoo redirect. Configure `SUGARGOO_REFERRAL_URL` in Vercel; current known referral is the fallback.
4. Append `globals-additions.css` to the existing `app/globals.css`.

The original catalogue remains unchanged. The existing external `productUrl` stays in the data but is no longer customer-facing from the catalogue grid.
