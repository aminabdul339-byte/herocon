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
 * Reads and writes consume Vercel storage operations (but no our sourcing partner call on a hit).
 * A new billable our sourcing partner lookup is only invoked from explicit user actions.
 */
export const BUCKYDROP_PREFIX_V1="catalogue/buckydrop-snapshots/v1/";
export const BUCKYDROP_PREFIX_V2="catalogue/buckydrop-snapshots/v2/";
const ACCESS="private" as const;
const MAX_BYTES=16*1024*1024;
type Snapshot={version:1|2;canonicalUrl:string;savedAt:string;product:BuckydropProduct};
const pathFor=(link:string,version:1|2=2)=>(version===2?BUCKYDROP_PREFIX_V2:BUCKYDROP_PREFIX_V1)+createHash("sha256").update(link).digest("hex")+".json";
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
 for(const version of [2,1] as const){
  let result:Awaited<ReturnType<typeof get>>;
  try{result=await get(pathFor(canonical,version),{access:ACCESS});}
  catch(e){
   if(missing(e))continue;
   throw new BuckydropError("SNAPSHOT_READ_FAILED",503,"Saved product details are temporarily unavailable.");
  }
  if(!result)continue;
  if(result.statusCode!==200||!result.stream)
   throw new BuckydropError("SNAPSHOT_READ_FAILED",503,"Saved product details could not be read.");
  try{
   const raw=await new Response(result.stream).text();
   if(Buffer.byteLength(raw,"utf8")>MAX_BYTES)throw Error("Too large");
   const item=JSON.parse(raw) as Snapshot;
   if(item.version!==version||item.canonicalUrl!==canonical||!item.product||
     item.product.source!=="buckydrop"||item.product.environment!=="live"||
     !Array.isArray(item.product.variants)||!Array.isArray(item.product.images)||
     !/^\d{4}-\d{2}-\d{2}T/.test(item.savedAt))throw Error("Invalid snapshot");
   return {...item.product,snapshotSavedAt:item.savedAt};
  }catch{
   throw new BuckydropError("SNAPSHOT_INVALID",503,"The stored product record needs attention.");
  }
 }
 return null;
}
/** Writes a new, complete supplier snapshot. The import worker checks
 * all existing provider records before incurring the billable API call.
 * Fails rather than silently dropping SKU options for oversized products. */
export async function saveNewBuckydropProduct(link:string,product:BuckydropProduct):Promise<BuckydropProduct>{
 const canonical=normalized(link);
 if(product.environment!=="live")throw new BuckydropError("NOT_LIVE",503,"Only live supplier data can be saved.");
 const saved=await getSavedBuckydropProduct(canonical);
 if(saved)return saved;
 const savedAt=new Date().toISOString();
 const body=JSON.stringify({version:2,canonicalUrl:canonical,savedAt,product} satisfies Snapshot);
 if(Buffer.byteLength(body,"utf8")>MAX_BYTES)
  throw new BuckydropError("SNAPSHOT_TOO_LARGE",503,"Supplier data was too large to store without loss.");
 try{
  await put(pathFor(canonical,2),body,{
   access:ACCESS,addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"
  });
 }catch{
  const raced=await getSavedBuckydropProduct(canonical).catch(()=>null);
  if(raced)return raced;
  throw new BuckydropError("SNAPSHOT_SAVE_FAILED",503,"Supplier details were retrieved but not saved.");
 }
 return {...product,snapshotSavedAt:savedAt};
}
/**
 * Called only after a visitor explicitly requests our sourcing partner details, or submits
 * a new original marketplace link. A persisted hit never calls our sourcing partner.
 * No automatic bulk crawl or background refresh is performed.
 */
export async function getOrSaveBuckydropProduct(link:string):Promise<{product:BuckydropProduct;cacheStatus:"hit"|"stored"}>{
 const canonical=normalized(link);
 const saved=await getSavedBuckydropProduct(canonical);
 if(saved)return {product:saved,cacheStatus:"hit"};

 const product=await queryBuckydropProduct(canonical);
 if(product.environment!=="live")throw new BuckydropError("NOT_LIVE",503,"Only live product details can be saved.");
 const stored=await saveNewBuckydropProduct(canonical,product);
 return {product:stored,cacheStatus:"stored"};
}
