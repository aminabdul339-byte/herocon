import "server-only";
import {createHash} from "node:crypto";
import {list} from "@vercel/blob";
import {unstable_cache} from "next/cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {Product} from "@/lib/types";

/**
 * A *single cached listing* of permanent partner snapshots, rather than one
 * Blob read for every search result. Cached for six hours to avoid consuming
 * Advanced Requests on every catalogue/category visit.
 *
 * If Blob access is suspended we preserve original catalogue order and prices
 * instead of deleting products or pretending an import was never saved.
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
},["herocon-saved-partner-index-v1"],{revalidate:21600});

export async function prioritizeSavedPartnerProducts(products:Product[]):Promise<Product[]>{
 if(products.length<2)return products;
 const keys=await savedHashes();
 if(!keys.length)return products;
 const saved=new Set(keys);
 return products.map((product,index)=>{
  const link=normalizeMarketplaceLink(product.originalMarketplaceUrl);
  const hasPartnerDetails=Boolean(link&&saved.has(snapshotKey(link)));
  return {product:{...product,hasPartnerDetails},index,hasPartnerDetails};
 }).sort((a,b)=>Number(b.hasPartnerDetails)-Number(a.hasPartnerDetails)||a.index-b.index).map(x=>x.product);
}
