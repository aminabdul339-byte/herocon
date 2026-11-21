import {NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {list,put} from "@vercel/blob";
import {personalShopProducts,audienceProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getOrSaveBuckydropProduct} from "@/lib/buckydrop-cache";
import {BuckydropError} from "@/lib/buckydrop";
import {revalidateTag} from "next/cache";
import {revalidatePath} from "next/cache";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;

// Merchant-only, explicitly billable, small bounded batches. No scheduled
// crawler and no paid lookups from public product or category pages.
type Scope="women"|"men"|"all";
const SNAPSHOTS="catalogue/buckydrop-snapshots/v1/";
const ATTEMPTS="catalogue/shop-personal-import-attempts/v1/";
const BLOCKS="catalogue/buckydrop-import-blocks/v1/";
const MAX_BATCH=3;
const DAILY_MAX=12;
const WAIT_MS=2500;
const STOP_CODES=new Set(["RATE_LIMIT","ACCESS_DENIED","ACCOUNT_FUNDS",
 "UPSTREAM_HTTP_ERROR","UPSTREAM_UNAVAILABLE","INVALID_RESPONSE",
 "SNAPSHOT_SAVE_FAILED","SNAPSHOT_STORAGE_UNAVAILABLE",
 "SNAPSHOT_READ_FAILED","SNAPSHOT_INVALID"]);
const headers={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const json=(body:unknown,status=200)=>NextResponse.json(body,{status,headers});
const today=()=>new Date().toISOString().slice(0,10);
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
const slug=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g,"-");
const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

function authorized(request:Request):boolean{
 const expected=process.env.HEROCON_CATALOGUE_IMPORT_KEY||"";
 const supplied=request.headers.get("x-herocon-catalogue-admin")||"";
 return expected.length>=48&&expected.length===supplied.length&&
   timingSafeEqual(Buffer.from(expected),Buffer.from(supplied));
}
function enabled():boolean {
 return Boolean(process.env.BLOB_READ_WRITE_TOKEN)&&
  process.env.BUCKYDROP_ENV==="live"&&
  process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP==="true"&&
  Boolean(process.env.BUCKYDROP_APP_CODE)&&Boolean(process.env.BUCKYDROP_APP_SECRET);
}
function scopeFor(input:unknown):Scope{
 return input==="men"?"men":input==="all"?"all":"women";
}
function selection(scope:Scope){
 return scope==="all"?personalShopProducts:audienceProducts(scope);
}
async function paths(prefix:string):Promise<string[]>{
 const items:string[]=[];
 let cursor:string|undefined;
 do{
  const page=await list({prefix,limit:1000,cursor});
  items.push(...page.blobs.map(b=>b.pathname));
  if(!page.hasMore)break;
  cursor=page.cursor;
 }while(cursor);
 return items;
}
async function state(scope:Scope){
 const [saved,attempts,blocks]=await Promise.all([
  paths(SNAPSHOTS),paths(ATTEMPTS+today()+"/"),paths(BLOCKS+today()+"/")
 ]);
 const savedHashes=new Set(saved.map(p=>p.slice(SNAPSHOTS.length).replace(/\.json$/,"")));
 const attemptedHashes=new Set(attempts.map(p=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"")));
 const products=selection(scope);
 const seen=new Set<string>();
 const remaining:{id:string;url:string;category:string;name:string}[]=[];
 let savedCount=0,attempted=0;
 const categories:Record<string,{total:number;saved:number;eligible:number}>={};
 for(const p of products){
  const url=normalizeMarketplaceLink(p.originalUrl);
  if(!url||seen.has(url))continue;
  seen.add(url);
  const key=hash(url);
  const bucket=categories[p.category]||{total:0,saved:0,eligible:0};
  bucket.total++;
  if(savedHashes.has(key)){savedCount++;bucket.saved++;}
  else if(attemptedHashes.has(key)){attempted++;}
  else{
    remaining.push({id:p.id,url,category:p.category,name:p.name});
    bucket.eligible++;
  }
  categories[p.category]=bucket;
 }
 const blockedReason=blocks.length
   ?blocks[0].slice((BLOCKS+today()+"/").length).replace(/\.json$/,"")
   :null;
 const remainingDaily=Math.max(0,DAILY_MAX-attempts.length);
 return {total:seen.size,saved:savedCount,attemptedInScope:attempted,
   attemptsToday:attempts.length,eligible:remaining.length,
   remainingDaily,blockedReason,items:remaining,
   categories:Object.entries(categories).sort((a,b)=>b[1].total-a[1].total)
     .map(([name,value])=>({name,...value}))};
}
export async function GET(request:Request){
 if(!authorized(request))return json({error:"Unauthorized"},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)
   return json({error:"Private catalogue storage is not configured"},503);
 try{
  const scope=scopeFor(new URL(request.url).searchParams.get("scope"));
  const s=await state(scope);
  const {items:_,...safe}=s;
  return json({...safe,scope,apiReady:enabled(),dailyMaximum:DAILY_MAX,
    notice:"Saved records are reused without supplier charges. A new product lookup may be billable. Only a deliberate button click sends paid requests. No automatic retries."});
 }catch{return json({error:"Unable to read personal catalogue import status"},503);}
}
export async function POST(request:Request){
 if(!authorized(request))return json({error:"Unauthorized"},401);
 if(!enabled())return json({error:"Live sourcing-partner lookup or private storage is unavailable"},503);
 let body:unknown;
 try{
  const text=await request.text();
  if(text.length>350)return json({error:"Request too large"},413);
  body=JSON.parse(text);
 }catch{return json({error:"Invalid request body"},400);}
 if(!body||typeof body!=="object"||Array.isArray(body))return json({error:"Invalid request"},400);
 const options=body as Record<string,unknown>;
 if(options.acceptBillable!==true)return json({error:"Explicit acceptance of possible supplier charges required"},400);
 const scope=scopeFor(options.scope);
 const requested=typeof options.max==="number"&&Number.isInteger(options.max)?options.max:1;
 if(requested<1||requested>MAX_BATCH)return json({error:"Batch limit is 1 to 3 products"},400);
 let s:Awaited<ReturnType<typeof state>>;
 try{s=await state(scope);}catch{return json({error:"Unable to inspect import queue"},503);}
 if(s.blockedReason)return json({error:"Supplier requests paused due to a recorded restriction",blockedReason:s.blockedReason},409);
 const limit=Math.min(requested,s.remainingDaily,s.items.length);
 if(!limit)return json({requested,attempted:0,saved:0,failed:0,remainingDaily:s.remainingDaily,results:[],stopReason:s.remainingDaily===0?"Daily safety limit reached":"No eligible unattempted listings in this scope"});
 const results:{id:string;category:string;status:"saved"|"already_saved"|"failed";code?:string;options?:number}[]=[];
 let stopReason:string|null=null;
 for(const item of s.items.slice(0,limit)){
  const pathname=ATTEMPTS+today()+"/"+hash(item.url)+".json";
  try{
   await put(pathname,JSON.stringify({productId:item.id,category:item.category,
     requestedAt:new Date().toISOString()}),{
     access:"private",addRandomSuffix:false,allowOverwrite:false,
     contentType:"application/json"
   });
  }catch{
   stopReason="Unable to reserve an import attempt safely. No further requests sent.";
   break;
  }
  try{
   const {product,cacheStatus}=await getOrSaveBuckydropProduct(item.url);
   results.push({id:item.id,category:item.category,status:cacheStatus==="hit"?"already_saved":"saved",options:product.variants.length});
   if(cacheStatus==="stored"){
    revalidateTag("herocon-saved-partner-index");
    revalidatePath("/shop-for-yourself");
    revalidatePath("/shop-for-yourself/"+encodeURIComponent(item.id));
   }
  }catch(error){
   const code=error instanceof BuckydropError?error.code:"UNKNOWN";
   results.push({id:item.id,category:item.category,status:"failed",code});
   if(STOP_CODES.has(code)){
    try{
      await put(BLOCKS+today()+"/"+slug(code)+".json",JSON.stringify({
        source:"shop-personal",code,blockedAt:new Date().toISOString()
      }),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
    }catch{}
    stopReason="Stopped on supplier restriction: "+code+". Further paid requests are paused.";
    break;
   }
  }
  if(results.length<limit)await wait(WAIT_MS);
 }
 return json({requested,attempted:results.length,
   saved:results.filter(r=>r.status==="saved").length,
   existing:results.filter(r=>r.status==="already_saved").length,
   failed:results.filter(r=>r.status==="failed").length,
   remainingDaily:Math.max(0,s.remainingDaily-results.length),
   results,stopReason,
   notice:"Only newly needed supplier records were requested. Saved snapshots remain reusable for the main and personal catalogues."});
}
