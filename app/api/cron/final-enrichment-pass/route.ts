import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {getBuckydropBulkStatus,runBuckydropBulkShard,BUCKYDROP_CATCHUP_SHARD} from "@/lib/buckydrop-bulk";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(req:Request){
 const secret=process.env.CRON_SECRET||"",a=Buffer.from(req.headers.get("authorization")||""),b=Buffer.from("Bearer "+secret);
 if(secret.length<32||a.length!==b.length||!timingSafeEqual(a,b))return reply({error:"unauthorized"},401);
 if(process.env.VERCEL_ENV!=="production"||new Date().toISOString().slice(0,10)!=="2026-11-25")return reply({status:"not_eligible"},403);
 try{
  const before=await getBuckydropBulkStatus();
  if(before.activeShards||before.cooldownReason||!before.eligibleNow){
   const result={status:"no_safe_work",pending:before.pending,eligible:before.eligibleNow,active:before.activeShards,cooldown:before.cooldownReason};
   console.info("[herocon-final-enrichment-pass]",result);return reply(result);
  }
  // Existing owner-recovery slot was not consumed by the morning no-op.
  // Reuse the existing immutable daily claims and provider cooldown, never reset them.
  const run=await runBuckydropBulkShard(BUCKYDROP_CATCHUP_SHARD,true);
  const after=await getBuckydropBulkStatus();
  const result={status:run.status,checked:run.checked,saved:run.saved,unavailable:run.unavailable,failed:run.failed,issue:run.issue,total:after.totalKnown,enriched:after.totalSaved,pending:after.pending,permanent:after.permanentlyUnavailable,eligible:after.eligibleNow};
  console.info("[herocon-final-enrichment-pass]",result);return reply(result);
 }catch(e){console.error("[herocon-final-enrichment-pass-error]",e instanceof Error?e.name:"unknown");return reply({error:"worker_failed"},503);}
}
