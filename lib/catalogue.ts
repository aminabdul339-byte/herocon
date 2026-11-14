import type{Product,Variant}from"./types";
export const productId=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
export const productPrice=(p:Product)=>p.price||(p.priceGBP!=null?`£${p.priceGBP.toFixed(2)}`:"View marketplace price");
const titleNoise=/\\b(?:cross[- ]border|hot[- ]selling|wholesale|factory supply|amazon|aliexpress|temu|wish|same style|new style|in stock|big brand|high quality|versatile|fashion|trendy|wear|clothing|for men and women|men and women|for women and men|women and men|european and american style|spring and autumn|autumn and winter|202[0-9]|new arrival|commuter|lazy|chic|high[- ]end|summer fashion)\\b/gi;
const types:[RegExp,string][]=[
 [/\\b(?:earrings?|ear studs?|hoop earrings?)\\b/i,"Earrings"],
 [/\\b(?:necklaces?|pendants?)\\b/i,"Necklace"],
 [/\\b(?:bracelets?|bangles?)\\b/i,"Bracelet"],
 [/\\b(?:rings?|signet)\\b/i,"Ring"],
 [/\\b(?:hoodies?|hooded sweatshirts?)\\b/i,"Hoodie"],
 [/\\b(?:sweatshirts?)\\b/i,"Sweatshirt"],
 [/\\b(?:t[- ]?shirts?|tees?)\\b/i,"T-Shirt"],
 [/\\b(?:shirts?)\\b/i,"Shirt"],
 [/\\b(?:cardigans?)\\b/i,"Cardigan"],
 [/\\b(?:sweaters?|knitwear)\\b/i,"Sweater"],
 [/\\b(?:jackets?)\\b/i,"Jacket"],
 [/\\b(?:coats?)\\b/i,"Coat"],
 [/\\b(?:jeans|denim pants)\\b/i,"Jeans"],
 [/\\b(?:shorts?)\\b/i,"Shorts"],
 [/\\b(?:trousers?|pants|joggers?)\\b/i,"Trousers"],
 [/\\b(?:skirts?)\\b/i,"Skirt"],
 [/\\b(?:dresses?)\\b/i,"Dress"],
 [/\\b(?:sneakers?|trainers?)\\b/i,"Sneakers"],
 [/\\b(?:boots?)\\b/i,"Boots"],
 [/\\b(?:loafers?)\\b/i,"Loafers"],
 [/\\b(?:shoes?)\\b/i,"Shoes"],
 [/\\b(?:handbags?|tote bags?|shoulder bags?|backpacks?|bags?)\\b/i,"Bag"],
 [/\\b(?:caps?|beanies?|hats?)\\b/i,"Hat"],
 [/\\b(?:belts?)\\b/i,"Belt"]
];
const features:[RegExp,string][]=[
 [/\\b(?:spider lily|spider)\\b/i,"Spider Lily"],
 [/\\b(?:avril lavigne)\\b/i,"Avril Lavigne"],
 [/\\b(?:y2k)\\b/i,"Y2K"],
 [/\\b(?:punk rock|punk)\\b/i,"Punk"],
 [/\\b(?:vintage|retro)\\b/i,"Vintage"],
 [/\\b(?:oversized|loose[- ]fitting)\\b/i,"Oversized"],
 [/\\b(?:heavyweight|300g|310g)\\b/i,"Heavyweight"],
 [/\\b(?:waffle knit|waffle weave|waffle)\\b/i,"Waffle Knit"],
 [/\\b(?:embroider(?:y|ed))\\b/i,"Embroidered"],
 [/\\b(?:washed|gradient)\\b/i,"Washed"],
 [/\\b(?:zipper|zip[- ]up)\\b/i,"Zip-Up"],
 [/\\b(?:fur collar)\\b/i,"Fur Collar"],
 [/\\b(?:cargo|drawstring)\\b/i,"Cargo"],
 [/\\b(?:cotton)\\b/i,"Cotton"],
 [/\\b(?:long[- ]sleeve)\\b/i,"Long-Sleeve"],
 [/\\b(?:short[- ]sleeve)\\b/i,"Short-Sleeve"]
];
export function cleanTitle(p:Product){
 const raw=(p.displayTitle||p.title||"").trim();
 if(!raw)return p.category?`${p.category} Product`:"Product";
 const plain=raw.replace(/[【\\[][^[\\]【】]*[】\\]]/g," ").replace(/\\s+/g," ").trim();
 const found=types.find(([re])=>re.test(plain));
 if(found){
   const label=found[1];
   const picked:string[]=[];
   for(const [re,feature] of features){if(re.test(plain)&&picked.length<2)picked.push(feature)}
   return [...picked,label].join(" ");
 }
 const fallback=plain.replace(titleNoise," ").replace(/\\b(?:[A-Z0-9]{4,}[- ]?\\d{2,}|\\d{4,})\\b/g," ").replace(/[,!;:]+/g," ").replace(/\\s+/g," ").trim();
 const words=fallback.split(" ").filter(Boolean).slice(0,6);
 if(words.length<2||/^(?:women'?s|men'?s|children'?s|product|style)$/i.test(words.join(" ")))return p.category?`${p.category} Product`:"Product";
 return words.join(" ").replace(/\\b\\w/g,c=>c.toUpperCase());
}
export function imagesFor(p:Product){const urls=[p.imageUrl,...(p.images||[])].filter((x):x is string=>Boolean(x)&&/^https?:\/\//.test(x as string));const seen=new Set<string>();return urls.filter(u=>{const k=u.split("?")[0];if(seen.has(k))return false;seen.add(k);return true})}
export function variantsFor(p:Product):Variant[]{return(p.variants||[]).map((v,i)=>typeof v==="string"?{id:String(i),label:v,available:true}:{available:true,...v,id:v.id||String(i)})}
export function categorySlug(c?:string){return(c||"other").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
export function related(products:Product[],p:Product,count=8){const id=productId(p);const same=products.filter(x=>productId(x)!==id&&x.category===p.category&&x.imageUrl);const other=products.filter(x=>productId(x)!==id&&x.imageUrl&&!same.includes(x));return[...same,...other].slice(0,count)}
