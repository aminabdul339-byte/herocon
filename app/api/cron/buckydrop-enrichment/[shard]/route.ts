import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {runBuckydropBulkShard,BUCKYDROP_BULK_SHARDS} from "@/lib/buckydrop-bulk";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
function authorized(value:string|null,secret:string|undefined){
 if(!secret||secret.length<32||!value?.startsWith("Bearer "))return false;
 const supplied=Buffer.from(value.slice(7));
 const expected=Buffer.from(secret);
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
export async function GET(req:Request,{params}:{params:Promise<{shard:string}>}){
 if(!authorized(req.headers.get("authorization"),process.env.CRON_SECRET))
  return NextResponse.json({ok:false,error:"unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 if(process.env.VERCEL_ENV!=="production")
  return NextResponse.json({ok:false,error:"production_only"},{status:403});
 const {shard:raw}=await params;
 const shard=Number(raw);
 if(!/^\d{1,2}$/.test(raw)||!Number.isInteger(shard)||shard<0||shard>=BUCKYDROP_BULK_SHARDS)
  return NextResponse.json({ok:false,error:"invalid_shard"},{status:400});
 try{
  const result=await runBuckydropBulkShard(shard);
  return NextResponse.json({ok:true,...result},{headers:{"Cache-Control":"private, no-store"}});
 }catch(e){
  console.error("[herocon-buckydrop-bulk] failed",e instanceof Error?e.name:"unknown");
  return NextResponse.json({ok:false,error:"worker_failed"},{status:503});
 }
}
