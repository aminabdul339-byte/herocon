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

const editorialNames:Record<string,string>={
 "link-c98a18758ce75c64bc7154e2a4ba":"Green Crochet Tulip Bouquet",
 "AT6_zzBm508ztj8-E5rLyw":"Vintage Cross Pendant Necklace",
 "z-L84zDeWbvLylAM-xudhQ":"Antique-Style Skull Ring",
 "Oy8LqptROwvpmzKqjxgpsw":"Cushioned Lounge Armchair",
 "oVT-dBUgBgimLvgPpib1gA":"Geometric Print Card Holder",
 "EOh7f7a2YmF2MD6mBg5g9w":"Backless Halter-Neck Slit Dress",
 "QdCtw6poCdD0NO2yL9QT-Q":"Square-Neck Slit Dress",
 "YjXAnN1cosMO1iGVWJw5FA":"Ribbed Bodycon Mini Dress",
 "-V4SGku_-0w-sRsds6WXPA":"Monogram Sleeveless Knit Dress"
};
const categoryFeatures:Record<string,Rule[]>={
 "Dresses":[[/\bbackless\b/i,"Backless"],[/\b(?:halter[ -]neck|hanging neck)\b/i,"Halter-Neck"],[/\b(?:square[ -]neck|one-neck)\b/i,"Square-Neck"],[/\b(?:high[ -]slit|high split)\b/i,"High-Slit"],[/\b(?:slit|split hip)\b/i,"Slit"],[/\b(?:spaghetti strap|suspender|sling)\b/i,"Strappy"],[/\bstrapless\b/i,"Strapless"],[/\bruched\b/i,"Ruched"],[/\ba[ -]line\b/i,"A-Line"],[/\bpolka[ -]dot\b/i,"Polka-Dot"],[/\b(?:monogram|full letter)\b/i,"Monogram"],[/\b(?:knit|knitted|knitwear|sweater dress)\b/i,"Knit"],[/\bdenim\b/i,"Denim"],[/\blace\b/i,"Lace"],[/\bmesh\b/i,"Mesh"],[/\bpolo collar\b/i,"Polo-Collar"],[/\bfloral\b/i,"Floral"],[/\b(?:evening dress|evening gown)\b/i,"Evening"],[/\b(?:tennis dress|tennis skirt)\b/i,"Tennis"],[/\b(?:buttoned|gold button|button wool)\b/i,"Button-Detail"],[/\bwool\b/i,"Wool"],[/\b(?:sleeveless|tank dress|vest dress)\b/i,"Sleeveless"],[/\blong[ -]sleeve(?:d)?\b/i,"Long-Sleeve"],[/\bshort[ -]sleeve(?:d)?\b/i,"Short-Sleeve"],[/\b(?:maxi|long dress)\b/i,"Maxi"],[/\b(?:mini dress|short dress)\b/i,"Mini"],[/\b(?:midi|knee[ -]length)\b/i,"Midi"],[/\bpleated\b/i,"Pleated"],[/\b(?:hollow[ -]out|cut[ -]out)\b/i,"Cut-Out"],[/\bslim[ -]fit\b/i,"Slim-Fit"]],
 "Tops":[[/\b(?:graphic|printed|print)\b/i,"Graphic"],[/\b(?:striped|stripes)\b/i,"Striped"],[/\bfur collar\b/i,"Fur-Collar"],[/\b(?:washed|gradient)\b/i,"Washed"],[/\b(?:heavyweight|[23]\d\d\s*g)\b/i,"Heavyweight"],[/\b(?:oversized|loose[ -]fitting)\b/i,"Oversized"],[/\bembroidered\b/i,"Embroidered"],[/\b(?:polo collar|polo shirt)\b/i,"Polo"],[/\b(?:cropped|crop top)\b/i,"Cropped"],[/\b(?:retro|vintage)\b/i,"Vintage"],[/\bshort[ -]sleeve(?:d)?\b/i,"Short-Sleeve"],[/\blong[ -]sleeve(?:d)?\b/i,"Long-Sleeve"]],
 "Bottoms":[[/\bwide[ -]leg\b/i,"Wide-Leg"],[/\b(?:straight[ -]leg|straight pants)\b/i,"Straight-Leg"],[/\b(?:washed|distressed)\b/i,"Washed"],[/\b(?:cargo|multi[ -]pocket)\b/i,"Cargo"],[/\bdrawstring\b/i,"Drawstring"],[/\bhigh[ -]waisted\b/i,"High-Waisted"],[/\b(?:running|training)\b/i,"Running"],[/\bpleated\b/i,"Pleated"],[/\braw denim\b/i,"Raw Denim"]],
 "Bags":[[/\b(?:crocodile pattern|croc pattern)\b/i,"Croc-Pattern"],[/\bwoven\b/i,"Woven"],[/\bquilted\b/i,"Quilted"],[/\bmonogram\b/i,"Monogram"],[/\blarge[ -]capacity\b/i,"Large-Capacity"],[/\btravel\b/i,"Travel"],[/\b(?:sports|gym|fitness)\b/i,"Sports"],[/\bchain strap\b/i,"Chain-Strap"],[/\bcanvas\b/i,"Canvas"],[/\bnylon\b/i,"Nylon"]],
 "Jewellery":[[/\b(?:cuban chain|cuban link)\b/i,"Cuban-Link"],[/\bcross\b/i,"Cross"],[/\b(?:beaded|beads)\b/i,"Beaded"],[/\bhoop\b/i,"Hoop"],[/\b(?:stud earrings|ear studs)\b/i,"Stud"],[/\b(?:teardrop|water drop)\b/i,"Teardrop"],[/\bbutterfly\b/i,"Butterfly"],[/\b(?:tennis bracelet|tennis necklace)\b/i,"Tennis"],[/\badjustable\b/i,"Adjustable"],[/\bwoven\b/i,"Woven"],[/\bstainless steel\b/i,"Stainless Steel"]],
 "Shoes":[[/\b(?:air[ -]cushion|air sole)\b/i,"Air-Cushioned"],[/\b(?:platform|thick[ -]sole)\b/i,"Platform"],[/\bpointed[ -]toe\b/i,"Pointed-Toe"],[/\bhigh[ -]top\b/i,"High-Top"],[/\blow[ -]top\b/i,"Low-Top"],[/\bsnow boots\b/i,"Snow"],[/\brunning\b/i,"Running"],[/\bbasketball\b/i,"Basketball"],[/\bsuede\b/i,"Suede"],[/\bmesh\b/i,"Mesh"],[/\b(?:bridal|wedding shoes)\b/i,"Bridal"]],
 "Outerwear":[[/\bhooded\b/i,"Hooded"],[/\bwaterproof\b/i,"Waterproof"],[/\bwindproof\b/i,"Windproof"],[/\bfleece\b/i,"Fleece"],[/\bbomber\b/i,"Bomber"],[/\breflective\b/i,"Reflective"],[/\bdenim\b/i,"Denim"],[/\bwool\b/i,"Wool"]],
 "Hair Accessories":[[/\bacetate\b/i,"Acetate"],[/\bshark clip\b/i,"Claw"],[/\bduckbill\b/i,"Duckbill"],[/\bpearl\b/i,"Pearl"],[/\brhinestone\b/i,"Rhinestone"],[/\bmonogram\b/i,"Monogram"],[/\bmetal\b/i,"Metal"],[/\bfloral\b/i,"Floral"]],
 "Wigs & Hair Extensions":[[/\bpixie\b/i,"Pixie"],[/\bbob\b/i,"Bob"],[/\bbraided\b/i,"Braided"],[/\b(?:kinky curly|small curly)\b/i,"Kinky-Curly"],[/\b(?:human hair|real hair)\b/i,"Human Hair"],[/\bsynthetic\b/i,"Synthetic"],[/\bponytail\b/i,"Ponytail"],[/\bbun\b/i,"Bun"]],
 "Fashion Accessories":[[/\bbaseball cap\b/i,"Baseball"],[/\b(?:knitted|woolen|wool)\b/i,"Knit"],[/\bfootball\b/i,"Football"],[/\bbasketball\b/i,"Basketball"],[/\b(?:sports socks|running socks)\b/i,"Sports"],[/\b(?:grip|silicone)\b/i,"Grip"],[/\bembroidered\b/i,"Embroidered"],[/\btassel\b/i,"Tassel"],[/\bbuckle\b/i,"Buckle"]],
 "Watches":[[/\bquartz\b/i,"Quartz"],[/\bdual display\b/i,"Dual-Display"],[/(?<!non[- ])\bmechanical\b/i,"Mechanical"],[/\b(?:digital|electronic)\b/i,"Digital"],[/\bwaterproof\b/i,"Waterproof"],[/\bstainless steel\b/i,"Stainless Steel"],[/\boctagonal\b/i,"Octagonal"]],
 "Electronics & Tech":[[/\bsuitcase[ -]style\b/i,"Suitcase-Style"],[/\b(?:aluminum alloy|aluminium alloy|metal)\b/i,"Metal"],[/\bbluetooth\b/i,"Bluetooth"],[/\bwireless\b/i,"Wireless"],[/\bportable\b/i,"Portable"],[/\bwaterproof\b/i,"Waterproof"]],
 "Home Textiles":[[/\b(?:tufted|tufting)\b/i,"Tufted"],[/\bround\b/i,"Round"],[/\bnon[ -]slip\b/i,"Non-Slip"],[/\bplush\b/i,"Plush"]],
 "Home & Decor":[[/\babstract\b/i,"Abstract"],[/\bresin\b/i,"Resin"],[/\bmetal\b/i,"Metal"],[/\bglass\b/i,"Glass"],[/\bsculptural\b/i,"Sculptural"],[/\bowl\b/i,"Owl"],[/\bangel\b/i,"Angel"]],
 "Lighting":[[/\b(?:bubble ball|globe)\b/i,"Globe"],[/\b(?:dimming|dimmable)\b/i,"Dimmable"],[/\bfabric\b/i,"Fabric-Shade"],[/\bbamboo\b/i,"Bamboo"],[/\bglass\b/i,"Glass"],[/\bled\b/i,"LED"]],
 "Nails & Nail Supplies":[[/\bfrench\b/i,"French-Tip"],[/\balmond\b/i,"Almond"],[/\bcoffin\b/i,"Coffin"],[/\bglitter\b/i,"Glitter"],[/\bgel\b/i,"Gel"],[/\bmatte\b/i,"Matte"],[/\b(?:24 pieces|24pcs)\b/i,"24-Piece"]],
 "Furniture":[[/\b(?:ergonomic|ergonomics)\b/i,"Ergonomic"],[/\b(?:gaming|e[ -]sports)\b/i,"Gaming"],[/\b(?:recliner|reclining)\b/i,"Reclining"],[/\bcaterpillar\b/i,"Caterpillar"],[/\bround\b/i,"Round"],[/\bsquare\b/i,"Square"],[/\b(?:compact|small apartment)\b/i,"Compact"]],
 "Storage & Organisation":[[/\bmulti[ -]layer\b/i,"Multi-Tier"],[/\bbathroom\b/i,"Bathroom"],[/\bfloor[ -]standing\b/i,"Freestanding"],[/\b(?:clothing store|clothes rack)\b/i,"Clothing"],[/\bdust[ -]proof\b/i,"Dustproof"]],
 "Home & Kitchen":[[/\bstainless steel\b/i,"Stainless Steel"],[/\bstraw cup\b/i,"Straw"],[/\b(?:wooden|ebony)\b/i,"Wooden"]],
 "Packaging & Supplies":[[/\bwaterproof\b/i,"Waterproof"],[/\bdrawer box\b/i,"Drawer-Style"],[/\bextra thick\b/i,"Heavy-Duty"]]
};


