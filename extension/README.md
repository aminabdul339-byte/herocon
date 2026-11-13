# Herocon Marketplace Collector v2

This is a **new Chrome extension** for collecting metadata from marketplace product pages that you can open normally. It is not the previous Doppel export extension. It does not crawl automatically or bypass authentication, CAPTCHA, robots rules, or marketplace restrictions.

## Install

1. Download this repository (Code > Download ZIP), unzip it.
2. Chrome > Extensions > Manage extensions > Developer mode > Load unpacked; select the `extension` directory.
3. Click the Herocon extension and import `public/herocon-linked-products-only.json`.
4. Open an original marketplace listing normally (Taobao, Tmall, 1688 or Weidian), log in manually if required, and click **Capture this product**.
5. Repeat on accessible product pages. Click **Export enriched catalogue** to download `herocon-enriched-review.json`.
6. Review captured prices, currencies, shop details, categories and variants before replacing any live catalogue file.

## Limits

- Price and seller extraction are **best effort**, primarily from JSON-LD and HTML metadata. Some sites render those fields only in JavaScript and may yield no data.
- A marketplace URL must match the imported catalogue (by URL or item ID) to prevent attaching details to the wrong product.
- Seller names alone do not create reliable seller IDs; seller grouping needs verified stable shop identifiers.
- No silent bulk browsing, no login automation, and no automatic publication.
- Product details are saved locally in Chrome extension storage. Exports are local JSON files.
- Currency is kept as reported, not converted to GBP.
- This extension has not been tested in the user's logged-in browser.
