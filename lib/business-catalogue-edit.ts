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
export const BUSINESS_PAGE_ONE_REPLACEMENTS = [["SM0_-7P2nD9Jt-lug4mpLQ","link-0079b4276e61ff3cba8d7e33b475"],["uD8YL8OxyHTFYPkg-Yb7TQ","link-04b32bced15766a2451f8e5f9ac1"],["wN-Hv8f9htq2-kBWFmrGXw","YZ83IwkNXmZvD7Vni39yAA"]] as const;
// The current live first-page selection, arranged as eight editorial rows.
export const BUSINESS_PAGE_ONE_ORDER = [
  "link-0079b4276e61ff3cba8d7e33b475",
  "HEWCWVJ5M7RL3Y-J_uV0bg",
  "qLiCZEEhOnut6fHdkH-Bow",
  "YZ83IwkNXmZvD7Vni39yAA",
  "b5vYFjflQs1zVXJNwb4CbA",
  "M2Q3F7ZAdZt31tzayH_xEw",
  "Bxt1jifoJ5oinfAzFTydtw",
  "link-04b32bced15766a2451f8e5f9ac1",
  "ArVo65ZGy59J-ylIGRTMbg",
  "g8ulL_pzvvdAvGHNTXB-xw",
  "R1YB-H17wuYDTDPjRob11Q",
  "FeK8OVhxVZnueaPQPHdazA",
  "DMlpOQTj_SHR6lxFV9FP3Q",
  "LTVwXkK1eRfAq2FqHsxqLQ",
  "x_RZRDReTBrS17zV1rPLrg",
  "knxNpwHBEDCiE1QsgbR8Ag",
  "-7DbxUEYa2VwMtISuUky_A",
  "MU00fFdlWTZF7rOyy2CJVw",
  "Kl2bfeHO1soO6eAunfjsmg",
  "VeefaenaMOOcUl7gJ_kYhA",
  "v-HvLr_vqOsKkc2ZoDcvvQ",
  "GFiXCXAyZNgr8Ruwyk15iQ",
  "i14ZB754DisoGoZws00riQ",
  "_HXrbFMHgAnonG7g2x5arg"
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
 const ids=new Set<string>([...BUSINESS_EDIT_IDS,...BUSINESS_PAGE_ONE_REPLACEMENTS.map(([,id])=>id)]);
 const byId=new Map(original.map(p=>[idOf(p),p]));
 return shown.map(p=>{
  const source=byId.get(idOf(p));
  if(!ids.has(idOf(p))||!source?.imageUrl)return p;
  return {...p,imageUrl:source.imageUrl,images:[...new Set([source.imageUrl,p.imageUrl,...(p.images||[]),...(source.images||[])].filter((u):u is string=>!!u))].slice(0,12)};
 });
}

