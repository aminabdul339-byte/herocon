/**
 * Exclusive primary-product taxonomy for Herocon.
 *
 * Order matters: identify the *product itself*, not incidental words such as
 * "shoe" in "shoe rack", "ring" in "ring light", "top" in "low top sneakers",
 * or "jewellery" in "jewellery storage box".
 */
export const PRIMARY_CATEGORIES=[
 "Tops","Bottoms","Dresses","Outerwear","Sets & Co-ords","Underwear & Lingerie","Sleepwear & Loungewear","Shoes","Bags",
 "Jewellery","Hair Accessories","Wigs & Hair Extensions","Nails & Nail Supplies","Fashion Accessories","Watches",
 "Furniture","Lighting","Home Textiles","Storage & Organisation","Home & Decor","Home & Kitchen","Flowers & Gifts",
 "Beauty & Personal Care","Electronics & Tech","Sports & Outdoors",
 "Baby & Kids","Toys & Games","Costumes","Packaging & Supplies","Pet Supplies","Other"
] as const;
export type PrimaryCategory=typeof PRIMARY_CATEGORIES[number];

const matches=(s:string,re:RegExp)=>re.test(s);
const clean=(title:string)=>(" "+title.toLowerCase().replace(/([a-z])([0-9])/g,"$1 $2").replace(/[^\p{L}\p{N}]+/gu," ").replace(/\s+/g," ").trim()+" ");
const regexCache=new Map<string,RegExp>();
const word=(pattern:string):RegExp=>{let compiled=regexCache.get(pattern);if(!compiled){compiled=new RegExp("\\b(?:"+pattern+")\\b","i");regexCache.set(pattern,compiled)}return compiled;};

/** Legacy source labels are only used when the title offers no reliable evidence. */
function existingFallback(existing?:string):PrimaryCategory {
 const map:Record<string,PrimaryCategory>={
  "Hair Accessories":"Hair Accessories","Wigs & Hair Extensions":"Wigs & Hair Extensions","Nails & Nail Supplies":"Nails & Nail Supplies","Home & Decor":"Other",
  "Jewelry":"Jewellery","Jewellery":"Jewellery","Accessories":"Fashion Accessories",
  "Tops":"Tops","Bottoms":"Bottoms","Dresses":"Dresses","Shoes":"Shoes",
  "Bags":"Bags","Outerwear":"Outerwear","Other":"Other",
  "Furniture":"Furniture","Lighting":"Lighting"
 };
 return map[existing||""]||"Other";
}

