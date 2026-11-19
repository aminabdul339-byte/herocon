import {NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {list,put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getOrSaveBuckydropProduct} from "@/lib/buckydrop-cache";
import {BuckydropError} from "@/lib/buckydrop";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

/**
 * Operator-only catalogue seeder. The merchant has explicitly authorised a
 * whole-catalogue import at the provider's published/requested rates.
 *
 * The daily ceiling is larger than the current catalogue. It is a safety
 * backstop against a faulty runner, NOT a monetary limit.
 *
 * Respect BuckyDrop permission, billing and rate-limit responses: never
 * bypass supplier restrictions, retry-rate-limited operations aggressively,
 * or make concurrent bulk calls. Individual calls are reserved in durable
 * storage before they are sent. No background cron is enabled.
 */
const LIMIT=5000;
const PER_REQUEST=3;
const DELAY_MS=2200;
const NEW_BATCH="makeup-brushes-20261119";
type ImportScope="all"|"new-makeup";
const ATTEMPTS="catalogue/buckydrop-import-attempts/v1/";
const RETRIES="catalogue/buckydrop-import-retries/v1/";
const BLOCKS="catalogue/buckydrop-import-blocks/v1/";
const FAILURES="catalogue/buckydrop-import-failures/v1/";
const RESTRICTED=new Set(["ACCOUNT_FUNDS","RATE_LIMIT","ACCESS_DENIED",
 "SNAPSHOT_SAVE_FAILED","SNAPSHOT_STORAGE_UNAVAILABLE","SNAPSHOT_READ_FAILED","SNAPSHOT_INVALID"]);
const SAVED="catalogue/buckydrop-snapshots/v1/";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const sha=(s:string)=>createHash("sha256").update(s).digest("hex");
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"other";
const pause=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

function authorized(request:Request){
 const secret=process.env.HEROCON_CATALOGUE_IMPORT_KEY||"";
 const provided=request.headers.get("x-herocon-catalogue-admin")||"";
 return secret.length>=48 && provided.length===secret.length &&
  timingSafeEqual(Buffer.from(secret),Buffer.from(provided));
}
async function allPaths(prefix:string):Promise<string[]>{
 const paths:string[]=[];let cursor:string|undefined;
 do{
  const result=await list({prefix,cursor,limit:1000});
  paths.push(...result.blobs.map(blob=>blob.pathname));
  if(!result.hasMore)break;
  cursor=result.cursor;
 }while(cursor);
 return paths;
}
function day(){return new Date().toISOString().slice(0,10);}
async function state(scope:ImportScope="all"){
 const [products,existing,attempted,retried,blocks,failures]=await Promise.all([
  getProducts(),allPaths(SAVED),allPaths(ATTEMPTS+day()+"/"),
  allPaths(RETRIES+day()+"/"),allPaths(BLOCKS+day()+"/"),
  allPaths(FAILURES+day()+"/")
 ]);
 const savedHashes=new Set(existing.map(p=>p.slice(SAVED.length).replace(/\.json$/,"")));
 const attemptedHashes=new Set(attempted.map(p=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"")));
 const retriedHashes=new Set(retried.map(p=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"")));
 const failureCounts=new Map<string,number>();
 for(const path of failures){
  const code=path.slice((FAILURES+day()+"/").length).split("/")[0];
  failureCounts.set(code,(failureCounts.get(code)||0)+1);
 }
 const categoryCounts=new Map<string,number>();
 for(const p of attempted){
  const category=p.slice((ATTEMPTS+day()+"/").length).split("/")[0];
  categoryCounts.set(category,(categoryCounts.get(category)||0)+1);
 }
 const categories=new Map<string,{slug:string;list:{url:string;id:string;title:string}[];retry:{url:string;id:string;title:string}[];missing:number}>();
 const deduped=new Set<string>();
 let scopedTotal=0,scopedSaved=0;
 for(const p of products){
  if(scope==="new-makeup"&&p.sourceBatch!==NEW_BATCH)continue;
  const url=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(!url||deduped.has(url))continue;
  deduped.add(url);
  scopedTotal++;
  if(savedHashes.has(sha(url)))scopedSaved++;
  const category=p.category||"Other";
  const entry=categories.get(category)||{slug:slug(category),list:[],retry:[],missing:0};
  if(!savedHashes.has(sha(url))){
   entry.missing++;
   const candidate={url,id:p.doppelProductId||p.canonicalId||"",title:p.title};
   if(!attemptedHashes.has(sha(url)))entry.list.push(candidate);
   else if(!retriedHashes.has(sha(url)))entry.retry.push(candidate);
  }
  categories.set(category,entry);
 }
 const options=[...categories.entries()].filter(([,x])=>x.missing>0)
  .sort((a,b)=>(categoryCounts.get(a[1].slug)||0)-(categoryCounts.get(b[1].slug)||0)||
        b[1].list.length-a[1].list.length||a[0].localeCompare(b[0]));
 return {catalogueProducts:scopedTotal,snapshots:scopedSaved,attemptsToday:attempted.length,retriedToday:retried.length,
  remainingDaily:Math.max(0,LIMIT-attempted.length-retried.length),
  blockedReason:blocks.length?blocks[0].slice((BLOCKS+day()+"/").length).replace(/\.json$/,""):null,
  failureCodes:[...failureCounts].map(([code,count])=>({code,count})).sort((a,b)=>b.count-a.count).slice(0,12),
  categories:options,categoriesTotal:categories.size};
}

