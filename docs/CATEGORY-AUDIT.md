# Herocon catalogue category audit — 16 November 2026

## Scope

Analysed 2372 unique catalogue products. All records now receive one exclusive primary category from the server-side classifier. Existing original marketplace links, product IDs and source files are unchanged.

## Audit findings

- Total records: 2372
- Confidently assigned to a specific category: 2251
- Insufficiently descriptive titles retained in Other: 121
- Tested 21 representative edge cases, including T-shirts, dress, sneakers, shoe rack, ring light, silver ring, hair ring, bags, lighting, bedding and furniture.
- Exact category searches are exclusive; unrelated fuzzy keyword matches and image-file-name matching have been removed.
- Category routes support UK Jewellery and legacy Jewelry spellings.

## Primary category counts

- Tops: 353
- Bottoms: 92
- Dresses: 47
- Outerwear: 131
- Sets & Co-ords: 2
- Underwear & Lingerie: 21
- Sleepwear & Loungewear: 3
- Shoes: 192
- Bags: 309
- Jewellery: 331
- Hair Accessories: 248
- Fashion Accessories: 128
- Watches: 27
- Furniture: 73
- Lighting: 31
- Home Textiles: 43
- Storage & Organisation: 31
- Home & Decor: 109
- Home & Kitchen: 8
- Beauty & Personal Care: 7
- Electronics & Tech: 35
- Sports & Outdoors: 5
- Baby & Kids: 2
- Toys & Games: 12
- Costumes: 8
- Packaging & Supplies: 3
- Other: 121

## Follow-up review

The remaining titles in Other often use opaque seller codes such as Women's Trendy Wear-549 or generic Product names. They cannot be placed in Tops, Shoes or Jewellery without more evidence. See category-review.json for IDs, titles, image URLs and marketplace links requiring visual or supplier-metadata review.

Future harvested products are automatically classified using the same taxonomy. Recheck any newly introduced ambiguous types before adding more keyword rules.