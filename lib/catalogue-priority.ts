import "server-only";
import {createHash} from "node:crypto";
import {list} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {Product} from "@/lib/types";

/**
 * A *single cached listing* of permanent partner snapshots, rather than one
 * Blob read for every search result. The lightweight index refreshes every
 * 60 seconds, so newly imported products move to the front promptly.
 *
 * If Blob access is suspended we preserve original catalogue order and prices.
 * Failed index reads must not be cached as empty successful results.
 */
const PREFIX="catalogue/buckydrop-snapshots/v1/";
const snapshotKey=(link:string)=>createHash("sha256").update(link).digest("hex");
const savedHashes=unstable_cache(async():Promise<string[]>=>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return [];
 const values:string[]=[];
 try{
  let cursor:string|undefined;
  do{
   const result=await list({prefix:PREFIX,limit:1000,cursor});
   for(const file of result.blobs){
    const hash=file.pathname.slice(PREFIX.length).replace(/\.json$/,"");
    if(/^[a-f0-9]{64}$/.test(hash))values.push(hash);
   }
   if(!result.hasMore)break;
   cursor=result.cursor;
  }while(cursor);
  return values;
 }catch(error){
  console.warn("[herocon] Saved partner index currently inaccessible",error instanceof Error?error.name:"UNKNOWN");
  return [];
 }
},["herocon-saved-partner-index-v2"],{revalidate:60});

export async function prioritizeSavedPartnerProducts(products:Product[]):Promise<Product[]>{
 if(products.length<2)return products;
 let keys:string[];
 try{keys=await savedHashes();}
 catch{return products;}
 if(!keys.length)return products;
 const saved=new Set(keys);
 return products.map((product,index)=>{
  const link=normalizeMarketplaceLink(product.originalMarketplaceUrl);
  const hasPartnerDetails=Boolean(link&&saved.has(snapshotKey(link)));
  return {product:{...product,hasPartnerDetails},index,hasPartnerDetails};
 }).sort((a,b)=>Number(b.hasPartnerDetails)-Number(a.hasPartnerDetails)||a.index-b.index).map(x=>x.product);
}

