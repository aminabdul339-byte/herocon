import {createHash} from "node:crypto";
import {get,head,list,put} from "@vercel/blob";
import {unstable_cache,revalidateTag} from "next/cache";
import {classifyProduct} from "@/lib/product-taxonomy";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import type {BuckydropProduct} from "@/lib/buckydrop";
import type {Product} from "@/lib/types";
import {getReferenceCnyGbpRate} from "@/lib/fx-reference";

const PREFIX="catalogue/discovered/v1/";
const ACCESS="private" as const;
const MAX_IMAGES=12;
const ID_PREFIX="link-";

export type DiscoverySaveResult={
 status:"added"|"existing"|"unavailable";
 productId:string|null;
};

function enabled():boolean {
 return Boolean(process.env.BLOB_READ_WRITE_TOKEN||process.env.BLOB_STORE_ID);
}

export function productIdForSource(productLink:string):string {
 return ID_PREFIX+createHash("sha256").update(productLink).digest("hex").slice(0,28);
}
function productPath(productId:string):string {
 return PREFIX+productId+".json";
}
function safeName(v:unknown,max=320):string {
 return typeof v==="string"?v.replace(/[\x00-\x1f\x7f]/g," ").replace(/\s+/g," ").trim().slice(0,max):"";
}
function imageUrl(v:unknown):string|undefined {
 if(typeof v!=="string")return;
 try {
  const u=new URL(v);
  if(u.protocol==="https:"&&!u.username&&!u.password)return u.href;
 } catch {}
}
function storedRecord(input:unknown):Product|null {
 if(!input||typeof input!=="object"||Array.isArray(input))return null;
 const obj=input as Record<string,unknown>;
 const link=normalizeMarketplaceLink(obj.originalMarketplaceUrl);
 const id=typeof obj.doppelProductId==="string"?obj.doppelProductId:"";
 if(!link||!/^link-[a-f0-9]{28}$/.test(id)||id!==productIdForSource(link))return null;
 const title=safeName(obj.title);
 if(!title)return null;
 const gallery=Array.isArray(obj.images)?obj.images.map(imageUrl).filter((x):x is string=>!!x).slice(0,MAX_IMAGES):[];
 const preview=imageUrl(obj.imageUrl)||gallery[0];
 if(!preview)return null;
 const priceGBP=typeof obj.priceGBP==="number"&&Number.isFinite(obj.priceGBP)&&obj.priceGBP>=0?obj.priceGBP:undefined;
 return {
  canonicalId:"doppel:"+id,
  doppelProductId:id,
  title,
  originalTitle:title,
  category:classifyProduct(title,typeof obj.category==="string"?obj.category:undefined),
  imageUrl:preview,
  images:gallery,
  priceGBP,
  price:priceGBP!=null?"£"+priceGBP.toFixed(2):undefined,
  originalMarketplaceUrl:link,
  sellerName:safeName(obj.sellerName,130)||undefined,
  sourceMarketplace:new URL(link).hostname,
  collectedAt:typeof obj.collectedAt==="string"?obj.collectedAt:undefined,
  listingStatus:"unreviewed",
  discoverySource:"customer-link-search"
 };
}

/** Idempotent persistent write, based on the canonical marketplace URL. */
export async function saveDiscoveredProduct(link:string,source:BuckydropProduct):Promise<DiscoverySaveResult>{
 const productLink=normalizeMarketplaceLink(link);
 if(!productLink)throw new Error("Invalid source URL for catalogue save");
 const productId=productIdForSource(productLink);
 if(!enabled())return {status:"unavailable",productId:null};
 const path=productPath(productId);
 try {
  const already=await head(path);
  if(already)return {status:"existing",productId};
 } catch(error){
  // A genuine storage failure should not be interpreted as "not found".
  // Most SDK implementations return null for a missing blob; surface auth errors.
  throw error;
 }

 let referenceRate:number|undefined;
 try{referenceRate=(await getReferenceCnyGbpRate()).rate;}catch{}
 const lowest=source.variants.map(v=>v.price).filter((n):n is number=>n!=null&&Number.isFinite(n)&&n>=0);
 const base=lowest.length?Math.min(...lowest):source.offerPrice??source.listPrice;
 const priceGBP=referenceRate!=null&&base!=null?Math.round(base*referenceRate*100)/100:undefined;
 const product=storedRecord({
  doppelProductId:productId,
  title:safeName(source.title)||"Marketplace product",
  originalMarketplaceUrl:productLink,
  imageUrl:source.images[0],
  images:source.images,
  sellerName:source.sellerName,
  priceGBP,
  collectedAt:new Date().toISOString()
 });
 if(!product)return {status:"unavailable",productId:null};
 try{
  await put(path,JSON.stringify(product),{
   access:ACCESS,
   addRandomSuffix:false,
   allowOverwrite:false,
   contentType:"application/json"
  });
  revalidateTag("herocon-discovered-products");
  return {status:"added",productId};
 }catch(error){
  // Concurrent identical searches may race. An existing blob wins;
  // never overwrite a record because another request arrived.
  try {
   if(await head(path))return {status:"existing",productId};
  }catch{}
  throw error;
 }
}

async function readStoredProduct(pathname:string):Promise<Product|null>{
 try{
  const result=await get(pathname,{access:ACCESS});
  if(!result||result.statusCode!==200||!result.stream)return null;
  const text=await new Response(result.stream).text();
  if(text.length>30000)return null;
  return storedRecord(JSON.parse(text));
 }catch(error){
  console.error("[catalogue] Failed to read discovered record:",pathname,error instanceof Error?error.message:"unknown");
  return null;
 }
}

const listCached=unstable_cache(async():Promise<Product[]>=>{
 if(!enabled())return [];
 const all:string[]=[];
 let cursor:string|undefined;
 do{
  const page=await list({prefix:PREFIX,limit:1000,cursor});
  all.push(...page.blobs.map(b=>b.pathname));
  if(!page.hasMore)break;
  cursor=page.cursor;
 }while(cursor);
 const items:Product[]=[];
 // Work in limited parallel batches to protect storage bandwidth and function memory.
 for(let i=0;i<all.length;i+=12){
  const batch=await Promise.all(all.slice(i,i+12).map(readStoredProduct));
  for(const item of batch)if(item)items.push(item);
 }
 return items;
},["herocon-discovered-catalogue-v1"],{revalidate:300,tags:["herocon-discovered-products"]});

export async function getDiscoveredProducts():Promise<Product[]>{
 try{return await listCached();}
 catch(error){
  console.error("[catalogue] Discovered storage unavailable:",error instanceof Error?error.message:"unknown");
  return [];
 }
}