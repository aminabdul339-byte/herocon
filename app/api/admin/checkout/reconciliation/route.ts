import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin} from "@/lib/approved-checkout";
import {listCheckoutReconciliation} from "@/lib/checkout-handoff";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export async function GET(request:Request){
 if(!authorizedCheckoutAdmin(request.headers.get("x-herocon-checkout-admin")))
  return NextResponse.json({error:"Unauthorized"},{status:401,headers:{"Cache-Control":"no-store"}});
 try{
  const results=await listCheckoutReconciliation();
  return NextResponse.json({results,notice:"Private reconciliation records. Investigate payments that were captured without a confirmed supplier submission. Do not resubmit an uncertain order until BuckyDrop confirms its status."},
   {headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
 }catch{
  return NextResponse.json({error:"Could not read private payment ledger."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