/**
 * Load product photos from already-persisted partner records for the products
 * currently visible on a page, not for the entire catalogue. These lookups
 * never call the paid supplier API. The results are cached by source URL.
 */
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
const cardPhotos=unstable_cache(async(link:string):Promise<string[]>=>{
 const details=await getSavedBuckydropProduct(link);
 return [...new Set([...(details?.images||[]),...(details?.variants||[]).map(x=>x.image).filter((x):x is string=>!!x)])]
  .filter(url=>/^https:\/\//.test(url)).slice(0,8);
},["herocon-saved-card-photos-v1"],{revalidate:86400});


/**
 * Lead the unfiltered storefront with a varied, stable editorial selection:
 * earrings → wigs → nail designs → home décor, repeated for up to four rounds.
 * Use only real catalogue entries; keep all remaining products in their
 * existing order, without duplication. No supplier API calls are made here.
 * This intentionally runs AFTER saved partner products have been marked,
 * so saved-details items remain the first candidates within each showcase.
 */
export function leadWithShowcaseMix(products:Product[],rounds=4):Product[]{
 if(products.length<4)return products;
 const earrings:Product[]=[],wigs:Product[]=[],nails:Product[]=[],decor:Product[]=[];
 const goodImage=(p:Product)=>typeof p.imageUrl==="string"&&/^https:\/\/[^ ]+/i.test(p.imageUrl);
 const isEarring=(p:Product)=>p.category==="Jewellery"&&/\b(?:earrings?|ear[\s-]?studs?|ear[\s-]?cuffs?)\b/i.test(p.title)
  &&!/\b(?:holder|storage|rack|organizer|organiser|display stand)\b/i.test(p.title);
 const isWig=(p:Product)=>p.category==="Wigs & Hair Extensions";
 const isNail=(p:Product)=>p.category==="Nails & Nail Supplies"
  &&/\b(?:press[\s-]?on|fake|false|wearable|manicure|nail[\s-]?(?:art|tips?|patches?|pieces?|sets?)|nails)\b/i.test(p.title);
 const isDecor=(p:Product)=>p.category==="Home & Decor"
  &&/\b(?:vases?|sculptures?|figurines?|candle[\s-]?holders?|candlesticks?|wall[\s-]?art|art[\s-]?prints?|photo[\s-]?frames?|picture[\s-]?frames?|mirrors?|planters?|flower[\s-]?pots?|ornaments?|decorations?|decor|decorative)\b/i.test(p.title);
 for(const p of products){
  if(!goodImage(p))continue;
  if(isEarring(p))earrings.push(p);
  else if(isWig(p))wigs.push(p);
  else if(isNail(p))nails.push(p);
  else if(isDecor(p))decor.push(p);
 }
 // Each bucket follows normal source order, including any saved-detail priority.
 const pools=[earrings,wigs,nails,decor];
 if(pools.some(pool=>pool.length===0))return products;
 const chosen=new Set<Product>(),featured:Product[]=[];
 for(let i=0;i<rounds;i++){
  for(const pool of pools){
   const p=pool[i];
   if(p&&!chosen.has(p)){featured.push(p);chosen.add(p);}
  }
 }
 return [...featured,...products.filter(p=>!chosen.has(p))];
}

export async function attachSavedPartnerImages(products:Product[]):Promise<Product[]>{
 if(!products.some(p=>p.hasPartnerDetails))return products;
 // Fetch at most the visible page and do not let a storage error blank images.
 return Promise.all(products.map(async product=>{
  if(!product.hasPartnerDetails||!product.originalMarketplaceUrl)return product;
  try{
   const photos=await cardPhotos(product.originalMarketplaceUrl);
   if(!photos.length)return product;
   const original=[product.imageUrl,...(product.images||[])].filter((x):x is string=>!!x);
   return {...product,imageUrl:photos[0],images:[...new Set([...photos,...original])].slice(0,12)};
  }catch{return product;}
 }));
}


/**
 * Editorial four: wig, home décor, nails, shoes.
 * Use actual catalogue products, never placeholder cards or extra API calls.
 * Prioritise an existing saved supplier snapshot (full options and images),
 * then listings with working photographs and marketplace links.
 */
export function selectDiscoveryEditProducts(products:Product[]):Product[]{
 const realImage=(p:Product)=>typeof p.imageUrl==="string"&&/^https?:\/\/\S+/i.test(p.imageUrl);
 const named=(p:Product)=>(p.title||"").toLowerCase();
 const groups=[
  {category:"Wigs & Hair Extensions",specific:(p:Product)=>
   /\b(?:wigs?|lace[\s-]?front(?:al)?s?)\b/i.test(named(p))&&
   !/\b(?:wig[\s-]?(?:caps?|stands?|holders?|racks?)|accessories|adhesives?|glues?|extensions?[\s-]?rings?)\b/i.test(named(p))},
  {category:"Home & Decor",specific:(p:Product)=>
   /\b(?:vases?|sculptures?|figurines?|ornaments?|candlesticks?|candle[\s-]?holders?|wall[\s-]?art|art[\s-]?prints?|picture[\s-]?frames?|photo[\s-]?frames?|mirrors?|planters?|flower[\s-]?pots?|decorative[\s-]?(?:trays?|objects?))\b/i.test(named(p))&&
   !/\b(?:phone[\s-]?cases?|sunglasses?|car[\s-]?(?:dashboard|accessories)|toy[\s-]?cars?|shoe[\s-]?racks?)\b/i.test(named(p))},
  {category:"Nails & Nail Supplies",specific:(p:Product)=>
   /\b(?:wearable[\s-]?nails?|press[\s-]?on[\s-]?nails?|fake[\s-]?nails?|false[\s-]?nails?|nail[\s-]?(?:patches?|tips?|pieces?|sets?)|removable[\s-]?(?:nails?|manicure))\b/i.test(named(p))&&
   !/\b(?:polish|gel[\s-]?polish|glue|drill|lamp|dryer|tool[\s-]?kit)\b/i.test(named(p))},
  {category:"Shoes",specific:(p:Product)=>
   /\b(?:shoes?|sneakers?|trainers?|boots?|heels?|loafers?|slippers?|sandals?)\b/i.test(named(p))&&
   !/\b(?:shoe[\s-]?(?:racks?|cabinets?|organizers?|organisers?|bags?|boxes?|storage|covers?|accessories)|shoelaces?|keychains?|charms?)\b/i.test(named(p))}
 ] as const;
 const chosen=new Set<string>();
 const selection:Product[]=[];
 for(const group of groups){
  const choices=products.map((product,index)=>({product,index}))
   .filter(({product})=>product.category===group.category&&realImage(product)&&
    typeof product.originalMarketplaceUrl==="string"&&
    !chosen.has(product.doppelProductId||product.canonicalId||""));
  // Prefer a photographed, verified-source product with rich supplier
  // details. An exact product-type match always beats a category-only match.
  choices.sort((a,b)=>{
   const grade=(p:Product)=>(group.specific(p)?10000:0)+
    (p.hasPartnerDetails?1000:0)+
    Math.min((p.variants||[]).length,20)*4+
    Math.min((p.images||[]).length,12);
   return grade(b.product)-grade(a.product)||a.index-b.index;
  });
  const first=choices[0]?.product;
  if(first){
   selection.push(first);
   chosen.add(first.doppelProductId||first.canonicalId||"");
  }
 }
 return selection;
}
