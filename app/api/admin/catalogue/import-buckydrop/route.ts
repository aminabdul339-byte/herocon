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
 * Operator-only and deliberately BOUNDED catalogue seeder.
 *
 * This is a REQUEST-COUNT limit, not a CNY amount cap. BuckyDrop invoices
 * billable API requests the following day, and the actual per-call rate must
 * be checked in the developer console.
 *
 * New calls are always reserved in persistent Blob storage BEFORE supplier
 * invocation. No cron, background tasks or unlimited crawl is enabled.
 */
const LIMIT=25;
const PER_REQUEST=3;
const DELAY_MS=2200;
const ATTEMPTS="catalogue/buckydrop-import-attempts/v1/";
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
async function state(){
 const [products,existing,attempted]=await Promise.all([
  getProducts(),allPaths(SAVED),allPaths(ATTEMPTS+day()+"/")
 ]);
 const savedHashes=new Set(existing.map(p=>p.slice(SAVED.length).replace(/\.json$/,"")));
 const attemptedHashes=new Set(attempted.map(p=>p.slice(p.lastIndexOf("/")+1).replace(/\.json$/,"")));
 const categoryCounts=new Map<string,number>();
 for(const p of attempted){
  const category=p.slice((ATTEMPTS+day()+"/").length).split("/")[0];
  categoryCounts.set(category,(categoryCounts.get(category)||0)+1);
 }
 const categories=new Map<string,{slug:string;list:{url:string;id:string;title:string}[]}>();
 const deduped=new Set<string>();
 for(const p of products){
  const url=normalizeMarketplaceLink(p.originalMarketplaceUrl);
  if(!url||deduped.has(url))continue;
  deduped.add(url);
  const category=p.category||"Other";
  const entry=categories.get(category)||{slug:slug(category),list:[]};
  if(!savedHashes.has(sha(url))&&!attemptedHashes.has(sha(url))){
   entry.list.push({url,id:p.doppelProductId||p.canonicalId||"",title:p.title});
  }
  categories.set(category,entry);
 }
 const options=[...categories.entries()].filter(([,x])=>x.list.length>0)
  .sort((a,b)=>(categoryCounts.get(a[1].slug)||0)-(categoryCounts.get(b[1].slug)||0)||
        b[1].list.length-a[1].list.length||a[0].localeCompare(b[0]));
 return {catalogueProducts:products.length,snapshots:existing.length,attemptsToday:attempted.length,remainingDaily:Math.max(0,LIMIT-attempted.length),
  categories:options,categoriesTotal:categories.size};
}

export async function GET(request:Request){
 if(!authorized(request))return reply({error:"Unauthorized"},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN)return reply({error:"Private Blob store not configured"},503);
 try{
  const s=await state();
  return reply({catalogueProducts:s.catalogueProducts,permanentlySaved:s.snapshots,attemptsToday:s.attemptsToday,
   remainingDailyRequests:s.remainingDaily,categories:s.categories.map(([name,v])=>({name,missing:v.list.length})),
   maxDailyNewLookups:LIMIT,notice:"Request count only: BuckyDrop charges are billed later. Per-request fee is not known."});
 }catch{return reply({error:"Unable to inspect private import state"},503);}
}

export async function POST(request:Request){
 if(!authorized(request))return reply({error:"Unauthorized"},401);
 if(!process.env.BLOB_READ_WRITE_TOKEN||process.env.BUCKYDROP_ENV!=="live"||
  process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true")return reply({error:"Live private storage or supplier lookup is not ready"},503);
 let requested=PER_REQUEST;
 try{const raw=await request.text();if(raw.length>300)return reply({error:"Request too large"},413);
  if(raw.trim()){const body=JSON.parse(raw);if(body&&typeof body.max==="number"&&Number.isInteger(body.max))requested=Math.min(PER_REQUEST,Math.max(1,body.max));}
 }catch{return reply({error:"Invalid request body"},400);}
 let s:Awaited<ReturnType<typeof state>>;
 try{s=await state();}
 catch{return reply({error:"Unable to inspect saved catalogue or usage budget"},503);}
 const results:{category:string;id:string;result:"saved"|"already_saved"|"failed";code?:string;variantCount?:number}[]=[];
 let stopReason:string|null=null;
 const limit=Math.min(requested,s.remainingDaily);
 for(let i=0;i<limit;i++){
  const best=s.categories.find(([,v])=>v.list.length>0);
  if(!best)break;
  const [category,entry]=best;
  const candidate=entry.list.shift()!;
  // Give other categories priority on the next call.
  s.categories.push(s.categories.shift()!);
  const key=sha(candidate.url);
  const pathname=ATTEMPTS+day()+"/"+entry.slug+"/"+key+".json";
  try{
   await put(pathname,JSON.stringify({
    version:1,category,productId:candidate.id,requestedAt:new Date().toISOString()
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
   if(["ACCOUNT_FUNDS","RATE_LIMIT","ACCESS_DENIED","SNAPSHOT_SAVE_FAILED",
      "SNAPSHOT_STORAGE_UNAVAILABLE","SNAPSHOT_READ_FAILED","SNAPSHOT_INVALID"].includes(code)){
    stopReason="Stopped on "+code+"; no further supplier calls in this request.";
    break;
   }
  }
  if(i+1<limit)await pause(DELAY_MS);
 }
 return reply({requested,attempted:results.length,
  saved:results.filter(x=>x.result==="saved").length,
  alreadySaved:results.filter(x=>x.result==="already_saved").length,
  failed:results.filter(x=>x.result==="failed").length,
  results,stopReason,
  remainingDailyRequests:Math.max(0,s.remainingDaily-results.length),
  note:"Only previously unsaved products are sent to BuckyDrop. This request-count limit cannot guarantee a maximum fee in CNY."});
}
