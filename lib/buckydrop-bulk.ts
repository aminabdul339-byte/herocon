import "server-only";
import {createHash} from "node:crypto";
import {get,list,put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {queryBuckydropProduct,BuckydropError,isApprovedSource} from "@/lib/buckydrop";
import {saveNewBuckydropProduct,BUCKYDROP_PREFIX_V1,BUCKYDROP_PREFIX_V2} from "@/lib/buckydrop-cache";
import {ENRICHMENT_PREFIX_V1,ENRICHMENT_PREFIX_V2} from "@/lib/marketplace-source-enrichment";

export const BUCKYDROP_BULK_SHARDS=24;
const PREFIX="catalogue/buckydrop-bulk/v1/";
const TIME_LIMIT=245_000;
// BuckyDrop rejected two of four simultaneous requests. Keep one in flight;
// a funded account can still have a separate per-app throughput limit.
const WORKERS=1;
const MAX_BATCHES=40;
const MIN_BATCH_INTERVAL=7_500;
const ALL_SAVED=[BUCKYDROP_PREFIX_V1,BUCKYDROP_PREFIX_V2,ENRICHMENT_PREFIX_V1,ENRICHMENT_PREFIX_V2];
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const date=()=>new Date().toISOString().slice(0,10);
const resultPath=(shard:number)=>PREFIX+"progress/"+shard+".json";
type Candidate={url:string;hash:string;personal:boolean};
export type BuckydropBulkProgress={
 shard:number;date:string;startedAt:string;updatedAt:string;
 status:"running"|"finished"|"paused"|"failed"|"skipped";
 checked:number;saved:number;alreadySaved:number;unavailable:number;
 failed:number;skipped:number;totalCandidates:number;
 issue:string|null;
};
export type BuckydropBulkStatus={
 totalSaved:number;totalKnown:number;lastRun:string|null;
 checked:number;saved:number;failed:number;unavailable:number;
 pending:number;activeShards:number;pausedShards:number;lastIssue:string|null;
 buckydropSaved:number;hioBuySaved:number;sharedSaved:number;
 cooldownUntil:string|null;cooldownReason:string|null;
};
async function existingHashes(prefix:string):Promise<Set<string>>{
 const all=new Set<string>();
 let cursor:string|undefined;
 do{
  const page=await list({prefix,limit:1000,cursor});
  for(const b of page.blobs){
   const key=b.pathname.slice(prefix.length).replace(/\.json$/,"");
   if(/^[0-9a-f]{64}$/.test(key))all.add(key);
  }
  if(!page.hasMore)break;
  cursor=page.cursor;
 }while(cursor);
 return all;
}
export async function getAllEnrichedSourceHashes():Promise<Set<string>>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)return new Set();
 const parts=await Promise.all(ALL_SAVED.map(existingHashes));
 const all=new Set<string>();
 for(const part of parts)for(const key of part)all.add(key);
 return all;
}
function candidates(products:Awaited<ReturnType<typeof getProducts>>):Candidate[]{
 const found=new Map<string,Candidate>();
 // Canonical URLs dedupe even when both storefronts list the same supplier.
 for(const p of personalShopProducts){
  const url=normalizeMarketplaceLink(p.originalUrl);
  if(url)found.set(url,{url,hash:hash(url),personal:true});
 }
 for(const p of products){
  const url=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(url&&!found.has(url))found.set(url,{url,hash:hash(url),personal:false});
 }
 return [...found.values()].sort((a,b)=>Number(b.personal)-Number(a.personal)||
  a.hash.localeCompare(b.hash));
}
function belongs(sourceHash:string,shard:number){
 return Number.parseInt(sourceHash.slice(0,8),16)%BUCKYDROP_BULK_SHARDS===shard;
}
function basic(shard:number):BuckydropBulkProgress{
 const at=new Date().toISOString();
 return {shard,date:date(),startedAt:at,updatedAt:at,
  status:"running",checked:0,saved:0,alreadySaved:0,unavailable:0,
  failed:0,skipped:0,totalCandidates:0,issue:null};
}
async function writeProgress(p:BuckydropBulkProgress){
 await put(resultPath(p.shard),JSON.stringify({...p,updatedAt:new Date().toISOString()}),{
  access:"private",allowOverwrite:true,addRandomSuffix:false,contentType:"application/json"
 });
}
async function readJson<T>(path:string):Promise<T|null>{
 try{
  const result=await get(path,{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return null;
  return JSON.parse(await new Response(result.stream).text()) as T;
 }catch{return null;}
}
type GlobalBlock={code:string;until:number;strikes?:number;lastBlockedAt?:number};
async function getGlobalBlock():Promise<GlobalBlock|null>{
 const data=await readJson<GlobalBlock>(PREFIX+"block.json");
 return data&&typeof data.until==="number"&&data.until>Date.now()?data:null;
}
async function setGlobalBlock(code:string){
 const now=Date.now();
 const previous=await readJson<GlobalBlock>(PREFIX+"block.json");
 const related=code==="RATE_LIMIT"&&previous?.code===code&&
  typeof previous.lastBlockedAt==="number"&&now-previous.lastBlockedAt<24*60*60_000;
 const strikes=related?Math.min((previous?.strikes||1)+1,4):1;
 // Progressive cooldowns after genuine account-wide 429/provider-limit
 // responses. Never attempt to evade provider quota or force retries.
 const delays=[45,90,180,360];
 const duration=code==="RATE_LIMIT"?delays[strikes-1]*60_000:3*60*60_000;
 await put(PREFIX+"block.json",JSON.stringify({
  code,until:now+duration,strikes,lastBlockedAt:now
 }),{
  access:"private",allowOverwrite:true,addRandomSuffix:false,contentType:"application/json"
 });
}
async function permanentReject(sourceHash:string,code:string){
 try{
  await put(PREFIX+"unavailable/"+sourceHash+".json",
   JSON.stringify({code,recordedAt:new Date().toISOString()}),{
    access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
   });
 }catch{}
}
export async function getBuckydropBulkStatus():Promise<BuckydropBulkStatus>{
 const [prefixSets,all,progress,block]=await Promise.all([
  Promise.all(ALL_SAVED.map(existingHashes)),getProducts(),
  Promise.all(Array.from({length:BUCKYDROP_BULK_SHARDS},(_,i)=>readJson<BuckydropBulkProgress>(resultPath(i)))),
  getGlobalBlock()
 ]);
 const buckydrop=new Set([...prefixSets[0],...prefixSets[1]]);
 const hioBuy=new Set([...prefixSets[2],...prefixSets[3]]);
 const saved=new Set([...buckydrop,...hioBuy]);
 const c=candidates(all);
 let checked=0,added=0,failed=0,unavailable=0,activeShards=0,pausedShards=0;
 let lastRun:string|null=null,lastIssue:string|null=null;
 for(const p of progress){
  if(!p)continue;
  checked+=p.checked;added+=p.saved;failed+=p.failed;unavailable+=p.unavailable;
  // A function that exited abnormally must not be shown as still running forever.
  const recent=Date.now()-Date.parse(p.updatedAt)<10*60_000;
  if(p.status==="running"&&recent)activeShards++;
  if(p.status==="paused"||p.status==="failed"||(p.status==="running"&&!recent))pausedShards++;
  if(!lastRun||p.startedAt>lastRun){lastRun=p.startedAt;lastIssue=p.issue;}
 }
 const totalSaved=c.filter(p=>saved.has(p.hash)).length;
 const buckydropSaved=c.filter(p=>buckydrop.has(p.hash)).length;
 const hioBuySaved=c.filter(p=>hioBuy.has(p.hash)).length;
 const sharedSaved=c.filter(p=>buckydrop.has(p.hash)&&hioBuy.has(p.hash)).length;
 return {totalSaved,totalKnown:c.length,lastRun,checked,saved:added,
  failed,unavailable,pending:c.length-totalSaved,activeShards,pausedShards,lastIssue,
  buckydropSaved,hioBuySaved,sharedSaved,
  cooldownUntil:block?new Date(block.until).toISOString():null,
  cooldownReason:block?.code||null};
}
export async function runBuckydropBulkShard(shard:number):Promise<BuckydropBulkProgress>{
 if(!Number.isInteger(shard)||shard<0||shard>=BUCKYDROP_BULK_SHARDS)throw Error("invalid_shard");
 const p=basic(shard);
 if(!process.env.BLOB_READ_WRITE_TOKEN||process.env.BUCKYDROP_ENV!=="live"||
  process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true"||
  !process.env.BUCKYDROP_APP_CODE||!process.env.BUCKYDROP_APP_SECRET){
  p.status="paused";p.issue="BUCKYDROP_NOT_CONFIGURED";return p;
 }
 // Immutable run key means duplicate Vercel Cron delivery cannot rebill a shard.
 try{
  await put(PREFIX+"runs/"+p.date+"/"+shard+".json",
   JSON.stringify({startedAt:p.startedAt}),{
    access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
   });
 }catch{
  p.status="skipped";p.issue="ALREADY_STARTED_TODAY";return p;
 }
 const block=await getGlobalBlock();
 if(block){p.status="paused";p.issue=block.code;await writeProgress(p);return p;}
 let failedStreak=0,globalStop=false,lastBatchAt=0;
 try{
  const [saved,unavailable,products]=await Promise.all([
   getAllEnrichedSourceHashes(),
   existingHashes(PREFIX+"unavailable/"),
   getProducts()
  ]);
  const all=candidates(products).filter(x=>belongs(x.hash,shard));
  p.totalCandidates=all.length;
  await writeProgress(p);
  const start=Date.now();
  let batchCount=0;
  for(let i=0;i<all.length&&batchCount<MAX_BATCHES&&Date.now()-start<TIME_LIMIT-25_000&&!globalStop;){
   const batch:Candidate[]=[];
   while(i<all.length&&batch.length<WORKERS){
    const item=all[i++];
    if(saved.has(item.hash)){p.alreadySaved++;continue;}
    if(unavailable.has(item.hash)){p.unavailable++;continue;}
    if(!isApprovedSource(item.url,"live")){p.unavailable++;await permanentReject(item.hash,"INVALID_SOURCE");continue;}
    // Per-source per-day claim prevents duplicate debits after retries or
    // duplicated scheduler events. Never issue a call if the claim fails.
    try{
     await put(PREFIX+"attempts/"+p.date+"/"+item.hash+".json",
       JSON.stringify({startedAt:new Date().toISOString()}),{
        access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
       });
     batch.push(item);
    }catch{p.skipped++;}
   }
   if(!batch.length)break;
   const wait=MIN_BATCH_INTERVAL-(Date.now()-lastBatchAt);
   if(lastBatchAt&&wait>0)await new Promise<void>(resolve=>setTimeout(resolve,wait));
   lastBatchAt=Date.now();batchCount++;
   const results=await Promise.all(batch.map(async item=>{
    try{
     // A second provider-cache check protects sources enriched elsewhere
     // since this shard loaded its initial snapshot index.
     const detail=await queryBuckydropProduct(item.url);
     await saveNewBuckydropProduct(item.url,detail);
     return {item,ok:true as const,code:""};
    }catch(e){
     const code=e instanceof BuckydropError?e.code:"UNKNOWN_ERROR";
     return {item,ok:false as const,code};
    }
   }));
   for(const r of results){
    p.checked++;
    if(r.ok){p.saved++;saved.add(r.item.hash);failedStreak=0;continue;}
    if(r.code==="SNAPSHOT_SAVE_FAILED"){
     // An upstream response may already have been billed; do not repeat it
     // until a different day's recovery run. Surface the persistence error.
     p.failed++;p.issue="SNAPSHOT_SAVE_FAILED";globalStop=true;continue;
    }
    if(r.code==="NOT_FOUND"||r.code==="INVALID_SOURCE"||r.code==="EMPTY_PRODUCT"){
     p.unavailable++;await permanentReject(r.item.hash,r.code);failedStreak=0;continue;
    }
    p.failed++;p.issue=r.code;
    if(["ACCOUNT_FUNDS","ACCESS_DENIED","NOT_CONFIGURED","NOT_ENABLED","RATE_LIMIT"].includes(r.code)){
     globalStop=true;await setGlobalBlock(r.code);continue;
    }
    failedStreak++;
    if(failedStreak>=8){p.issue="REPEATED_UPSTREAM_FAILURES";globalStop=true;}
   }
   await writeProgress(p);
  }
  p.status=globalStop?"paused":"finished";
 }catch(e){
  p.status="failed";p.issue=e instanceof Error?e.name:"worker_failure";
 }
 await writeProgress(p);
 console.info("[herocon-buckydrop-bulk]",{
  shard,checked:p.checked,saved:p.saved,existing:p.alreadySaved,
  unavailable:p.unavailable,failed:p.failed,status:p.status,issue:p.issue
 });
 return p;
}
