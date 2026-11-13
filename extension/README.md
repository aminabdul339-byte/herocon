# Herocon Doppel Collector v2.1

Automatically collects best-effort product metadata from Doppel pages you browse in Chrome. **No JSON imports are required.** This version replaces the earlier marketplace-page collector.

## Installation

1. Download the repository ZIP from GitHub and unzip it.
2. Open chrome://extensions, enable Developer mode, select Load unpacked, and choose the `extension` folder.
3. If the old extension was already installed, click **Reload** on its card.
4. Open or refresh doppel.fit, browse catalogue pages, open product details and scroll normally.
5. Click the extension icon to see how many records were captured. Click **Export collected products** for a local JSON file.

## Important limitations

- This reads only product data present in the browser's rendered HTML and structured JSON script tags. It does not access private APIs or bypass login and anti-bot restrictions.
- Product variants and marketplace URLs may be absent if Doppel does not expose them in the page's readable metadata.
- Extraction is not verified against the live Doppel page yet. If the counter stays at zero, inspect the actual page markup and update the selectors.
- The extension cannot automatically visit every Doppel listing. It collects pages you browse.
- The export is **not automatically merged into Herocon's live catalogue**. Validate IDs, prices and currencies before publishing.
- Do not export or publish authentication/session data.