const colourPattern=/^(?:light |dark |pastel |dusty |baby |hot |royal |navy |olive |sage |cream |deep )?(?:red|pink|yellow|green|blue|purple|orange|white|black|brown|beige|grey|gray|cream|ivory|burgundy|lilac|lavender|peach|coral|navy|gold|silver|mint|multicolou?r(?:ed)?)$/i;
const capitalise=(s:string)=>s.toLowerCase().replace(/\b[a-z]/g,m=>m.toUpperCase()).replace(/\bGray\b/g,"Grey").replace(/\bMulticolor(?:ed)?\b/g,"Multicolour");
function productColour(p:Product,plain:string):string{
 const values=[...(p.titleHints?.colours||[]),...(p.variants||[]).flatMap(v=>typeof v==="string"?[]:[{image:v.image,value:v.colour||v.attributes?.find(a=>/^colou?r(?: classification)?$/i.test(a.name))?.value||""}])].filter(x=>colourPattern.test(x.value.trim()));
 const distinct=(items:string[])=>[...new Set(items.map(x=>capitalise(x.trim())))];
 const sameImage=distinct(values.filter(v=>!!p.imageUrl&&v.image===p.imageUrl).map(v=>v.value));
 if(sameImage.length===1)return sameImage[0];
 const options=distinct(values.map(v=>v.value));
 if(options.length===1)return options[0];
 if(options.length>1)return "";
 // Explicit adjacent colour + product wording only; avoid gift-wrap and incidental colours.
 const match=plain.match(/\b((?:light |dark |pastel |dusty |baby |hot |royal |navy |olive |sage |deep )?(?:red|pink|yellow|green|blue|purple|orange|white|black|brown|beige|grey|gray|cream|ivory|burgundy|lilac|lavender|peach|coral|navy|mint))\s+(?:(?:crochet|knitted|yarn|wool|handmade|floral|ribbed|cotton|satin|mini|long|short|lace|leather|quilted)\s+){0,3}(?:flowers?|bouquet|roses?|sunflowers?|tulips?|dais(?:y|ies)|carnations?|dress|shirt|top|bag|shoes?|nails?|wig|necklace|earrings?|bracelet|vase|lamp|curtain|cushion|rug|skirt|trousers)\b/i);
 return match?capitalise(match[1]):"";
}
function flowerType(s:string):string[]{
 const rules:Rule[]=[[/\bsunflowers?\b/i,"Sunflower"],[/\btulips?\b/i,"Tulip"],[/\broses?\b/i,"Rose"],[/\bcarnations?\b/i,"Carnation"],[/\bdais(?:y|ies)\b/i,"Daisy"],[/\blil(?:y|ies)\b/i,"Lily"],[/\bpeon(?:y|ies)\b/i,"Peony"],[/\bhydrangeas?\b/i,"Hydrangea"],[/\blavender\b/i,"Lavender"],[/\bpuff flowers?\b/i,"Puff Flower"]];
 return rules.filter(([r])=>r.test(s)).map(([,name])=>name);
}
function crochetBouquetTitle(p:Product,plain:string):string{
 const variety=p.titleHints?.variety||p.sourceSpecs?.find(s=>/^(?:variety|flower type|flower variety)$/i.test(s.name))?.value||"";
 const source=[plain,p.supplierTitle,p.originalTitle].filter(Boolean).join(" ");
 const specified=flowerType(variety),named=flowerType(source);
 const flowers=specified.length===1?specified:named.length===1?named:[];
 const colour=productColour(p,source);
 const detail=/\b(?:mini|small bouquet)\b/i.test(source)?"Mini":/\b(?:handmade|hand[- ]knitted|hand[- ]woven)\b/i.test(source)?"Handmade":"";
 const flower=flowers[0]||"Flower";
 // When the source mentions several possible flowers but doesn't establish the
 // composition, do not claim they are physically mixed in the pictured item.
 const tail=!flowers.length&&named.length>1?" – Assorted Flower Designs":"";
 return [colour,colour||flowers.length?"":detail,"Crochet",flower,"Bouquet"].filter(Boolean).join(" ")+tail;
}

