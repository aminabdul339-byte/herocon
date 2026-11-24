import "server-only";
import {createHash} from "node:crypto";
import {get,list,put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {readMarketplaceSource,saveMarketplaceSource,SourceEnrichmentError,ENRICHMENT_PREFIX_V1,ENRICHMENT_PREFIX_V2} from "@/lib/marketplace-source-enrichment";
import {getAllEnrichedSourceHashes} from "@/lib/buckydrop-bulk";

// Only v2 proves that the full provider SKU matrix was preserved.
const PREFIX=ENRICHMENT_PREFIX_V2;
const STATE_PATH="catalogue/automatic-enrichment/v1/state.json";
const LOCK_PREFIX="catalogue/automatic-enrichment/v1/runs/";
// The scheduler runs until time or the provider quota is exhausted. No low
// 36-product cap: owners can raise their HioBuy plan without changing code.
const MAX_REQUESTS_PER_DAY=500;
const MAX_CONCURRENT=3;
const MIN_BATCH_START_INTERVAL_MS=3500; // <= ~52 requests/minute
const MAX_RUNTIME_MS=210_000;
const BLOCK_TTL_MS=7*24*60*60*1000;

type Channel="1688"|"weidian"|"taobao";
type Block={code:string;until:number};
export type AutomaticEnrichmentState={
 version:1;
 lastHash:string;
 lastKey?:string;
 lastRun:string|null;
 updatedAt:string|null;
 totalRequests:number;
 totalSaved:number;
 lastRunRequests:number;
 lastRunSaved:number;
 lastRunSkipped:number;
 lastRunErrors:number;
 lastIssue:string|null;
 blockedChannels:Partial<Record<Channel,Block>>;
};
const empty=():AutomaticEnrichmentState=>({
 version:1,lastHash:"",lastKey:"",lastRun:null,updatedAt:null,totalRequests:0,totalSaved:0,
 lastRunRequests:0,lastRunSaved:0,lastRunSkipped:0,lastRunErrors:0,
 lastIssue:null,blockedChannels:{}
});
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const channel=(s:string):Channel=>{
 const host=new URL(s).hostname;
 return host==="detail.1688.com"?"1688":host==="weidian.com"?"weidian":"taobao";
};
const positive=(v:unknown)=>typeof v==="number"&&Number.isFinite(v)&&v>=0?v:0;

export async function getAutomaticEnrichmentState():Promise<AutomaticEnrichmentState>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return empty();
 try{
  const result=await get(STATE_PATH,{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return empty();
  const json=JSON.parse(await new Response(result.stream).text()) as Partial<AutomaticEnrichmentState>;
  if(json.version!==1)return empty();
  return {
   ...empty(),...json,
   lastHash:typeof json.lastHash==="string"&&/^[a-f0-9]{64}$/.test(json.lastHash)?json.lastHash:"",
   lastKey:typeof json.lastKey==="string"&&/^[012]:[a-f0-9]{64}$/.test(json.lastKey)?json.lastKey:"",
   totalRequests:positive(json.totalRequests),
   totalSaved:positive(json.totalSaved),
   blockedChannels:json.blockedChannels&&typeof json.blockedChannels==="object"?json.blockedChannels:{}
  };
 }catch{return empty();}
}
async function saveState(state:AutomaticEnrichmentState){
 await put(STATE_PATH,JSON.stringify({...state,updatedAt:new Date().toISOString()}),{
  access:"private",addRandomSuffix:false,allowOverwrite:true,contentType:"application/json"
 });
}
async function savedHashes():Promise<Set<string>>{
 const hashes=new Set<string>();
 let cursor:string|undefined;
 do{
  const page=await list({prefix:PREFIX,limit:1000,cursor});
  for(const blob of page.blobs){
   const hash=blob.pathname.slice(PREFIX.length).replace(/\.json$/,"");
   if(/^[a-f0-9]{64}$/.test(hash))hashes.add(hash);
  }
  if(!page.hasMore)break;
  cursor=page.cursor;
 }while(cursor);
 return hashes;
}
async function savedLegacyHashes():Promise<Set<string>>{
 const keys=new Set<string>();
 let cursor:string|undefined;
 do{
  const page=await list({prefix:ENRICHMENT_PREFIX_V1,limit:1000,cursor});
  for(const item of page.blobs){
   const hash=item.pathname.slice(ENRICHMENT_PREFIX_V1.length).replace(/\.json$/,"");
   if(/^[a-f0-9]{64}$/.test(hash))keys.add(hash);
  }
  if(!page.hasMore)break;
  cursor=page.cursor;
 }while(cursor);
 return keys;
}
export async function getEnrichmentSavedCount():Promise<number>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return 0;
 try{
  const [newKeys,oldKeys]=await Promise.all([savedHashes(),savedLegacyHashes()]);
  for(const key of oldKeys)newKeys.add(key);
  return newKeys.size;
 }catch{return 0;}
}
type CatalogSource={hash:string;key:string;url:string;channel:Channel};
function catalogSources(
 products:Awaited<ReturnType<typeof getProducts>>,
 legacyKeys:ReadonlySet<string>
):CatalogSource[]{
 const sources=new Map<string,{url:string;priority:0|1|2}>();
 // Prioritise Shop for Yourself, then the business catalogue. Existing
 // saved snapshots from either provider (including legacy) are skipped.
 for(const p of personalShopProducts){
  const url=normalizeMarketplaceLink(p.originalUrl);
  if(url)sources.set(url,{url,priority:1});
 }
 for(const p of products){
  const url=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(url&&!sources.has(url))sources.set(url,{url,priority:2});
 }
 return [...sources.values()].map(({url,priority})=>{
  const hash=sha(url);
  if(legacyKeys.has(hash))priority=0;
  return {url,hash,key:priority+":"+hash,channel:channel(url)};
 }).sort((a,b)=>a.key.localeCompare(b.key));
}
const subscriptionErrors=new Set(["PAID_SUBSCRIPTION_REQUIRED","CHANNEL_NOT_AUTHORIZED","CHANNEL_CAPABILITY_NOT_SUPPORTED"]);
const globalErrors=new Set(["INVALID_API_KEY","INSUFFICIENT_SCOPE","QUOTA_EXCEEDED","PLATFORM_QUOTA_EXCEEDED",
 "RATE_LIMITED","RATE_LIMIT_EXCEEDED","hiobuy_rate_limited","product_api_not_connected"]);
export type AutomaticEnrichmentResult={
 status:"completed"|"already_executed"|"not_configured";
 runDate:string;
 checked:number;added:number;skipped:number;failed:number;
 savedUnique:number;catalogueUnique:number;lastIssue:string|null;
};

/**
 * A Vercel Cron Job invokes this once per day. A deterministic daily Blob
 * lock prevents double billing on repeated cron delivery. Progress is saved
 * after each small batch; the next day continues after the last link hash.
 * Public storefront requests never call this worker.
 */
export async function runAutomaticEnrichment():Promise<AutomaticEnrichmentResult>{
 const today=new Date().toISOString().slice(0,10);
 const zero={runDate:today,checked:0,added:0,skipped:0,failed:0,savedUnique:0,catalogueUnique:0,lastIssue:null};
 if(!process.env.HIOBUY_API_KEY||!process.env.BLOB_READ_WRITE_TOKEN)
  return {status:"not_configured",...zero};
 // Acquire a per-UTC-day durable lock before any billable supplier requests.
 try{
  await put(LOCK_PREFIX+today+".json",JSON.stringify({date:today,createdAt:new Date().toISOString()}),{
   access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"
  });
 }catch{return {status:"already_executed",...zero};}

 const started=Date.now();
 const state=await getAutomaticEnrichmentState();
 state.lastRun=new Date().toISOString();
 state.lastIssue=null;
 state.lastRunRequests=0;state.lastRunSaved=0;state.lastRunSkipped=0;state.lastRunErrors=0;
 const [existing,legacy,products]=await Promise.all([
  getAllEnrichedSourceHashes(),savedLegacyHashes(),getProducts()
 ]);
 const catalog=catalogSources(products,legacy);
 if(!catalog.length){await saveState(state);return {status:"completed",...zero,savedUnique:existing.size};}
 let start=catalog.findIndex(x=>x.key>(state.lastKey||""));
 if(start<0)start=0;
 let scanned=0,consecutiveFailures=0,stop=false;
 let lastBatchStarted=0;
 const seen=new Set<string>();
 while(scanned<catalog.length&&state.lastRunRequests<MAX_REQUESTS_PER_DAY
  &&Date.now()-started<MAX_RUNTIME_MS-20_000&&!stop){
  const batch:typeof catalog=[];
  while(scanned<catalog.length&&batch.length<MAX_CONCURRENT
     &&state.lastRunRequests+batch.length<MAX_REQUESTS_PER_DAY){
   const p=catalog[(start+scanned)%catalog.length];
   scanned++;
   state.lastHash=p.hash;
   state.lastKey=p.key;
   if(seen.has(p.hash)||existing.has(p.hash)){state.lastRunSkipped++;continue;}
   seen.add(p.hash);
   // Taobao requires a separate paid product-data entitlement; don't spend
   // the trial allowance testing it on every scheduled run.
   if(p.channel==="taobao"&&process.env.HIOBUY_TAOBAO_ENABLED!=="true"){
    state.lastRunSkipped++;
    continue;
   }
   const blocked=state.blockedChannels[p.channel];
   if(blocked&&typeof blocked.until==="number"&&blocked.until>Date.now()){
    state.lastRunSkipped++;
    continue;
   }
   batch.push(p);
  }
  if(!batch.length)break;
  // Default HioBuy plan allows 60/minute; avoid overwhelming it even after
  // increasing the daily cap. Upstream request latency adds natural spacing.
  const remaining=MIN_BATCH_START_INTERVAL_MS-(Date.now()-lastBatchStarted);
  if(lastBatchStarted&&remaining>0)await new Promise<void>(resolve=>setTimeout(resolve,remaining));
  lastBatchStarted=Date.now();
  const completed=await Promise.all(batch.map(async p=>{
   try{
    const result=await readMarketplaceSource(p.url);
    await saveMarketplaceSource(result);
    return {hash:p.hash,channel:p.channel,ok:true as const};
   }catch(error){
    // Provider raw response, URL and credentials must never appear in logs.
    return {
     hash:p.hash,channel:p.channel,ok:false as const,
     code:error instanceof SourceEnrichmentError?error.code:"enrichment_failed"
    };
   }
  }));
  for(const item of completed){
   state.lastRunRequests++;state.totalRequests++;
   if(item.ok){
    existing.add(item.hash);
    state.lastRunSaved++;state.totalSaved++;
    consecutiveFailures=0;
    continue;
   }
   state.lastRunErrors++;
   const code=item.code;
   if(subscriptionErrors.has(code)){
    state.blockedChannels[item.channel]={code,until:Date.now()+BLOCK_TTL_MS};
    state.lastIssue=code+" ("+item.channel+")";
    continue;
   }
   if(globalErrors.has(code)){
    state.lastIssue=code;
    stop=true;
   }
   if(["hiobuy_unavailable","enrichment_failed","enrichment_storage_failed"].includes(code)){
    consecutiveFailures++;
    if(consecutiveFailures>=3){stop=true;state.lastIssue="repeated_provider_failures";}
   }
  }
  // On shared-quota or account-wide stops, retry unresolved sources at the
  // next daily run instead of hiding them behind the advancing cursor.
  if(stop)state.lastKey="";
  await saveState(state);
 }
 const result:AutomaticEnrichmentResult={
  status:"completed",runDate:today,
  checked:state.lastRunRequests,added:state.lastRunSaved,
  skipped:state.lastRunSkipped,failed:state.lastRunErrors,
  savedUnique:existing.size,catalogueUnique:catalog.length,
  lastIssue:state.lastIssue
 };
 console.info("[herocon-enrichment-cron]",{
  day:today,checked:result.checked,saved:result.added,
  skipped:result.skipped,errors:result.failed,issue:result.lastIssue,
  unique:result.catalogueUnique
 });
 return result;
}