export function classifyProduct(title:string,existingCategory?:string):PrimaryCategory{
 const s=clean(title||"");
 if(existingCategory==="Flowers & Gifts")return "Flowers & Gifts";
 // Explicit nail-category imports are source-linked discovery records, not quality-approved merchandise.
 if(existingCategory==="Nails & Nail Supplies")return "Nails & Nail Supplies";
 // Lace wigs and hair extensions are hair products, not generic accessories or clothing.
 if(matches(s,word("(?:wigs?|lace\\s+front(?:als?)?|lace\\s+closures?|hair\\s+extensions?|hair\\s+wefts?|toupees?)")) && !matches(s,word("(?:wig\\s+(?:stands?|holders?|racks?|storage))")))return "Wigs & Hair Extensions";
 if(existingCategory==="Hair Accessories")return "Hair Accessories";
 if(matches(s,word("(?:mobile\\s+phone\\s+bags?|running\\s+phone\\s+bags?|crossbody\\s+phone\\s+bags?)")))return "Bags";
 if(s.trim().length<3)return existingFallback(existingCategory);
 if(matches(s,word("(?:shirts?|blouses?)")) && matches(s,word("dress")) &&
 !matches(s,word("(?:shirt\\s+dress|sweater\\s+dress)")) && s.indexOf(" shirt ")>=0 &&
 s.indexOf(" shirt ")<s.indexOf(" dress "))return "Tops";
 if(matches(s,word("(?:sneakers?|shoes?)")) && matches(s,word("(?:non\\s+shoelace|non\\s+lace|slip\\s+on\\s+design)")))return "Shoes";
 if(matches(s,word("(?:sneakers?|trainers?|boots?|slippers?)")) && matches(s,word("(?:shoes?|footwear)")) && !matches(s,word("(?:shoe\\s+racks?|shoe\\s+cabinets?|shoe\\s+storage)")))return "Shoes";
 if(matches(s,word("(?:sneakers?|trainers?|running\\s+shoes?|casual\\s+shoes?|basketball\\s+shoes?)")) &&
 matches(s,word("(?:shoe\\s+box|original\\s+box)")) && !matches(s,word("(?:shoe\\s+storage|shoe\\s+cabinet|shoe\\s+rack)")))return "Shoes";
 if(matches(s,word("(?:t\\s?shirts?|hoodies?|sweatshirts?|sweaters?|blouses?|polo\\s+shirts?|cardigans?)")) && !matches(s,word("(?:shirt\\s+dresses?|sweater\\s+dresses?|sweater\\s+dress|sweatshirt\\s+dress)")))return "Tops";
 if(matches(s,word("(?:watch(?:es)?|smartwatch(?:es)?|wristwatch(?:es)?|quartz\\s+watch|mechanical\\s+watch)")))return "Watches";
 if(matches(s,word("(?:bluetooth\\s+(?:headsets?|headphones?|earphones?)|wireless\\s+(?:headsets?|headphones?|earphones?)|earphones?|airpods?|charging\\s+(?:cables?|heads?|lines?)|usb\\s+chargers?|bluetooth\\s+pen|capacitive\\s+pen|gaming\\s+mouse|gaming\\s+mice)")))return "Electronics & Tech";
 if(matches(s,word("(?:suitcases?|luggages?|trolley\\s+cases?|trolley\\s+bags?|carry\\s+on\\s+cases?|briefcases?)")))return "Bags";
 if(matches(s,word("(?:scar(?:f|ves)|goggles?|sunglasses?|balaclavas?|neck\\s+warmers?)")))return "Fashion Accessories";
 if(matches(s,word("(?:thermos(?:es)?|insulated\\s+(?:cups?|bottles?)|water\\s+bottles?|drinking\\s+cups?|coffee\\s+mugs?|tumblers?|tablewares?|chopsticks?|cutlery|ashtrays?|knife\\s+rests?|kitchen\\s+utensils?)")))return "Home & Kitchen";
 if(matches(s,word("(?:mattresses?|bed\\s+frames?|bed\\s+bases?)")))return "Furniture";
 if(matches(s,word("(?:wallpapers?|floor\\s+tiles?|flooring\\s+tiles?|home\\s+trash\\s+cans?|laundry\\s+(?:baskets?|hampers?))")))return "Storage & Organisation";
 if(s.includes("台灯")||s.includes("吊灯")||s.includes("壁灯"))return "Lighting";
 if(matches(s,word("(?:dress(?:es)?|gowns?)")) && matches(s,word("(?:evening|bridal|women|strap|satin|bodycon|wedding|fashion)")) && !matches(s,word("(?:decorative\\s+figurine|statue|sculpture|dress\\s+shoes?)")))return "Dresses";
 if(matches(s,word("(?:backpacks?|rucksacks?|schoolbags?)")))return "Bags";
 if(matches(s,word("(?:mobile\\s+phone\\s+bags?|crossbody\\s+bags?|handbags?)"))&&matches(s,word("(?:water\\s+bottles?|insulated\\s+cups?)")))return "Bags";
 if(matches(s,word("(?:children'?s\\s+clothing|children\\s+clothes|kids?\\s+clothing|boys?\\s+clothes|girls?\\s+clothes)")))return "Baby & Kids";
 if(matches(s,word("(?:gift\\s+boxes?|engagement\\s+gift\\s+boxes?|retail\\s+boxes?)")))return "Packaging & Supplies";
 if(matches(s,word("(?:robes?|dressing\\s+gowns?|pyjamas?|pajamas?|loungewear|nightwear|nightgowns?)")))return "Sleepwear & Loungewear";
 if(matches(s,word("(?:game\\s+consoles?|handheld\\s+game\\s+consoles?)")))return "Electronics & Tech";
 if(matches(s,word("(?:gaming\\s+mouse|game\\s+mouse|wireless\\s+mouse|wired\\s+mouse|bluetooth\\s+mouse|gaming\\s+mice)")))return "Electronics & Tech";
 if(matches(s,word("(?:cashmerehat|warmhat)")))return "Fashion Accessories";
 // Household furnishings and fixtures take precedence over marketing qualifiers.
 if(matches(s,word("(?:shoe|coat|hat|jewell?ery|jewellery|jewelry|ring|watch|earring|necklace|handbag|bag|clothes|clothing|towel|broom|pot|pan|dish|book|bookcase|umbrella)\\s+(?:storage\\s+)?(?:racks?|stands?|holders?|organizers?|organisers?|cabinets?|shelves?|shelving|boxes?|cases?|display\\s+stands?)")) ||
    matches(s,word("(?:storage|organizer|organiser|display)\\s+(?:racks?|units?|bins?|baskets?|cabinets?|boxes?|shelves?|shelving|containers?)")) ||
    matches(s,word("(?:clothes|coat|shoe|towel|wall|floor)\\s+(?:hangers?|hooks?|racks?|stands?)")) ||
    matches(s,word("(?:hangers?|shelf|shelves|shelving|drawer\\s+organizers?|storage\\s+bins?|wardrobe\\s+organizers?)")))
   return "Storage & Organisation";

 if(matches(s,word("(?:keychains?|key\\s+rings?|lanyards?)")))return "Fashion Accessories";
 if(matches(s,word("(?:rings?|diamond\\s+rings?)")) && matches(s,word("(?:silver|gold|zircon|moissanite|engagement|wedding|925|sapphire|diamond|jewelry|jewellery|luxury)")) && !matches(s,word("(?:led\\s+ring\\s+light|photography\\s+ring\\s+light)")))return "Jewellery";
 if(matches(s,word("(?:nail\\s+(?:lamps?|dryers?|polish|gel\\s+lamps?)|uv\\s+nail\\s+lamps?)")))return "Beauty & Personal Care";
 if(matches(s,word("(?:led\\s+neon\\s+lights?|neon\\s+lights?|lamps?|chandeliers?|pendant\\s+lights?|ceiling\\s+lights?|wall\\s+lights?|floor\\s+lights?|night\\s+lights?|desk\\s+lights?|ring\\s+lights?|lighting\\s+fixtures?|led\\s+(?:strip|light|fixture)s?|sconces?|light\\s+bulbs?)")))return "Lighting";
 if(matches(s,word("(?:blankets?|throw\\s+blankets?|pillowcases?|pillows?|cushions?|duvets?|bedding|bedsheets?|bed\\s+sheets?|fitted\\s+sheets?|mattress\\s+(?:covers?|protectors?)|bed\\s+covers?|bedspreads?|comforters?|carpets?|rugs?|floor\\s+mats?|doormats?|curtains?|tablecloths?|towels?|sofa\\s+covers?|chair\\s+covers?|quilt(?:s|ed)?|throws?)")) && !matches(s,word("(?:air\\s+cushion|pillow\\s+bags?|towel\\s+bottom\\s+socks?|sofa\\s+cushion\\s+backpack|shoe\\s+cushion)")))return "Home Textiles";
 if(matches(s,word("(?:mousepads?|mouse\\s+pads?|desk\\s+mats?|keyboard\\s+mats?)")))return "Electronics & Tech";
 if(matches(s,word("(?:decorative\\s+paintings?|paintings?|wall\\s+art|posters?|art\\s+prints?|wall\\s+prints?|vases?|ornaments?|sculptures?|statues?|figurines?|candlesticks?|candle\\s+holders?|picture\\s+frames?|photo\\s+frames?|artworks?|mirrors?|flower\\s+pots?|planters?|display\\s+trays?|decorative\\s+trays?|art\\s+trays?|trays?|table\\s+decorations?)")))return "Home & Decor";
 if(matches(s,word("(?:sofas?|armchairs?|chairs?|stools?|desks?|tables?|bedside\\s+(?:tables?|cabinets?|units?)|nightstands?|wardrobes?|bookcases?|bookshelves|shelves?|shelving\\s+units?|cabinets?|dressers?|drawers?|sideboards?|tv\\s+stands?|benches?|recliners?|headboards?|beds?|furniture\\s+sets?)")) &&
    !matches(s,word("(?:table\\s+(?:lamp|cloth|mat|cover|runner)|chair\\s+cover|sofa\\s+(?:cover|cushion|pillow)|bed\\s+(?:sheet|cover|linen|spread|skirt)|shoe\\s+bags?|dining\\s+table\\s+(?:decor|cloth))")))
  return "Furniture";
 if(matches(s,word("(?:packaging\\s+(?:boxes?|bags?|supplies?|materials?)|gift\\s+(?:boxes?|bags?|wrap)|shipping\\s+(?:bags?|boxes?|mailers?)|poly\\s+mailers?|tissue\\s+paper|thank\\s+you\\s+cards?|retail\\s+packaging|parcel\\s+bags?|packing\\s+tape)")))return "Packaging & Supplies";
 if(matches(s,word("(?:hair\\s+(?:clips?|pins?|bands?|ties?|bows?|hoops?|ropes?|claws?|accessories?|ornaments?)|headbands?|hair\\s+rings?|scrunchies|barrettes?|bobby\\s+pins?|duckbill\\s+clips?|shark\\s+clips?|ponytail\\s+(?:clips?|holders?|ties?)|hairpins?|hairbands?|hair\\s+combs?|headpieces?|hair\\s+grips?|hair\\s+flowers?|hair\\s+cards?)")))return "Hair Accessories";
 if(matches(s,word("(?:jewell?ery\\s+(?:boxes?|cases?|holders?|trays?|storage|organizers?|organisers?)|earring\\s+(?:stands?|holders?|organizers?|boxes?)|ring\\s+(?:lights?|binders?|toss|stands?|boxes?|holders?|trays?|lights?))")))return matches(s,word("(?:trays?|stands?|boxes?|cases?|holders?|organizers?|organisers?)"))?"Storage & Organisation":"Lighting";
 if(matches(s,word("(?:watch(?:es)?|smartwatch(?:es)?|watch\\s+(?:bands?|straps?|bracelets?|cases?|boxes?|winders?))")))return "Watches";
 if(matches(s,word("(?:headsets?|earphones?|phone\\s+(?:cases?|covers?|chargers?|holders?|stands?|accessories?)|iphone\\s+(?:cases?|covers?|chargers?)|laptop\\s+(?:stands?|chargers?|cases?)|usb\\s+(?:cables?|chargers?|hubs?)|power\\s+banks?|keyboards?|computer\\s+(?:mice|mouse)|headphones?|earbuds?|bluetooth\\s+speakers?|smart\\s+home\\s+devices?|digital\\s+cameras?|webcams?|gaming\\s+(?:mice|keyboards?|headsets?))")))return "Electronics & Tech";
 if(matches(s,word("(?:pet\\s+(?:toys?|collars?|beds?|bowls?|leashes?|carriers?|clothes|accessories?)|dog\\s+(?:leashes?|collars?|beds?|toys?|harnesses?)|cat\\s+(?:trees?|toys?|beds?|litter\\s+boxes?))")))return "Pet Supplies";
 if(matches(s,word("(?:baby\\s+(?:clothes|jumpsuits?|rompers?|sleepsuits?|bottles?|blankets?|carriers?|bib|bibs|toys?|products?|shoes?)|infant\\s+(?:clothes|rompers?|shoes?|toys?)|newborn\\s+(?:clothes|rompers?|shoes?)|strollers?|prams?|napp(?:y|ies)|diapers?|babywear|kids?\\s+(?:clothes|jumpsuits?|shoes?))")))return "Baby & Kids";
 if(matches(s,word("(?:cosplay|costumes?|masquerade|fancy\\s+dress|superhero\\s+suits?|halloween\\s+(?:outfits?|costumes?|masks?)|leotards?\\s+cosplay|disguises?)")))return "Costumes";
 if(matches(s,word("(?:plush\\s+toys?|stuffed\\s+animals?|figurine\\s+toys?|building\\s+blocks?|dolls?|action\\s+figures?|model\\s+toys?|toy\\s+cars?|fidget\\s+toys?|board\\s+games?|puzzles?|toys?)"))&&!matches(s,word("(?:toy\\s+(?:storage|organizer|cabinet|rack))")))return "Toys & Games";
 if(matches(s,word("(?:belts?|keychains?|key\\s+rings?|lanyards?)")))return "Fashion Accessories";
 if(matches(s,word("(?:hoodies?|sweatshirts?|t\\s?shirts?)")) && !matches(s,word("(?:shirt\\s+dress|sweatshirt\\s+dress)")))return "Tops";
 if(matches(s,word("(?:two\\s+piece\\s+(?:sets?|suits?|outfits?)|three\\s+piece\\s+sets?|co\\s+ord\\s+sets?|matching\\s+sets?|sweatshirt\\s+and\\s+pants\\s+sets?|jacket\\s+and\\s+pants\\s+sets?|tracksuits?|outfit\\s+sets?)")) &&
 !matches(s,word("(?:sofa\\s+sets?|dining\\s+table\\s+sets?|furniture\\s+sets?)")))return "Sets & Co-ords";
 if(matches(s,word("(?:earrings?|ear\\s+studs?|necklaces?|pendants?|bracelets?|bangles?|anklets?|chokers?|brooches?|jewell?ery\\s+sets?|jewell?ery|moissanite\\s+rings?|engagement\\s+rings?|wedding\\s+rings?|finger\\s+rings?|signet\\s+rings?|sterling\\s+silver\\s+rings?|zircon\\s+rings?)")) ||
    (matches(s,word("rings?"))&&!matches(s,word("(?:key\\s+rings?|phone\\s+rings?|ring\\s+lights?|rings?\\s+(?:light|binder|toss|stand|holder|box|tray|hook)|curtain\\s+rings?|rings?\\s+pulls?|rings?\\s+handle|ring\\s+fit)"))))
  return "Jewellery";
 if(matches(s,word("(?:underwear|underpants?|boxer\\s+briefs?|briefs?|boxers?|panties|lingerie|bras?|bralettes?|thongs?)")) &&
 !matches(s,word("(?:briefcases?|brackets?)")))return "Underwear & Lingerie";
 if(matches(s,word("(?:handbags?|shoulder\\s+bags?|tote\\s+bags?|crossbody\\s+bags?|backpacks?|rucksacks?|purses?|wallets?|duffel\\s+bags?|clutch\\s+bags?|messenger\\s+bags?|satchels?|weekender\\s+bags?|computer\\s+bags?|laptop\\s+bags?|gym\\s+bags?|makeup\\s+bags?|cosmetic\\s+bags?|travel\\s+bags?|school\\s+bags?|bags?)"))&&!matches(s,word("(?:shopping\\s+bag\\s+holder|storage\\s+bag\\s+rack|gift\\s+bag|packaging\\s+bag|air\\s+bag|vacuum\\s+bag|bin\\s+bag|garbage\\s+bag)")))return "Bags";
 // Footwear before tops, bottoms and garments ("low top shoe", "shoe shorts").
 if(matches(s,word("(?:sneakers?|trainers?|running\\s+shoes?|basketball\\s+shoes?|sports\\s+shoes?|casual\\s+shoes?|leather\\s+shoes?|dress\\s+shoes?|canvas\\s+shoes?|loafers?|boots?|booties?|sandals?|slippers?|heels?|stilettos?|mules?|clogs?|ballet\\s+flats?|footwear|shoes?|flip\\s+flops?)")) &&
    !matches(s,word("(?:shoe\\s+(?:rack|cabinet|holder|storage|bag|box|tree|organizer|organiser|cover|lace)|shoelaces?|shoe\\s+cleaner|shoe\\s+changing\\s+stool)")))
   return "Shoes";
 // A dress is a dress, even if marketed with "shirt", "sweater", "skirt" or "tank top".
 if(matches(s,word("(?:dress(?:es)?|bodycon\\s+dresses?|sundresses?|maxi\\s+dresses?|mini\\s+dresses?|midi\\s+dresses?|shirt\\s+dresses?|sweater\\s+dresses?|slip\\s+dresses?|gowns?|evening\\s+gowns?|wedding\\s+dresses?)")) &&
    !matches(s,word("(?:dress\\s+shoes?|dress\\s+shirts?|dressing\\s+tables?|dress\\s+up\\s+costumes?)")))
   return "Dresses";
 if(matches(s,word("(?:jackets?|coats?|overcoats?|trench\\s+coats?|blazers?|parkas?|puffers?|windbreakers?|down\\s+jackets?|denim\\s+jackets?|bomber\\s+jackets?|raincoats?|gilets?)")) &&
    !matches(s,word("(?:jacket\\s+and\\s+(?:pants?|trousers?|skirt)|coat\\s+rack|coat\\s+hanger|coat\\s+hook)")))return "Outerwear";
 if(matches(s,word("(?:two\\s+piece\\s+sets?|two\\s+piece\\s+suits?|three\\s+piece\\s+sets?|co\\s+ords?|matching\\s+sets?|tracksuits?|jogging\\s+suits?|sweatshirt\\s+(?:and|with)\\s+(?:pants?|shorts?)|top\\s+and\\s+(?:pants?|skirt)|shirt\\s+and\\s+shorts|blazer\\s+and\\s+(?:pants?|skirt)|outfit\\s+sets?|clothing\\s+sets?|suit\\s+sets?)")))return "Sets & Co-ords";
 if(matches(s,word("(?:jeans|trousers?|pants?|shorts|skirts?|leggings?|joggers?|sweatpants?|cargo\\s+pants?|slacks?|denim\\s+pants?|boxer\\s+shorts?|underpants?|briefs?)")))return "Bottoms";
 if(matches(s,word("(?:hoodies?|sweatshirts?|t\\s?shirts?|tees?|shirts?|blouses?|sweaters?|jumpers?|cardigans?|knitwear|tops?|polos?|jerseys?|vests?|tank\\s+tops?|crop\\s+tops?|pullovers?|long\\s+sleeve\\s+tops?|base\\s+layers?)")) &&
    !matches(s,word("(?:low\\s+top\\s+(?:shoes?|sneakers?)|high\\s+top\\s+(?:shoes?|sneakers?)|table\\s+top|counter\\s+top|desktop|lap\\s+top|top\\s+clip|top\\s+handle\\s+bag|top\\s+loader|tank\\s+top\\s+dress)")))return "Tops";
 if(matches(s,word("(?:belts?|sunglasses?|glasses?|goggles?|scar(?:f|ves)|shawls?|hats?|caps?|beanies?|gloves?|mittens?|ties?|bow\\s+ties?|socks?|stockings?|keychains?|key\\s+rings?|lanyards?|wallet\\s+chains?|shoe\\s+laces?|shoelaces?)")))return "Fashion Accessories";
 if(matches(s,word("(?:makeup|cosmetics?|lipsticks?|eyeliners?|eyeshadow|mascaras?|nail\\s+(?:art|polish|tools?|lamps?)|manicures?|beauty\\s+tools?|perfumes?|fragrances?|skincare|face\\s+creams?|hair\\s+dryers?|hair\\s+straighteners?|hair\\s+curlers?|eyelash(?:es)?|false\\s+nails?|combs?|hairbrushes?|makeup\\s+brushes?)")))return "Beauty & Personal Care";
 if(matches(s,word("(?:yoga\\s+mats?|resistance\\s+bands?|dumbbells?|weights?|gym\\s+(?:equipment|accessories)|fitness\\s+(?:equipment|accessories)|sports\\s+equipment|football\\s+balls?|basketballs?|badminton\\s+rackets?|tennis\\s+rackets?|camping\\s+gear|hiking\\s+(?:gear|poles?)|outdoor\\s+equipment)")))return "Sports & Outdoors";
 if(matches(s,word("(?:vases?|ornaments?|decorations?|decor|decorative|sculptures?|statues?|figurines?|candlesticks?|candle\\s+holders?|candles?|paintings?|wall\\s+art|posters?|art\\s+prints?|wall\\s+prints?|picture\\s+frames?|photo\\s+frames?|artworks?|mirrors?|flower\\s+pots?|planters?|trays?|desk\\s+ornaments?|tabletop\\s+decor|home\\s+accessories?)")))return "Home & Decor";
 if(matches(s,word("(?:short\\s+sleeves?|long\\s+sleeves?|thermal\\s+longsleeves?|longsleeves?)")) && !matches(s,word("(?:pants?|skirts?|dresses?|jackets?|coats?)")))return "Tops";
 if(matches(s,word("(?:footballs?|basketballs?)")) && !matches(s,word("(?:shirts?|jerseys?|clothing|apparel|hoodies?|shorts?|shoes?|backpacks?)")))return "Sports & Outdoors";
 // Explicit category only as a conservative fallback on opaque supplier titles.
 return existingFallback(existingCategory);
}

