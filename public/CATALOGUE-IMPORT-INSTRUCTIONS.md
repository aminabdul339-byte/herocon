# Herocon catalogue import

Upload the most recent Chrome extension export as `public/herocon-products-import.json`.

The file can be either an array of products or an object with a `products` array. The site normalises the v1.4 extraction format, deduplicates by product ID, and only exposes original marketplace links from recognised 1688, Taobao, Tmall and Weidian domains.

For future updates, replace this same file with the latest merged bundle, keeping previous records that have working links. Do not publish browser cookies, authentication tokens, or extension debug/session logs.

Once the file is committed to the main branch, Vercel can build the real homepage, search and product detail pages from it.
