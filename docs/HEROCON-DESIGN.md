# Herocon — Premium Discovery Design System

**Status:** Implemented for the homepage, November 2026
**Website:** https://herocon.store
**Design reference library:** https://github.com/VoltAgent/awesome-design-md (MIT-licensed community analysis, not original brand guidelines)

## Why this direction

Herocon helps emerging independent businesses discover products from Chinese marketplaces. It should feel more like a thoughtfully edited design magazine than a dashboard or an anonymous dropshipping catalogue.

We examined DESIGN.md analyses from Apple, Airbnb, Shopify and Nike within the open-source awesome-design-md collection. We adapted principles, not another company's trademark, content, illustrations, logo, colors or exact layout.

- **Apple / photography-first hierarchy:** strong hero imagery, generous whitespace, very little decorative chrome.
- **Airbnb / consumer marketplace accessibility:** readable categories, visible search, clear cards and frictionless product discovery.
- **Shopify / creator-commerce storytelling:** editorial storytelling followed by a concrete action to start a business.
- **Nike / confident visual rhythm:** direct headlines and deliberate changes in visual scale, without copying Nike branding.

## Original Herocon tokens

| Usage | Token | Value |
| --- | --- | --- |
| Dark forest action | --hp-forest | #244232 |
| Display ink | --hp-ink | #213629 |
| Warm paper | --hp-cream | #F6F5EF |
| Light canvas | --hp-paper | #FCFCF9 |
| Subtle line | --hp-border | #E0E5DC |
| Sage | --hp-sage | #E7EBE3 |
| Editorial muted gold | --hp-gold | #9D8969 |

### Type and shape

- Editorial headlines: accessible built-in Georgia/Times serif, 400 weight, slight negative tracking. Italics are used sparingly for emphasis.
- Navigation and cards: Arial/Helvetica system sans, clear weight hierarchy.
- Max width: 1400px, with roomy desktop gutters and 17px mobile gutters.
- Buttons: rectangular with subtle 3px radius, minimum 52px target height.
- Product and category photography should take priority over ornament.
- Card images are real existing Herocon assets or saved marketplace partner image URLs; validate licensing and hotlink resilience.

## Homepage architecture

1. **Hero:** brand positioning, primary browse CTA, secondary process CTA, two-image editorial collage.
2. **Search:** obvious search action into the existing real catalogue.
3. **Categories:** four clear starting points, linked to existing filters.
4. **Discovery edit:** actual saved detailed product records, linked to real product pages.
5. **The Herocon Way:** concise discovery, comparison and business-creation steps.
6. **Direct product sourcing CTA:** link to the existing original-product-link lookup.

### Commerce truthfulness

- Do not claim Herocon has purchased, vetted or inspected items merely because seller data was imported.
- Saved partner prices and stock are historical snapshots, not live customer quotes.
- Do not imply Stripe charging or automatic supplier purchases are enabled until the complete checkout is independently verified.
- Preserve the original catalogue prices and data even when partner storage is inaccessible.
- Product images may be hotlinked by upstream sellers and might change or disappear; fallback images are essential.

### Responsive and accessible interaction

- Desktop: two-column editorial hero; four categories and four featured cards per row.
- Tablet: one-column hero, two-column category and product galleries.
- Mobile: readable single-column editorial text, compact two-column shopping images and full-width search.
- Functional forms use action="/search" with named inputs; use real navigation links.
- Images have useful alt descriptions. Honor reduced-motion preferences and keyboard focus.

## Reference material

The upstream README, MIT license and four selected original design-system documents (Apple, Airbnb, Shopify and Nike) have been downloaded into this repository under design-reference/awesome-design-md/. That folder is reference-only and does not ship as a runtime UI dependency. The complete 84-design library is available at https://github.com/VoltAgent/awesome-design-md, and can also be downloaded using GitHub's Code → Download ZIP command.

Upstream copyright and attribution remain with their original owners, per the upstream LICENSE.