export const CATEGORY_ALIASES:Record<string,PrimaryCategory>={
 "top":"Tops","tops":"Tops","shirt":"Tops","shirts":"Tops","tshirt":"Tops","tshirts":"Tops","hoodie":"Tops","hoodies":"Tops","sweater":"Tops","sweaters":"Tops",
 "bottom":"Bottoms","bottoms":"Bottoms","pants":"Bottoms","trousers":"Bottoms","jeans":"Bottoms","skirts":"Bottoms","shorts":"Bottoms",
 "dress":"Dresses","dresses":"Dresses","gown":"Dresses","gowns":"Dresses",
 "jacket":"Outerwear","jackets":"Outerwear","outerwear":"Outerwear","coats":"Outerwear",
 "set":"Sets & Co-ords","sets":"Sets & Co-ords","co-ords":"Sets & Co-ords","outfits":"Sets & Co-ords",
 "shoe":"Shoes","shoes":"Shoes","sneaker":"Shoes","sneakers":"Shoes","trainer":"Shoes","trainers":"Shoes","boots":"Shoes","footwear":"Shoes",
 "bag":"Bags","bags":"Bags","backpacks":"Bags","handbags":"Bags",
 "jewelry":"Jewellery","jewellery":"Jewellery","jewelery":"Jewellery","jewel":"Jewellery","rings":"Jewellery","ring":"Jewellery","necklaces":"Jewellery","earrings":"Jewellery","bracelets":"Jewellery",
 "nails":"Nails & Nail Supplies","nail":"Nails & Nail Supplies","nail supplies":"Nails & Nail Supplies","nail art":"Nails & Nail Supplies","press on nails":"Nails & Nail Supplies","wig":"Wigs & Hair Extensions","wigs":"Wigs & Hair Extensions","lace wigs":"Wigs & Hair Extensions","hair extensions":"Wigs & Hair Extensions","hair":"Hair Accessories","hair accessory":"Hair Accessories","hair accessories":"Hair Accessories","hair clips":"Hair Accessories","scrunchies":"Hair Accessories","headbands":"Hair Accessories",
 "accessories":"Fashion Accessories","fashion accessories":"Fashion Accessories","watch":"Watches","watches":"Watches",
 "home":"Home & Decor","home decor":"Home & Decor","home décor":"Home & Decor","decor":"Home & Decor",
 "furniture":"Furniture","sofa":"Furniture","sofas":"Furniture","chair":"Furniture","chairs":"Furniture","table":"Furniture","tables":"Furniture","lighting":"Lighting","lamp":"Lighting","lamps":"Lighting","home textiles":"Home Textiles","bedding":"Home Textiles","rug":"Home Textiles","rugs":"Home Textiles","blanket":"Home Textiles","blankets":"Home Textiles","cushion":"Home Textiles","cushions":"Home Textiles",
 "storage":"Storage & Organisation","storage and organisation":"Storage & Organisation",
 "beauty":"Beauty & Personal Care","electronics":"Electronics & Tech","sports":"Sports & Outdoors","kids":"Baby & Kids","baby":"Baby & Kids",
 "toys":"Toys & Games","costumes":"Costumes","flowers":"Flowers & Gifts","gifts":"Flowers & Gifts","flowers and gifts":"Flowers & Gifts","packaging":"Packaging & Supplies","luggage":"Bags","underwear":"Underwear & Lingerie","sleepwear":"Sleepwear & Loungewear","home kitchen":"Home & Kitchen","pets":"Pet Supplies","other":"Other"
};
export const resolveCategory=(v:string):PrimaryCategory|undefined=>
 PRIMARY_CATEGORIES.find(c=>c.toLowerCase()===v.trim().toLowerCase())||
 CATEGORY_ALIASES[v.trim().toLowerCase()];