# Herocon — premium real-photo direction

The homepage and two primary journeys use **real photographic stock images**, not AI-generated illustrations or mock-ups. Images were chosen to directly correspond to the original neutral boutique clothing-rail and shipping-cartons concept, while preserving Herocon's warm ivory and sage brand styling.

| Placement | Photographer | Licensed photo page | In-use CDN |
|---|---|---|---|
| Homepage: Shop for Yourself + personal shopping hero | pratik prasad | https://www.pexels.com/photo/clothes-racks-at-store-16470015/ | https://images.pexels.com/photos/16470015/pexels-photo-16470015.jpeg |
| Homepage: Start a Business (warehouse cardboard cartons) | Freek Wolsink | https://www.pexels.com/photo/industrial-warehouse-with-stacked-cardboard-boxes-34221998/ | https://images.pexels.com/photos/34221998/pexels-photo-34221998.jpeg |
| Founder landing: boxes in a minimalist business setting | Hanna Pad | https://www.pexels.com/photo/close-up-shot-of-a-person-holding-a-stack-of-boxes-7552578/ | https://images.pexels.com/photos/7552578/pexels-photo-7552578.jpeg |
| Editorial clothing rail and founder collection | Thom Bradley | https://unsplash.com/photos/clothing-racks-with-neutral-toned-garments-mwa_nzFpnJw | https://images.unsplash.com/photo-1603400521630-9f2de124b33b |

The three Pexels photos are marked **Free to use** at their source pages, subject to the [Pexels License](https://www.pexels.com/license/). The clothing-rail photo uses the [Unsplash License](https://unsplash.com/license). All photography is third-party stock, not Herocon's own warehouse, staff or listed products. Avoid implying otherwise. These assets should never be labelled as a specific supplier's physical products. Always verify any restricted trademarks or identifiable individual usage before a further paid advertising campaign.

## Implementation / verification

- The home entry cards use dark type on pastel cream and sage, masked real photos and clear inset buttons; they link to existing `/shop-for-yourself` and `/start-a-business` routes.
- Each destination keeps its own site functionality; real matching editorial photography has replaced the earlier model/desk image in the hero.
- The existing general catalogue and personal-shopping edit are separate data sources for now. Product searches, agent links, source links and cart behaviour are unchanged.
- Changes are scoped to `app/experience.css` and hero markup, with dedicated mobile layout and reduced-motion support.
- Direct photo CDN endpoints were checked for HTTP 200 / image/jpeg in a Vercel sandbox on 20 November 2026.
- The photos are remotely hosted by `images.pexels.com` and `images.unsplash.com`, with image compression parameters. A future production hardening step can mirror and optimise licensed assets to Herocon-owned hosting to avoid hotlink outages.
- Verify tablet/mobile visual layout, destination links and image loads in a real browser before merging into production.
