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
