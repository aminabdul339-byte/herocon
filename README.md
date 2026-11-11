# HEROCON

Premium product discovery for sourcing from China.

## Status
- Next.js 15 + TypeScript app scaffolded.
- Responsive homepage and catalogue search UI implemented.
- Product catalogue import is **not yet connected**. The app expects the validated JSON export at `public/catalogue.json`.
- This catalogue is a user-supplied Doppel snapshot (12,087 products), not the separate 104/106 Google Sheets directory. Do not describe it as live marketplace data.
- Live provider search, QC images, authentication, payments and affiliate checkout are not enabled.

## Run locally
```bash
npm install
npm run dev
```

## Catalogue
Place the validated product array at `public/catalogue.json`. Each record can contain `canonicalId`, `title`, `price`, `priceGBP`, `category`, `sellerName`, `productUrl`, and `imageUrl`. Keep credentials out of Git.

## Deploy
Import this repository into Vercel with framework preset Next.js and root directory `.`.
