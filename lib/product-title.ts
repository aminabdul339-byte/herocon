import type {Product} from "./types";
import {withoutEmoji} from "./emoji-free";
type Rule=[RegExp,string];
const types:Record<string,Rule[]>={
 "Flowers & Gifts":[[/\b(?:crochet|knitted|wool|yarn)\b.*\b(?:bouquet|flowers?)\b|\b(?:bouquet|flowers?)\b.*\b(?:crochet|knitted|wool|yarn)\b/i,"Crochet Flower Bouquet"],[/\b(?:strawberry bear|teddy bear|plush bear)\b.*\bbouquet\b|\bbouquet\b.*\b(?:bear|plush)\b/i,"Teddy Bear Bouquet"],[/\bsoap flowers?\b/i,"Soap Flower Bouquet"],[/\bchocolate bouquet\b/i,"Chocolate Bouquet"],[/\b(?:dried flower|dry flower)\b/i,"Dried Flower Bouquet"],[/\bbouquet\b/i,"Flower Bouquet"],[/\b(?:gift box|gift set)\b/i,"Gift Set"],[/\b(?:gift bags?)\b/i,"Gift Bag"],[/\b(?:plush|doll|teddy bear)\b/i,"Plush Gift"],[/\b(?:wedding|engagement)\b.*\b(?:ornament|decoration|prop)\b/i,"Wedding Decoration"]],
 "Jewellery":[[/\b(?:earrings?|ear studs?|ear cuffs?)\b/i,"Earrings"],[/\b(?:necklaces?|pendant)\b/i,"Necklace"],[/\b(?:bracelets?|bangles?)\b/i,"Bracelet"],[/\b(?:rings?|signet)\b/i,"Ring"],[/\bbrooch\b/i,"Brooch"]],
 "Wigs & Hair Extensions":[[/\b(?:bun|ponytail)\b.*\b(?:hairpiece|hair piece|wig|hair tie)\b|\b(?:wig|hairpiece)\b.*\b(?:bun|ponytail)\b/i,"Hairpiece"],[/\b(?:bundles?|extensions?|wefts?)\b/i,"Hair Extensions"],[/\bwigs?\b/i,"Wig"]],
 "Hair Accessories":[[/\b(?:claw clips?|hair claws?)\b/i,"Claw Clip"],[/\b(?:scrunchies|hair rings?|hair ropes?|hair ties?|rubber bands?)\b/i,"Hair Tie"],[/\b(?:hair clips?|barrettes?|hairpins?)\b/i,"Hair Clip"],[/\b(?:headbands?|hairbands?)\b/i,"Headband"],[/\b(?:hair bows?|bowknot|bows?)\b/i,"Hair Bow"],[/\b(?:combs?)\b/i,"Hair Comb"]],
 "Nails & Nail Supplies":[[/\b(?:press[ -]?on|wearable|false|fake|removable)\b.*\bnails?\b|\bnails?\b.*\b(?:press[ -]?on|wearable|false|fake)\b/i,"Press-On Nails"],[/\b(?:nail tips?)\b/i,"Nail Tips"],[/\b(?:nail stickers?|nail decals?)\b/i,"Nail Stickers"],[/\b(?:gel polish|nail polish)\b/i,"Nail Polish"],[/\b(?:nail drills?)\b/i,"Nail Drill"],[/\bnail art\b/i,"Nail Art Supplies"],[/\b(?:nail sets?|nails?)\b/i,"Nail Set"]],
 "Beauty & Personal Care":[[/\b(?:makeup|cosmetic|foundation|blush|powder|eyeshadow|eyelash|eyebrow)\s+brush(?:es)?\b/i,"Makeup Brush Set"],[/\b(?:false lashes|eyelashes|lash extensions)\b/i,"False Lashes"],[/\b(?:perfume|eau de parfum|eau de toilette)\b/i,"Fragrance"],[/\b(?:makeup sponges?|beauty blenders?)\b/i,"Makeup Sponge"]],
 "Lighting":[[/\bchandeliers?\b/i,"Chandelier"],[/\b(?:floor lamps?|standing lamps?)\b/i,"Floor Lamp"],[/\b(?:bedside lamps?|table lamps?|desk lamps?)\b/i,"Table Lamp"],[/\b(?:wall lamps?|wall lights?|sconce)\b/i,"Wall Light"],[/\b(?:ceiling lights?|ceiling lamps?)\b/i,"Ceiling Light"],[/\b(?:led light strips?|neon lights?)\b/i,"LED Lighting"],[/\b(?:night lights?|lamps?)\b/i,"Lamp"]],
 "Home & Decor":[[/\b(?:candlesticks?|candle holders?)\b/i,"Candle Holder"],[/\b(?:vases?|flower vessels?)\b/i,"Vase"],[/\b(?:bookends?)\b/i,"Bookends"],[/\b(?:wall art|canvas painting|decorative painting|poster|wall hanging)\b/i,"Wall Art"],[/\b(?:faux books|decorative books)\b/i,"Decorative Books"],[/\b(?:wine vessel|wine glasses|decanter|glassware)\b/i,"Glassware"],[/\b(?:phonograph)\b/i,"Phonograph Ornament"],[/\b(?:sculptures?|figurines?|statues?|ornaments?)\b/i,"Decorative Ornament"],[/\b(?:trays?)\b/i,"Decorative Tray"]],
 "Home Textiles":[[/\b(?:carpet|rug|floor mat)\b/i,"Rug"],[/\b(?:pillowcases?)\b/i,"Pillowcase"],[/\b(?:pillows?|cushions?)\b/i,"Cushion"],[/\b(?:blankets?|throws?)\b/i,"Throw Blanket"],[/\b(?:fitted sheets?|bed covers?)\b/i,"Bed Sheet"],[/\btablecloth\b/i,"Tablecloth"]],
 "Bags":[[/\b(?:backpacks?)\b/i,"Backpack"],[/\b(?:tote bags?)\b/i,"Tote Bag"],[/\b(?:crossbody|cross-body)\b/i,"Crossbody Bag"],[/\b(?:shoulder bags?)\b/i,"Shoulder Bag"],[/\b(?:wallets?|card holders?)\b/i,"Wallet"],[/\b(?:makeup bags?|cosmetic bags?|toiletry bags?)\b/i,"Cosmetic Bag"],[/\b(?:handbags?|bags?)\b/i,"Bag"]],
 "Tops":[[/\b(?:hoodies?|hooded sweatshirt)\b/i,"Hoodie"],[/\bcardigans?\b/i,"Cardigan"],[/\b(?:sweaters?|knitwear|pullover)\b/i,"Sweater"],[/\b(?:sweatshirts?)\b/i,"Sweatshirt"],[/\b(?:t[- ]?shirts?|tees?)\b/i,"T-Shirt"],[/\b(?:shirts?)\b/i,"Shirt"],[/\b(?:tops?|blouses?|base layer)\b/i,"Top"]],
 "Bottoms":[[/\b(?:jeans|denim trousers)\b/i,"Jeans"],[/\bshorts?\b/i,"Shorts"],[/\bskirts?\b/i,"Skirt"],[/\b(?:joggers?|sweatpants)\b/i,"Joggers"],[/\b(?:pants|trousers)\b/i,"Trousers"]],
 "Dresses":[[/\b(?:dress|dresses)\b/i,"Dress"]],
 "Outerwear":[[/\b(?:puffer|down|quilted|padded)\b.*\b(?:jacket|coat)\b/i,"Puffer Jacket"],[/\b(?:vest|gilet)\b/i,"Vest"],[/\b(?:coats?|parkas?)\b/i,"Coat"],[/\bjackets?\b/i,"Jacket"]],
 "Shoes":[[/\b(?:heels?|pumps)\b/i,"Heels"],[/\b(?:trainers?|sneakers?|basketball shoes)\b/i,"Trainers"],[/\bboots?\b/i,"Boots"],[/\b(?:slippers?|slides?)\b/i,"Slippers"],[/\bsandals?\b/i,"Sandals"],[/\bloafers?\b/i,"Loafers"],[/\bshoes?\b/i,"Shoes"]],
 "Fashion Accessories":[[/\b(?:socks?|stockings?)\b/i,"Socks"],[/\bbelts?\b/i,"Belt"],[/\b(?:sunglasses|eyewear)\b/i,"Sunglasses"],[/\b(?:caps?|hats?|beanies?)\b/i,"Hat"],[/\b(?:scarves|scarf)\b/i,"Scarf"]],
 "Electronics & Tech":[[/\b(?:phone|iphone|mobile phone)\b.*\b(?:case|cover)\b/i,"Phone Case"],[/\b(?:headphones?|earphones?|earbuds?|headsets?)\b/i,"Headphones"],[/\b(?:mouse pad|mousepad)\b/i,"Mouse Mat"],[/\b(?:gaming mouse|computer mouse)\b/i,"Computer Mouse"],[/\b(?:keyboards?)\b/i,"Keyboard"],[/\b(?:speakers?)\b/i,"Speaker"],[/\b(?:chargers?|charging head)\b/i,"Charger"]],
 "Storage & Organisation":[[/\b(?:shoe cabinet|shoe box|shoe rack)\b/i,"Shoe Storage"],[/\b(?:laundry basket|laundry hamper)\b/i,"Laundry Basket"],[/\b(?:watch box)\b/i,"Watch Box"],[/\b(?:shelf|shelves|rack)\b/i,"Storage Rack"],[/\b(?:storage box|organizer|organiser)\b/i,"Storage Organiser"]],
 "Packaging & Supplies":[[/\b(?:gift box|ring box|jewelry box|jewellery box)\b/i,"Gift Box"],[/\b(?:courier bags?|shipping bags?|express bags?)\b/i,"Shipping Bags"],[/\b(?:tags?|labels?)\b/i,"Product Labels"],[/\b(?:gift bags?)\b/i,"Gift Bag"],[/\b(?:packaging boxes?)\b/i,"Packaging Box"]],
 "Furniture":[[/\b(?:bedside table|nightstand|bedside cabinet)\b/i,"Bedside Table"],[/\b(?:coffee table|tea table)\b/i,"Coffee Table"],[/\b(?:dressing table|vanity)\b/i,"Dressing Table"],[/\b(?:sofa|couch)\b/i,"Sofa"],[/\b(?:chair|stool)\b/i,"Chair"],[/\b(?:desk)\b/i,"Desk"],[/\b(?:wardrobe|cabinet|sideboard)\b/i,"Cabinet"],[/\bmattress\b/i,"Mattress"]],
 "Home & Kitchen":[[/\b(?:water bottle|thermos|insulated cup|straw cup)\b/i,"Insulated Bottle"],[/\b(?:chopsticks)\b/i,"Chopsticks"],[/\b(?:plates?|tableware)\b/i,"Tableware"]],
 "Watches":[[/\b(?:quartz|mechanical|wristwatch|watch)\b/i,"Watch"]],
 "Underwear & Lingerie":[[/\b(?:boxers?|boxer briefs)\b/i,"Boxer Briefs"],[/\b(?:bra|bras)\b/i,"Bra"],[/\b(?:underwear|panties)\b/i,"Underwear"]],
 "Sleepwear & Loungewear":[[/\b(?:pajamas?|pyjamas?)\b/i,"Pyjamas"],[/\b(?:robe)\b/i,"Robe"]],
 "Toys & Games":[[/\b(?:plush toy|stuffed animal|doll)\b/i,"Plush Toy"],[/\b(?:playing cards|trading cards|booster pack)\b/i,"Trading Cards"]]
};
const features:Rule[]=[
 [/\b(?:bodycon|bandage)\b/i,"Bodycon"],[/\bribbed\b/i,"Ribbed"],[/\b(?:u[- ]neck|scoop neck)\b/i,"Scoop-Neck"],[/\b(?:lace front|front lace)\b/i,"Lace-Front"],[/\bdeep wave\b/i,"Deep-Wave"],[/\b(?:body wave|big wave)\b/i,"Body-Wave"],[/\bcurly\b/i,"Curly"],[/\b(?:bone straight|straight hair)\b/i,"Straight"],[/\b(?:moissanite)\b/i,"Moissanite"],[/\b(?:zirconia|zircon)\b/i,"Zircon"],[/\bheart[ -]shaped\b/i,"Heart-Shaped"],[/\b(?:sterling silver|s925|925 silver)\b/i,"Sterling Silver"],[/\b(?:gold[ -]plated)\b/i,"Gold-Plated"],[/\b(?:pearl)\b/i,"Pearl"],[/\b(?:engagement)\b/i,"Engagement"],[/\b(?:marble)\b/i,"Marble"],[/\b(?:ceramic)\b/i,"Ceramic"],[/\b(?:nordic|scandinavian)\b/i,"Nordic"],[/\b(?:minimalist|minimalistic)\b/i,"Minimalist"],[/\b(?:geometric)\b/i,"Geometric"],[/\b(?:cat)\b/i,"Cat"],[/\b(?:dog)\b/i,"Dog"],[/\b(?:crystal)\b/i,"Crystal"],[/\b(?:sunflower)\b/i,"Sunflower"],[/\b(?:tulip)\b/i,"Tulip"],[/\b(?:rose)\b/i,"Rose"],[/\b(?:mini|pocket[ -]sized)\b/i,"Mini"],[/\b(?:satin)\b/i,"Satin"],[/\b(?:quilted)\b/i,"Quilted"],[/\b(?:leather)\b/i,"Leather"],[/\b(?:camouflage)\b/i,"Camouflage"],[/\b(?:cargo)\b/i,"Cargo"],[/\b(?:waffle knit)\b/i,"Waffle-Knit"],[/\b(?:cotton)\b/i,"Cotton"],[/\b(?:oversized)\b/i,"Oversized"],[/\b(?:zip[ -]up|zipper)\b/i,"Zip-Up"],[/\b(?:long[ -]sleeve)\b/i,"Long-Sleeve"],[/\b(?:short[ -]sleeve)\b/i,"Short-Sleeve"],[/\b(?:magsafe)\b/i,"MagSafe"],[/\b(?:magnetic)\b/i,"Magnetic"],[/\b(?:transparent|clear)\b/i,"Clear"],[/\b(?:foldable)\b/i,"Foldable"],[/\b(?:solid wood)\b/i,"Solid Wood"]
];
const noise=/\b(?:cross[- ]border|foreign trade|factory direct(?: sale| supply| delivery)?|factory supply|wholesale|hot[- ]selling|best[- ]selling|in stock|ships instantly|new model|new style|new fashion|high quality|high[- ]end|light luxury|internet celebrity|european and american|american and european|trendy brand|popular|versatile|fashionable|fashion|202[0-9]|spring and summer|autumn and winter|spring and autumn|for men and women|for women|for men|new arrival|amazon|aliexpress|temu|export|dropshipping)\b/gi;
export function conciseProductTitle(p:Product):string{
 const raw=withoutEmoji((p.displayTitle||p.title||p.originalTitle||"").trim()).replace(/&amp;/gi,"&");
 const plain=raw.replace(/【[^】]*】|\[[^\]]*\]/g," ").replace(/\s+/g," ").trim()||raw;
 const rule=(types[p.category||""]||[]).find(([r])=>r.test(plain));
 if(rule){
  const label=rule[1],picked:string[]=[];
  for(const [pattern,feature] of features){
   if(picked.length>=2)break;
   if(pattern.test(plain)&&!label.toLowerCase().includes(feature.toLowerCase())&&!picked.some(x=>x.toLowerCase().includes(feature.toLowerCase())))picked.push(feature);
  }
  // Avoid visual descriptions unrelated to the main product; categories already
  // constrain the type, and explicit original titles remain in product details.
  if(picked.includes("MagSafe")&&picked.includes("Magnetic"))picked.splice(picked.indexOf("Magnetic"),1);
  if(picked.includes("Bodycon")&&picked.includes("Ribbed"))picked.reverse();
  if(picked.includes("Marble")&&picked.includes("Nordic"))picked.reverse();
  if(picked.includes("Zircon")&&picked.includes("Heart-Shaped"))picked.reverse();
  return [...picked,label].join(" ");
 }
 const cleaned=plain.replace(noise," ").replace(/[!,;:]+/g," ").replace(/\s+/g," ").trim();
 const fallback=cleaned.split(" ").filter(Boolean).slice(0,7).join(" ");
 return fallback||raw.slice(0,70)||p.category||"Product";
}
