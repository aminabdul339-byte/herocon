import {NextResponse} from "next/server";
import {get} from "@vercel/blob";
import {currentCustomer} from "@/lib/customer-auth";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const HEADERS={"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"};
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:HEADERS});
export async function GET(req:Request){
 const customer=await currentCustomer();
 const owner=process.env.HEROCON_TRIAL_OWNER_USER_ID?.trim()||process.env.HEROCON_MEMBERSHIP_OWNER_TEST_USER_ID?.trim();
 if(!owner||customer?.id!==owner)return reply({error:"Sign in as Herocon owner"},401);
 const query=new URL(req.url).searchParams;
 const day=query.get("day")||new Date().toISOString().slice(0,10);
 if(!["2026-11-25","2026-11-26"].includes(day))return reply({error:"Invalid report day"},400);
 const results=await Promise.all([0,1,2,3].map(async shard=>{
  try{const blob=await get("catalogue/full-quality-audit/v1/"+day+"/"+shard+".json",{access:"private"});
   if(!blob||blob.statusCode!==200||!blob.stream)return null;
   return JSON.parse(await new Response(blob.stream).text());
  }catch{return null;}
 }));
 const shard=query.get("shard");
 if(shard!==null){if(!/^[0-3]$/.test(shard))return reply({error:"Invalid shard"},400);return reply(results[Number(shard)]||{status:"not_yet_available"},results[Number(shard)]?200:404);}
 const summaries=results.map(r=>r?.summary||null);
 return reply({day,complete:summaries.every(s=>s?.complete===true),shards:summaries,notice:"Saved-data audit only; image reachability, visual accuracy, supplier inventory and checkout are not independently tested. Review flags are not automatic deletions. For row-level issues append &shard=0, 1, 2 or 3 to ?day="+day});
}
