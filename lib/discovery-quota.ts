import "server-only";
import {createHash} from "node:crypto";
import {list,put,del} from "@vercel/blob";
import {CUSTOMER_DAILY_LIVE_SEARCH_LIMIT,SHARED_DAILY_LIVE_SEARCH_LIMIT,INTRO_SHARED_DAILY_LIMIT,LIVE_CREDITS,FREE_METHOD_CREDITS,creditPeriod,utcDay,type DiscoveryTier,type FreeMethod} from "@/lib/discovery-access-model";
async function claim(prefix:string,limit:number):Promise<string|null>{
 const page=await list({prefix,limit:limit+1});
 const used=new Set(page.blobs.map(b=>b.pathname));
 if(used.size>=limit)return null;
 for(let i=1;i<=limit;i++){
  const key=prefix+i+".json";if(used.has(key))continue;
  try{await put(key,"{}",{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});return key;}catch{/* Fail closed on a contested or unavailable claim. */}
 }
 return null;
}
const accountKey=(email:string)=>createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
const creditPrefix=(email:string,tier:DiscoveryTier,now:number)=>"hiobuy/discovery-credits/v1/"+accountKey(email)+"/"+tier+"/"+creditPeriod(tier,now)+"/";
// New per-method introductory grant; legacy pooled claims cannot identify a method.
const freePrefix=(email:string,method:FreeMethod)=>"hiobuy/discovery-credits/v2/"+accountKey(email)+"/free/once/"+method+"/";
async function release(key:string){try{await del(key);}catch{console.warn("herocon-credit-release-unavailable");}}
export async function discoveryBalance(email:string,tier:DiscoveryTier){
 if(tier==="free"){
  const methods=await Promise.all((Object.keys(FREE_METHOD_CREDITS) as FreeMethod[]).map(async method=>{
   const limit=FREE_METHOD_CREDITS[method],page=await list({prefix:freePrefix(email,method),limit:limit+1});return [method,{limit,remaining:Math.max(0,limit-page.blobs.length)}] as const;
  }));
  return {tier,limit:LIVE_CREDITS.free,remaining:methods.reduce((n,[,v])=>n+v.remaining,0),methods:Object.fromEntries(methods)};
 }
 const limit=LIVE_CREDITS[tier],page=await list({prefix:creditPrefix(email,tier,Date.now()),limit:limit+1});
 return {tier,limit,remaining:Math.max(0,limit-page.blobs.length)};
}
export async function reserveDiscovery(uid:string,email:string,tier:DiscoveryTier,method:FreeMethod):Promise<{status:"account"|"daily"|"shared"|"ok";credit?:string}>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw Error("Quota storage unavailable.");
 const now=Date.now(),prefix="hiobuy/discovery-quota/v1/"+utcDay(now)+"/",account=createHash("sha256").update(uid).digest("hex");
 const credit=await claim(tier==="free"?freePrefix(email,method):creditPrefix(email,tier,now),tier==="free"?FREE_METHOD_CREDITS[method]:LIVE_CREDITS[tier]);if(!credit)return {status:"account"};
 let daily:string|null=null,intro:string|null=null,shared:string|null=null;
 try{
  daily=await claim(prefix+"accounts/"+account+"/",CUSTOMER_DAILY_LIVE_SEARCH_LIMIT);if(!daily)return {status:"daily"};
  if(tier!=="premium"){intro=await claim(prefix+"intro/",INTRO_SHARED_DAILY_LIMIT);if(!intro)return {status:"shared"};}
  shared=await claim(prefix+"shared/",SHARED_DAILY_LIVE_SEARCH_LIMIT);if(!shared)return {status:"shared"};
  return {status:"ok",credit};
 }finally{if(!shared){await release(credit);if(daily)await release(daily);if(intro)await release(intro);}}
}
// Keep shared and daily claims even on upstream errors: a provider may bill an unsuccessful call.
export async function refundDiscovery(credit:string|undefined){if(credit)await release(credit);}
