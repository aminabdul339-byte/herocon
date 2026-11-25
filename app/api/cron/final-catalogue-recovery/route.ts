import {NextResponse} from "next/server";
import {createHash,timingSafeEqual} from "node:crypto";
import {put} from "@vercel/blob";
import {getProducts} from "@/lib/catalogue-server";
import {personalShopProducts} from "@/lib/personal-shop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {getAllEnrichedSourceHashes,getBuckydropBulkStatus,runBuckydropBulkShard,BUCKYDROP_CATCHUP_SHARD} from "@/lib/buckydrop-bulk";
import {readMarketplaceSource,saveMarketplaceSource,SourceEnrichmentError} from "@/lib/marketplace-source-enrichment";
import {getAutomaticEnrichmentState} from "@/lib/automatic-enrichment";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET||"",auth=req.headers.get("authorization")||"";
 const a=Buffer.from(auth),b=Buffer.from("Bearer "+secret);
 if(secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))return reply({error:"unauthorized"},401);
 if(process.env.VERCEL_ENV!=="production"||new Date().toISOString().slice(0,10)!=="2026-11-25")return reply({status:"not_eligible"},403);
 try{
  await put("catalogue/automatic-enrichment/v1/runs/2026-11-25-owner-final-recovery.json",JSON.stringify({startedAt:new Date().toISOString()}),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
 }catch{return reply({status:"already_started_or_storage_unavailable"},409);}
 try{
  const before=await getBuckydropBulkStatus();
  console.info("[herocon-final-recovery-before]",{total:before.totalKnown,saved:before.totalSaved,pending:before.pending,permanentlyUnavailable:before.permanentlyUnavailable,eligibleNow:before.eligibleNow,cooldown:before.cooldownReason});
  // The morning HIOBuy dashboard reported 20 NOT_FOUND on 1688 and two
  // transient Weidian upstream errors. Never retry known missing 1688
  // products or enable paid Taobao. At most two Weidian requests.
  const state=await getAutomaticEnrichmentState();
  const blocked=state.blockedChannels.weidian;
  const existing=await getAllEnrichedSourceHashes();
  const products=await getProducts();
  const links=new Set([...products.map(p=>normalizeMarketplaceLink(p.originalMarketplaceUrl)),...personalShopProducts.map(p=>normalizeMarketplaceLink(p.originalUrl))].filter((s):s is string=>Boolean(s)));
  const pending=[...links].filter(s=>new URL(s).hostname==="weidian.com"&&!existing.has(createHash("sha256").update(s).digest("hex")));
  let checked=0,saved=0;const errors:Record<string,number>={};
  if(process.env.HIOBUY_API_KEY&&state.lastRun?.startsWith("2026-11-25")&&state.lastRunRequests===22&&state.lastRunSaved===0&&!state.lastIssue&&(!blocked||blocked.until<=Date.now())){
   for(const url of pending.slice(0,2)){
    if(checked)await new Promise<void>(r=>setTimeout(r,3500));
    const key=createHash("sha256").update(url).digest("hex");
    if((await getAllEnrichedSourceHashes()).has(key))continue;
    checked++;
    try{await saveMarketplaceSource(await readMarketplaceSource(url));saved++;}
    catch(e){const code=e instanceof SourceEnrichmentError?e.code:"unknown";errors[code]=(errors[code]||0)+1;if(["INVALID_API_KEY","INSUFFICIENT_SCOPE","QUOTA_EXCEEDED","PLATFORM_QUOTA_EXCEEDED","RATE_LIMITED","RATE_LIMIT_EXCEEDED","hiobuy_rate_limited","CHANNEL_NOT_AUTHORIZED","PAID_SUBSCRIPTION_REQUIRED","CHANNEL_CAPABILITY_NOT_SUPPORTED","enrichment_storage_failed"].includes(code))break;}
   }
  }
  const middle=await getBuckydropBulkStatus();
  // Only eligible unattempted sources; existing permanent rejects and
  // daily claims remain in force. No cooldown or provider limits reset.
  const bucky=middle.eligibleNow>0&&!middle.cooldownReason&&middle.activeShards===0?await runBuckydropBulkShard(BUCKYDROP_CATCHUP_SHARD,true):null;
  const after=await getBuckydropBulkStatus();
  const result={status:"finished",hiobuy:{checked,saved,errors,remainingWeidianBefore:pending.length},buckydrop:bucky?{checked:bucky.checked,saved:bucky.saved,unavailable:bucky.unavailable,failed:bucky.failed,issue:bucky.issue}:{checked:0,saved:0,reason:middle.cooldownReason||(!middle.eligibleNow?"no_eligible_sources":"active_shard")},total:after.totalKnown,saved:after.totalSaved,pending:after.pending,permanentlyUnavailable:after.permanentlyUnavailable,eligibleNow:after.eligibleNow};
  console.info("[herocon-final-recovery-result]",result);
  return reply(result);
 }catch(e){console.error("[herocon-final-recovery-error]",e instanceof Error?e.name:"unknown");return reply({status:"failed"},503);}
}
