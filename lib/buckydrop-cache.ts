import "server-only";
import {createHash} from "node:crypto";
import {get,put} from "@vercel/blob";
import {BuckydropError,queryBuckydropProduct,type BuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";

/**
 * Permanent supplier snapshots. They do not expire after one hour or one year.
 * Existing snapshots are never automatically refreshed on product-page visits.
 * Supplier prices/stock are historical display data, NEVER checkout authority.
 *
 * Reads and writes consume Vercel storage operations (but no BuckyDrop call on a hit).
 * A new billable BuckyDrop lookup is only invoked from explicit user actions.
 */
const PREFIX="catalogue/buckydrop-snapshots/v1/";
const ACCESS="private" as const;
const MAX_BYTES=1_000_000;
type Snapshot={version:1;canonicalUrl:string;savedAt:string;product:BuckydropProduct};
const pathFor=(link:string)=>PREFIX+createHash("sha256").update(link).digest("hex")+".json";
const available=()=>Boolean(process.env.BLOB_READ_WRITE_TOKEN);
function normalized(link:string){
 const canonical=normalizeMarketplaceLink(link);
 if(!canonical)throw new BuckydropError("INVALID_SOURCE",400,"This marketplace product URL is not supported.");
 if(!available())throw new BuckydropError("SNAPSHOT_STORAGE_UNAVAILABLE",503,"Product detail storage is not configured.");
 return canonical;
}
const missing=(e:unknown)=>e instanceof Error&&/not found|does not exist|404/i.test(e.message);

export async function getSavedBuckydropProduct(link:string):Promise<BuckydropProduct|null>{
 const canonical=normalized(link);
 let result:Awaited<ReturnType<typeof get>>;
 try{result=await get(pathFor(canonical),{access:ACCESS});}
 catch(e){
  if(missing(e))return null;
  throw new BuckydropError("SNAPSHOT_READ_FAILED",503,"Saved product details are temporarily unavailable.");
 }
 if(!result||result.statusCode===404)return null;
 if(result.statusCode!==200||!result.stream)throw new BuckydropError("SNAPSHOT_READ_FAILED",503,"Saved product details could not be read.");
 try{
  const raw=await new Response(result.stream).text();
  if(raw.length>MAX_BYTES)throw Error("Too large");
  const item=JSON.parse(raw) as Snapshot;
  if(item.version!==1||item.canonicalUrl!==canonical||!item.product||
    item.product.source!=="buckydrop"||item.product.environment!=="live"||
    !Array.isArray(item.product.variants)||!Array.isArray(item.product.images)||
    !/^\d{4}-\d{2}-\d{2}T/.test(item.savedAt))throw Error("Invalid snapshot");
  return {...item.product,snapshotSavedAt:item.savedAt};
 }catch{
  // Never make a fresh, billable API request as a side effect of corrupt storage.
  throw new BuckydropError("SNAPSHOT_INVALID",503,"The stored product record needs attention.");
 }
}

/**
 * Called only after a visitor explicitly requests BuckyDrop details, or submits
 * a new original marketplace link. A persisted hit never calls BuckyDrop.
 * No automatic bulk crawl or background refresh is performed.
 */
export async function getOrSaveBuckydropProduct(link:string):Promise<{product:BuckydropProduct;cacheStatus:"hit"|"stored"}>{
 const canonical=normalized(link);
 const saved=await getSavedBuckydropProduct(canonical);
 if(saved)return {product:saved,cacheStatus:"hit"};

 const product=await queryBuckydropProduct(canonical);
 if(product.environment!=="live")throw new BuckydropError("NOT_LIVE",503,"Only live product details can be saved.");
 const savedAt=new Date().toISOString();
 const payload:Snapshot={version:1,canonicalUrl:canonical,savedAt,product};
 const json=JSON.stringify(payload);
 if(json.length>MAX_BYTES)throw new BuckydropError("SNAPSHOT_TOO_LARGE",503,"This product contains more options than can be stored safely.");
 try{
  await put(pathFor(canonical),json,{
   access:ACCESS,addRandomSuffix:false,allowOverwrite:false,
   contentType:"application/json"
  });
 }catch{
  // A simultaneous successful lookup may already have stored the product.
  // Serve that record if present; never overwrite a saved snapshot.
  try{
   const existing=await getSavedBuckydropProduct(canonical);
   if(existing)return {product:existing,cacheStatus:"hit"};
  }catch{}
  throw new BuckydropError("SNAPSHOT_SAVE_FAILED",503,"The provider returned product details but they could not be saved. Please try again later.");
 }
 return {product:{...product,snapshotSavedAt:savedAt},cacheStatus:"stored"};
}
