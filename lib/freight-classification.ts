export type FreightClass="light"|"bulky"|"review";
export const LIGHT_FREIGHT_PENCE=99;
export function classifyFreight(title:string,category:string):FreightClass{
 const t=title.toLowerCase().replace(/\b(?:cabinet|counter)\s+\d+\b/g," ").replace(/[^a-z0-9]+/g," ");
 // Packaging, wholesale packs, ambiguous sizes and dense materials need review.
 if(/\b(?:sofa|couch|armchair|ottoman|bed frame|mattress|wardrobe|cabinet|dresser|bookshelf|bookcase|dining table|coffee table|desk|chair|stool|bench|sideboard|console table|tv stand|shelving unit|room divider|floor mirror|floor lamp|chandelier|large rug|carpet|treadmill|dumbbell|barbell|weight plate|exercise bike|washing machine|refrigerator|suitcase|luggage|stroller|pushchair|pram|cot bed|baby cot|car seat|large planter|full length mirror)\b/.test(t)||category==="Furniture")return "bulky";
 if(/\b(?:bulk|wholesale|heavy|oversized|extra large|large capacity|industrial|commercial|carton|case of|pack of|pieces per|pcs|kilograms?|kg|cast iron|solid stone|marble|ceramic|glass|liquid|battery|power bank|electric|motor|steel|set of|bundle|storage rack|shoe rack|display stand|box set|jewellery box|jewelry box|organizer|organiser|coat|jacket|puffer|winter|boot|handbag|backpack|costume|gown|doll|rack|tray|cushion|blanket|duvet)\b/.test(t))return "review";
 if(/\b(?:jewell?ery|necklace|earrings?|bracelet|anklet|pendant|brooch|hair clip|hairpin|scrunchie|headband|hair tie|false nails|press on nails|nail stickers?|nail tips|nail art|makeup brush|false eyelashes|eyelash|socks?|stockings?|scarf|hijab|niqab|tie|bow tie|belt|wallet|card holder|sunglasses|eyeglasses|watch strap|watch band|wristwatch|phone case|screen protector|keychain|keyring|stickers?|t shirt|blouse|shirt|tank top|crop top|leggings|shorts|underwear|bra|panties|swimwear|bikini|abaya|thobe|dress|skirt|trousers|jeans|pajamas|pyjamas|wig|hair extensions)\b/.test(t))return "light";
 if(["Jewellery","Hair Accessories","Nails & Nail Supplies","Sunglasses","Underwear & Lingerie"].includes(category)&&t.length>8&&!/^(product|unknown|untitled)\s*$/.test(t))return "light";
 return "review";
}
