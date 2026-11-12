# Herocon final integrated build

Approved preview system implemented as a complete Next.js/TypeScript application:
- editorial homepage
- search/catalogue page
- product page with gallery and variants
- seller pages
- saved products
- agent-neutral chooser and redirect routes
- responsive/mobile layouts

## Catalogue
The application first loads `public/herocon-products-import.json`. If absent, it falls back to the included demo file. Copy the existing production catalogue into `public/herocon-products-import.json`; do not delete or regenerate it.

## Run
```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Agent links
Configure agent templates in `.env.local`. A template receives the URL-encoded original marketplace URL through `{url}`. If no exact link can be resolved, the redirect returns to the product page rather than misleading the customer.

## Remaining data work
The UI supports `images[]`, cleaned `displayTitle`, variants, source marketplace URL and per-agent links. Existing shallow records continue to work, but full details require enrichment.