// Stable business opportunity ranking, not a prediction of sales or profit.
// The score uses real catalogue information only and never performs supplier calls.
const opportunityWeights:Record<string,number>={
 "Flowers & Gifts":1.35,"Jewellery":1.25,"Nails & Nail Supplies":1.35,
 "Hair Accessories":1.3,"Wigs & Hair Extensions":1.18,"Beauty & Personal Care":1.22,
 "Home & Decor":1.25,"Packaging & Supplies":1.35,"Fashion Accessories":1.17,
 "Bags":1.1,"Dresses":1.12,"Tops":1.05,"Bottoms":1,"Outerwear":0.92,
 "Home Textiles":1.06,"Home & Kitchen":1.02,"Storage & Organisation":1.02,
 "Pet Supplies":1.12,"Baby & Kids":0.95,"Furniture":0.65,"Lighting":0.82,
 "Electronics & Tech":0.8,"Other":0.5
};
const stableKey=(p:Product)=>idOf(p)||p.originalMarketplaceUrl||p.title;
function stableHash(s:string){let h=2166136261;for(let i=0;i<s.length;i++){h=Math.imul(h^s.charCodeAt(i),16777619);}return (h>>>0)/4294967296;}
function referencePrice(p:Product){
 if(typeof p.priceGBP==="number"&&Number.isFinite(p.priceGBP)&&p.priceGBP>0)return p.priceGBP;
 const m=(p.price||"").match(/^£\s*([\d,]+(?:\.\d+)?)$/);if(!m)return null;
 const n=Number(m[1].replace(/,/g,""));return n>0&&Number.isFinite(n)?n:null;
}
function opportunityScore(p:Product){
 const name=named(p).toLowerCase(),price=referencePrice(p);
 const accessible=price===null?0:price<=3?25:price<=8?22:price<=15?16:price<=30?9:price<=60?3:0;
 const productType=/\b(?:bouquets?|gift boxes?|gift bags?|earrings?|necklaces?|bracelets?|press[ -]?on nails?|wearable nails?|hair clips?|scrunchies|headbands?|wigs?|extensions?|vases?|ornaments?|makeup brushes|pouches?|tote bags?|packaging|ribbons?|dresses?|cardigans?|candles?)\b/i.test(name)?14:0;
 const vague=/^(?:product|other|[*. ]+|[\d#-]+)$/i.test(p.title.trim())||/\b(?:link only|new link|contact customer service to change the price|random blind box)\b/.test(name)?-24:0;
 const risk=/\b(?:replica|1\s*:\s*1|counterfeit|imitation brand|original version|factory batch)\b/i.test(name)?-16:0;
 return (hasPhotoAndSource(p)?35:0)+accessible+productType+vague+risk+stableHash(stableKey(p))*10;
}
/** Keep the existing founder edit at the start. Then create one deterministic
 * permutation of the rest, mixing real categories in proportion to stock.
 * Rank each category by affordable entry cost, product clarity and sourcing
 * potential. Interleave stronger and middle-ranked options throughout browsing
 * rather than exhausting the most appealing category in one block.
 * Deliberately independent of changing partner-enrichment flags.
 */
export function mixBusinessCatalogue(products:Product[],pageSize=24):Product[]{
 if(products.length<=pageSize)return leadWithBusinessEdit(products);
 const ranked=leadWithBusinessEdit(products);
 // Swap only the three requested page-one cards with real catalogue records.
 // Keep displaced items available in the remainder of the catalogue.
 for(const [oldId,newId] of BUSINESS_PAGE_ONE_REPLACEMENTS){
  const oldIndex=ranked.findIndex(p=>idOf(p)===oldId),newIndex=ranked.findIndex(p=>idOf(p)===newId&&hasPhotoAndSource(p));
  if(oldIndex>=0&&oldIndex<pageSize&&newIndex>=pageSize){[ranked[oldIndex],ranked[newIndex]]=[ranked[newIndex],ranked[oldIndex]];}
 }
 // Preserve the exact live first-page edit when all its listings remain available.
 // Otherwise fall back to the normal eligible catalogue selection; never show stale cards.
 const pinned=BUSINESS_PAGE_ONE_ORDER.map(id=>ranked.find(p=>idOf(p)===id&&hasPhotoAndSource(p)));
 const availablePinned=pinned.filter((p):p is Product=>!!p);const lead=pageSize===BUSINESS_PAGE_ONE_ORDER.length?[...availablePinned,...ranked.filter(p=>!availablePinned.includes(p))].slice(0,pageSize):ranked.slice(0,pageSize);
 const selected=new Set(lead);
 const groups=new Map<string,Product[]>();
 for(const p of products){if(selected.has(p))continue;const key=p.category||"Other";const pool=groups.get(key)||[];pool.push(p);groups.set(key,pool);}
 const pools=[...groups.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([category,items])=>{
  const sorted=items.map(product=>({product,score:opportunityScore(product)})).sort((a,b)=>b.score-a.score||stableKey(a.product).localeCompare(stableKey(b.product))).map(x=>x.product);
  // Three quality bands with a smooth interleave: each long run of pages
  // receives high-ranked products, not just the first few pages.
  const bands=[sorted.slice(0,Math.ceil(sorted.length/3)),sorted.slice(Math.ceil(sorted.length/3),Math.ceil(sorted.length*2/3)),sorted.slice(Math.ceil(sorted.length*2/3))];
  const ordered:Product[]=[];for(let i=0;i<bands[0].length;i++)for(const b of bands)if(b[i])ordered.push(b[i]);
  return {category,items:ordered,index:0,credit:0,weight:Math.sqrt(items.length)*(opportunityWeights[category]||1)};
 });
 const result=[...lead];
 // Smooth weighted round-robin, with a per-page category limit and no
 // consecutive category when alternatives are available. Stock exhaustion
 // gracefully relaxes the limits, so every listing remains accessible.
 let previous=lead[lead.length-1]?.category||"";
 while(result.length<products.length){
  const used=new Map<string,number>();let lastSeller="";
  for(let slot=0;slot<pageSize&&result.length<products.length;slot++){
   const active=pools.filter(p=>p.index<p.items.length);if(!active.length)return result;
   const totalWeight=active.reduce((n,p)=>n+p.weight,0);
   for(const p of active)p.credit+=p.weight;
   const limit=Math.max(3,Math.ceil(pageSize/Math.max(1,active.length)));
   let available=active.filter(p=>(used.get(p.category)||0)<limit&&p.category!==previous);
   if(!available.length)available=active.filter(p=>(used.get(p.category)||0)<limit);
   if(!available.length)available=active.filter(p=>p.category!==previous);
   if(!available.length)available=active;
   const seller=(p:Product)=>p.sellerId||p.sellerName||"";
   available.sort((a,b)=>{
    const grade=(p:typeof a)=>p.credit+(opportunityScore(p.items[p.index])/100)*totalWeight*0.09-(lastSeller&&seller(p.items[p.index])===lastSeller?totalWeight*0.12:0);
    return grade(b)-grade(a)||a.category.localeCompare(b.category);
   });
   const chosen=available[0],product=chosen.items[chosen.index++];
   chosen.credit-=totalWeight;used.set(chosen.category,(used.get(chosen.category)||0)+1);
   previous=chosen.category;lastSeller=seller(product);result.push(product);
  }
 }
 return result;
}


/** Founder opening page, followed by a fixed editorial selection of actual
 * lighting, decor, nails and dresses. Remaining stock stays in source order. */
const EARLY_EDIT_POOLS=[
 ["plEADg5tY2SQnsioXDDLqQ","-lHyokdWTdf0lo-778q2bw","Q-_0AVEeZNjoVHa4oupHtQ","EHrGApvMkFKA-24TboADpg","2sRygZlsZktTv91d11BSEg","6rk_jRljZWLV7dGiXWsAlQ","bn1Us9qNfamP8IU8uuLfKA","xAhXGV47t0tKvYp_npfE3w","8Y7hLNIrshCSBYg9zPNA9w","5xO_jqq7i6gxJ8RUrOw2tQ","fNMtEbVvMdpGRe6m15ZZLQ","SPDLe121F9jR3sTdgoig9Q","yHCNywX_oSxQbGxs-i1Ejw"],
 ["4QucBqTfsk76WbDuGGzyBA","RbYT4P62F8aghciU32UFCw","-pKMxTapzPLSSQTrwCL9Dw","lmjNIBGoyaG7ZIY3GdxISA","-4R8jqSD1DY_xlgHS18_SQ","gRI0o79a-NBSymtpE7Q3aw","92FsImSS8_sQwZFpjpaSog","NQeS4yMU3r-aoJHAdXaTsg","_-ET_BpAjFe9GkM4uSiP-Q","8L5119Y5oUO0MLVrT_w9Uw","PEEo8NfzaiCPsg4kzh6xIw","ZmTfvYAxCMfM5MsT_cf2AQ","7AYxx1SBT3l2by0GayVgfg"],
 ["NbpVbwcbrjQX6zrR7-gCFQ","NQTel5-g_doG6HVDfvr_Sw","ViXrIhmbRItdJyn5HvRdKw","OSKicXXxZOCP-pM2rJl8kA","z7wnBKL8mg9FLzTfNd2spQ","kaO0lDqko8-25Yv_Pr2Xvw","ecOvVgnSnu52w7vFjdx34A","FTZ4dbzvU0E-yBFNFGw9RA","ZRr0gqR3E-bAxyDXUq22cQ"],
 ["9INdeLafB9k1-hQe64qDQQ","-bDZqh8dSeT9b6vY9zjXjA","vJtYi14nMR62yqezXS7fsQ","QqzffRjiMyNKs9xZlSrm9Q","uFDbKZijVUDgHrOfWAiD9Q","zmcFLXhlnDI9AyHB3zO8LA","8t3fo9eRc1lLdPqNSasQ2w","iSd8W-jAr4Kgh8zBVRM_aA","MuTlXrJFmtjTpNn_jG43EA","QdCtw6poCdD0NO2yL9QT-Q","KurflWaxYSEuQ9uRWMu21w","uwqqCs2w2PjPlrhfbQx_jQ","vRcO1sSD1KEnReFBtWVqtw","5_DfqyLHaIdpl2UMbzvDyg","YjXAnN1cosMO1iGVWJw5FA"]
] as const;
const earlyCategories=["Lighting","Home & Decor","Nails & Nail Supplies","Dresses"];
const lowLevel=/\b(?:cosplay|spoof mask|3d headgear|baseball bat|fishhook embroidery|hello kitty|skull|skeleton|novelty|cartoon|blind box|replica)\b/i;
const suitable=(p:Product)=>hasPhotoAndSource(p)&&!lowLevel.test(named(p));
export function rankBusinessCategory(products:Product[]):Product[]{return [...products].sort((a,b)=>Number(suitable(b))-Number(suitable(a))||opportunityScore(b)-opportunityScore(a)||stableKey(a).localeCompare(stableKey(b)));}
export function earlyBusinessEdit(products:Product[]):Product[]{
 const byId=new Map(products.map(p=>[idOf(p),p]));
 const chosen=new Set<Product>(),photos=new Set<string>(),result:Product[]=[];
 const add=(p:Product|undefined,uniquePhoto=true)=>{if(!p||chosen.has(p)||!suitable(p))return;const photo=p.imageUrl!.split("?")[0];if(uniquePhoto&&photos.has(photo))return;chosen.add(p);photos.add(photo);result.push(p);};
 // Preserve the user's exact first-page selection (even where photos repeat).
 for(const id of BUSINESS_PAGE_ONE_ORDER)add(byId.get(id),false);
 const pools=EARLY_EDIT_POOLS.map((ids,i)=>[...ids.map(id=>byId.get(id)).filter((p):p is Product=>!!p),...rankBusinessCategory(products.filter(p=>p.category===earlyCategories[i]))]);
 for(let i=0;result.length<72&&pools.some(g=>i<g.length);i++)for(const g of pools){if(result.length<72)add(g[i]);}
 // In a depleted catalogue, fill with suitable photographed products only.
 for(const p of rankBusinessCategory(products)){if(result.length>=72)break;add(p);}
 return result;
}
export function freeBusinessEdit(products:Product[],limit=48):Product[]{return earlyBusinessEdit(products).slice(0,limit);}
export function preserveBusinessOrder(products:Product[]):Product[]{
 const lead=earlyBusinessEdit(products),selected=new Set(lead);
 return [...lead,...products.filter(p=>!selected.has(p))];
}
