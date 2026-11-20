# Herocon editorial photography

The new homepage and its two shopping journeys use real, licensed editorial photographs, not generated illustrations.

| Placement | Photographer | Photo | Direct image |
|---|---|---|---|
| Personal shopping hero and home choice card | Mina Rad | https://unsplash.com/photos/woman-in-a-long-beige-coat-stands-on-stairs-2O2cXJemDmo | https://images.unsplash.com/photo-1762605135012-56a59a059e60 |
| Business sourcing hero and home choice card | Filipp Romanovski | https://unsplash.com/photos/woman-working-at-a-desk-with-craft-supplies-ag5H7Nqbf9U | https://images.unsplash.com/photo-1773146916231-e6aeae932080 |
| Editorial clothing rail and business collection | Thom Bradley | https://unsplash.com/photos/clothing-racks-with-neutral-toned-garments-mwa_nzFpnJw | https://images.unsplash.com/photo-1603400521630-9f2de124b33b |

These photos are available under the [Unsplash License](https://unsplash.com/license), which permits many commercial website uses without attribution; credit is included here voluntarily.

**Important:** These are editorial/lifestyle images. They are not photographs of products on sale, Herocon employees, registered suppliers, or Herocon operations, and should never be described that way. Ensure privacy, model/publicity and third-party rights are satisfied for any later brand campaign. All actual product photographs are still provided by the existing catalogue.

## Implementation

- The homepage is at `/`, with prominent links to `/shop-for-yourself` and `/start-a-business`.
- The existing general catalogue and personal-shopping edit remain separate data sources for now. Product searches, source links and cart features remain unchanged.
- Visual styles live in `app/experience.css`, loaded after previous styles for reliable scope and responsive layout.
- Photos are served remotely by `images.unsplash.com` with size and quality parameters. Production teams can locally optimise/host the assets later if uptime or performance requires it.
- Verify desktop, tablet and mobile layouts as part of final release checks.
