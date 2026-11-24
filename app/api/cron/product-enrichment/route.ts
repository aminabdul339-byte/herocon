import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {runAutomaticEnrichment} from "@/lib/automatic-enrichment";

export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=420;
function authorized(auth:string|null,secret:string|undefined){
 if(!secret||secret.length<32||!auth||!auth.startsWith("Bearer "))return false;
 const supplied=Buffer.from(auth.slice(7));
 const expected=Buffer.from(secret);
 return supplied.length===expected.length&&timingSafeEqual(supplied,expected);
}
export async function GET(request:Request){
 // Only the configured Vercel Cron invocation can start this billable job.
 // Not accessible to public visitors or account sessions.
 if(!authorized(request.headers.get("authorization"),process.env.CRON_SECRET))
  return NextResponse.json({ok:false,error:"unauthorized"},{
   status:401,headers:{"Cache-Control":"no-store"}
  });
 if(process.env.VERCEL_ENV!=="production")
  return NextResponse.json({ok:false,error:"production_only"},{status:403});
 try{
  const result=await runAutomaticEnrichment();
  return NextResponse.json({ok:true,...result},{
   headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}
  });
 }catch(error){
  // Redact upstream contents and source URLs, especially credentials.
  console.error("[herocon-enrichment-cron] worker error",error instanceof Error?error.name:"unknown");
  return NextResponse.json({ok:false,error:"worker_failed"},{status:503});
 }
}
