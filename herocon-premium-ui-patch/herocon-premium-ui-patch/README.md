# Herocon premium UI patch

This patch preserves the catalogue and existing branding while adding:
- automatic homepage catalogue loading
- internal product routes
- internal seller pages
- multi-image gallery support (`images[]`, backward-compatible with `imageUrl`)
- variants/options when present
- More from this seller
- You may also like
- Herocon-controlled Sugargoo redirect

Apply the files to the matching paths. Append `globals-premium-additions.css` to `app/globals.css`. Do not overwrite `public/herocon-products-import.json`.

Important: the current Sugargoo route still uses the generic registration referral because the catalogue does not yet reliably contain source marketplace/product-specific Sugargoo URLs. Product-specific checkout requires `originalMarketplaceUrl` or `sugargooProductUrl` enrichment.
