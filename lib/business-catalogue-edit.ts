import type {Product} from "./types";

// The founder-selected nine listings, in the order of the reference images.
export const BUSINESS_EDIT_IDS = [
  "HEWCWVJ5M7RL3Y-J_uV0bg",
  "M2Q3F7ZAdZt31tzayH_xEw",
  "FeK8OVhxVZnueaPQPHdazA",
  "Bxt1jifoJ5oinfAzFTydtw",
  "g8ulL_pzvvdAvGHNTXB-xw",
  "DMlpOQTj_SHR6lxFV9FP3Q",
  "b5vYFjflQs1zVXJNwb4CbA",
  "qLiCZEEhOnut6fHdkH-Bow",
  "R1YB-H17wuYDTDPjRob11Q"
] as const;
const idOf=(p:Product)=>p.doppelProductId||p.canonicalId?.replace(/^doppel:/,"")||"";
const hasPhotoAndSource=(p:Product)=>Boolean(p.originalMarketplaceUrl&&p.imageUrl&&/^https:\/\/\S+$/i.test(p.imageUrl));
const named=(p:Product)=>[p.title,p.originalTitle,p.displayTitle].filter(Boolean).join(" ");
const groups=[
 (p:Product)=>p.category==="Wigs & Hair Extensions"&&/\bwigs?\b/i.test(named(p))&&/\b(?:lace|curly|wave|wavy|body wave)\b/i.test(named(p))&&!/\b(?:cosplay|anime|wig caps?|wig stands?|adhesive|glue)\b/i.test(named(p)),
 (p:Product)=>p.category==="Home & Decor"&&/\b(?:ornaments?|sculptures?|figurines?|vases?|decanters?|phonographs?|bookends?|decorative objects?)\b/i.test(named(p)),
 (p:Product)=>p.category==="Jewellery"&&/\brings?\b/i.test(named(p))&&/\b(?:zircon(?:ia)?|moissanite|engagement|diamond|gemstone)\b/i.test(named(p))&&!/\b(?:earrings?|key rings?|ring holders?|ring boxes?)\b/i.test(named(p))
];

// Only used for the default, unfiltered recommended catalogue. The remaining
// catalogue keeps its original order, and all prices and marketplace links are
// taken from the real product records.
export function leadWithBusinessEdit(products:Product[]):Product[]{
 const chosen=new Set<Product>();
 const featured:Product[]=[];
 const add=(p:Product|undefined)=>{if(p&&!chosen.has(p)){chosen.add(p);featured.push(p);}};
 for(const id of BUSINESS_EDIT_IDS)add(products.find(p=>idOf(p)===id&&hasPhotoAndSource(p)));
 const pools=groups.map(matches=>products.filter(p=>!chosen.has(p)&&hasPhotoAndSource(p)&&matches(p)));
 // Add five similar products per niche, interleaved after the exact nine.
 for(let i=0;i<5;i++)for(const pool of pools)add(pool[i]);
 return [...featured,...products.filter(p=>!chosen.has(p))];
}

// Saved supplier photos remain available, but the nine curated cards retain
// the original thumbnails that were chosen for their visual appearance.
export function restoreBusinessEditThumbnails(shown:Product[],original:Product[]):Product[]{
 const ids=new Set<string>(BUSINESS_EDIT_IDS);
 const byId=new Map(original.map(p=>[idOf(p),p]));
 return shown.map(p=>{
  const source=byId.get(idOf(p));
  if(!ids.has(idOf(p))||!source?.imageUrl)return p;
  return {...p,imageUrl:source.imageUrl,images:[...new Set([source.imageUrl,p.imageUrl,...(p.images||[]),...(source.images||[])].filter((u):u is string=>!!u))].slice(0,12)};
 });
}