export function conciseProductTitle(p:Product):string{
 const chosen=editorialNames[p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||""];if(chosen)return chosen;
 const primary=p.displayTitle||p.title||p.originalTitle||"";
 const richer=[p.supplierTitle,p.originalTitle].filter((v):v is string=>!!v&&v.trim().length>primary.trim().length+12).sort((a,b)=>b.length-a.length)[0];
 const raw=withoutEmoji((/^(?:ring|necklace|earrings?|bracelet|bag|dress|product|clothing|wig|shoes?|watch|hair clip|other)(?:\s*[-#]?\s*\d+)?$/i.test(primary.trim())&&richer?richer:primary).trim()).replace(/&amp;/gi,"&");
 const plain=raw.replace(/【[^】]*】|\[[^\]]*\]/g," ").replace(/\s+/g," ").trim()||raw;
 // "Dog tooth" is a supplier translation for a pattern, not an animal
 // or a material. Preserve the type of accessory and avoid leather claims.
 if(p.category==="Bags"&&/\b(?:dog[ -]?tooth|dog teeth|dogtooth)\b/i.test(plain)){
  if(/\b(?:card holders?|card cases?|card bags?|card set)\b/i.test(plain)&&!/\b(?:backpack|travel bag|tote bag)\b/i.test(plain))return "Geometric Print Card Holder";
  if(/\b(?:wallet|coin purse)\b/i.test(plain))return "Geometric Print Wallet";
  if(/\bbackpack\b/i.test(plain))return "Geometric Print Backpack";
  if(/\btote bags?\b/i.test(plain))return "Geometric Print Tote Bag";
  if(/\b(?:wash bag|toiletry bag|cosmetic bag)\b/i.test(plain))return "Geometric Print Toiletry Bag";
  if(/\b(?:travel bag|fitness bag|luggage bag)\b/i.test(plain))return "Geometric Print Travel Bag";
  if(/\b(?:saddle bag|messenger bag|crossbody bag)\b/i.test(plain))return "Geometric Print Crossbody Bag";
  if(/\bclutch\b/i.test(plain))return "Geometric Print Clutch";
  return "Geometric Print Bag";
 }
 // Specific objects override ambiguous translations, regardless of category.
 if(/\b(?:sweater chain|sweater pendant)\b/i.test(plain)&&/\b(?:necklace|pendant|jewell?ery)\b/i.test(plain))return /\bcross\b/i.test(plain)?"Cross Pendant Necklace":"Pendant Necklace";
 if(/\b(?:sofa chair|lounge chair|armchair|single sofa chair|leisure chair)\b/i.test(plain)&&!/\b(?:three.seater|two.seater|double sofa|sofa set|chair cover|chair cushion)\b/i.test(plain))return /\b(?:solid wood|wooden)\b/i.test(plain)?"Wooden Lounge Chair":"Lounge Armchair";
 if(/\bskull\b/i.test(plain)&&/\bring\b/i.test(plain)&&!/\b(?:necklace|earrings?|keychain|ring holder)\b/i.test(plain))return "Skull Ring";
 if(/\b(?:nail grinder|nail trimmer|nail drill)\b/i.test(plain)&&!/\b(?:drill bits?|replacement heads?)\b/i.test(plain))return /\belectric\b/i.test(plain)?"Electric Nail Trimmer":"Nail Trimming Tool";
 if(/\b(?:card holder|card case)\b/i.test(plain)&&p.category==="Bags"&&!/\b(?:backpack|travel bag|tote bag)\b/i.test(plain))return "Card Holder";
 const rule=(types[p.category||""]||[]).find(([r])=>r.test(plain));
 if(rule?.[1]==="Crochet Flower Bouquet")return crochetBouquetTitle(p,plain);
 if(rule){
  const label=rule[1],picked:string[]=[];
  for(const [pattern,feature] of [...features,...(categoryFeatures[p.category||""]||[])]){
   if(picked.length>=2)break;
   if(pattern.test(plain)&&!(feature==="Dog"&&/\b(?:dog[ -]?tooth|dog teeth|dogtooth)\b/i.test(plain))&&!(feature==="Leather"&&/\b(?:faux leather|imitation leather|pu leather|synthetic leather)\b/i.test(plain))&&!label.toLowerCase().includes(feature.toLowerCase())&&!picked.some(x=>x.toLowerCase().includes(feature.toLowerCase())))picked.push(feature);
  }
  // Avoid visual descriptions unrelated to the main product; categories already
  // constrain the type, and explicit original titles remain in product details.
  if(picked.includes("MagSafe")&&picked.includes("Magnetic"))picked.splice(picked.indexOf("Magnetic"),1);
  if(picked.includes("Bodycon")&&picked.includes("Ribbed"))picked.reverse();
  if(picked.includes("Marble")&&picked.includes("Nordic"))picked.reverse();
  if(picked.includes("Zircon")&&picked.includes("Heart-Shaped"))picked.reverse();
  const colour=productColour(p,plain);
  if(colour&&!label.toLowerCase().includes(colour.toLowerCase())&&!picked.some(x=>x.toLowerCase().includes(colour.toLowerCase())))picked.unshift(colour);
  if(picked.length||label.split(/\s+/).length>=3)return [...picked,label].join(" ");
  // Preserve real distinguishing words instead of reducing every listing to a noun.
  const cleaned=plain.replace(noise," ").replace(/[!,;:]+/g," ").replace(/\s+/g," ").trim();
  const words=cleaned.split(/\s+/).filter(Boolean);
  const match=words.findIndex((_,i)=>rule[0].test(words.slice(i,i+3).join(" ")));
  if(match>=0){const phrase=words.slice(Math.max(0,match-2),match+6).join(" ");if(phrase.length>label.length&&rule[0].test(phrase))return phrase;}
  return words.slice(0,9).join(" ")||label;
 }
 const cleaned=plain.replace(noise," ").replace(/[!,;:]+/g," ").replace(/\s+/g," ").trim();
 const fallback=cleaned.split(" ").filter(Boolean).slice(0,9).join(" ");
 return fallback||raw.slice(0,70)||p.category||"Product";
}