export async function GET(request:Request){
 if(!authorized(request))return reply({error:"Unauthorized"},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return reply({error:"Private Blob store not configured"},503);
 try{
  const scope:ImportScope=new URL(request.url).searchParams.get("scope")==="new-makeup"?"new-makeup":"all";
  const s=await state(scope);
  return reply({catalogueProducts:s.catalogueProducts,permanentlySaved:s.snapshots,attemptsToday:s.attemptsToday,
   retriedToday:s.retriedToday,remainingDailyRequests:s.remainingDaily,
   firstAttemptEligible:s.categories.reduce((n,[,v])=>n+v.list.length,0),
   retryableToday:s.categories.reduce((n,[,v])=>n+v.retry.length,0),
   blockedReason:s.blockedReason,
   nextUtcReset:new Date(Date.parse(day()+"T00:00:00.000Z")+86400000).toISOString(),
   failureCodes:s.failureCodes,
   categories:s.categories.map(([name,v])=>({name,missing:v.missing,firstAttemptEligible:v.list.length,retryableToday:v.retry.length})),
   maxDailyNewLookups:LIMIT,notice:"Merchant-authorised import. A single manual retry may be billable. No automatic retries."});
 }catch{return reply({error:"Unable to inspect private import state"},503);}
}

export async function POST(request:Request){
 if(!authorized(request))return reply({error:"Unauthorized"},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN||process.env.BUCKYDROP_ENV!=="live"||
  process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true")return reply({error:"Live private storage or supplier lookup is not ready"},503);
 let requested=PER_REQUEST;
 let scope:ImportScope="all";
 let retryMissing=false;
 try{const raw=await request.text();if(raw.length>350)return reply({error:"Request too large"},413);
  if(raw.trim()){const body=JSON.parse(raw);if(body&&typeof body.max==="number"&&Number.isInteger(body.max))requested=Math.min(PER_REQUEST,Math.max(1,body.max));
   if(body&&body.scope==="new-makeup")scope="new-makeup";
   retryMissing=Boolean(body&&body.retryMissing===true);}
 }catch{return reply({error:"Invalid request body"},400);}
 let s:Awaited<ReturnType<typeof state>>;
 try{s=await state(scope);}
 catch{return reply({error:"Unable to inspect saved catalogue or usage budget"},503);}
 const results:{category:string;id:string;result:"saved"|"already_saved"|"failed";code?:string;variantCount?:number}[]=[];
 let stopReason:string|null=null;
 const limit=s.blockedReason?0:Math.min(requested,s.remainingDaily);
 if(s.blockedReason)stopReason="Supplier or storage restriction ("+s.blockedReason+") recorded today. No further requests will be sent today.";
 for(let i=0;i<limit;i++){
  const best=s.categories.find(([,v])=>(retryMissing?v.retry:v.list).length>0);
  if(!best)break;
  const [category,entry]=best;
  const candidate=(retryMissing?entry.retry:entry.list).shift()!;
  // Give other categories priority on the next call.
  s.categories.push(s.categories.shift()!);
  const key=sha(candidate.url);
  const pathname=(retryMissing?RETRIES:ATTEMPTS)+day()+"/"+entry.slug+"/"+key+".json";
  try{
   await put(pathname,JSON.stringify({
    version:1,category,productId:candidate.id,requestedAt:new Date().toISOString(),retryMissing
   }),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});
  }catch{
   results.push({category,id:candidate.id,result:"failed",code:"ATTEMPT_RESERVATION_FAILED"});
   stopReason="Unable to reserve supplier request safely.";
   break;
  }
  try{
   const {product,cacheStatus}=await getOrSaveBuckydropProduct(candidate.url);
   results.push({category,id:candidate.id,result:cacheStatus==="hit"?"already_saved":"saved",variantCount:product.variants.length});
  }catch(error){
   const code=error instanceof BuckydropError?error.code:"UNKNOWN";
   results.push({category,id:candidate.id,result:"failed",code});
   try{await put(FAILURES+day()+"/"+slug(code)+"/"+key+".json",
    JSON.stringify({code,failedAt:new Date().toISOString()}),
    {access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});}catch{}
   if(RESTRICTED.has(code)){
    try{await put(BLOCKS+day()+"/"+slug(code)+".json",
     JSON.stringify({code,blockedAt:new Date().toISOString()}),
     {access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});}catch{}
    stopReason="Stopped on "+code+"; no further supplier calls today until the restriction has been investigated.";
    break;
   }
  }
  if(i+1<limit)await pause(DELAY_MS);
 }
 return reply({requested,retryMissing,attempted:results.length,
  saved:results.filter(x=>x.result==="saved").length,
  alreadySaved:results.filter(x=>x.result==="already_saved").length,
  failed:results.filter(x=>x.result==="failed").length,
  results,stopReason,
  remainingDailyRequests:Math.max(0,s.remainingDaily-results.length),
  note:"Merchant authorised. Only unsaved products are sent. A manual retry is allowed once per product per UTC day. Supplier restrictions stop further requests."});
}
