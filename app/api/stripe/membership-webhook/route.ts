import {NextResponse} from "next/server";
import {get,put} from "@vercel/blob";
import {verifyStripeWebhook} from "@/lib/stripe-gateway";
/**
 * Finance audit only. Access is checked against Stripe's actual subscription
 * status on every request, not an unsigned client flag or stale event payload.
 */
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=30;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const events=new Set([
 "checkout.session.completed","checkout.session.expired",
 "customer.subscription.created","customer.subscription.updated",
 "customer.subscription.deleted","customer.subscription.paused",
 "customer.subscription.resumed","invoice.paid","invoice.payment_failed",
 "invoice.payment_action_required"
]);
export async function POST(request:Request){
 const raw=await request.text();
 if(raw.length>250000)return reply({error:"Event too large"},413);
 const eventString=raw.slice(0,250000);
 // Select key only by the event's livemode AFTER verifying each candidate
 // signature. Never trust the event to select a secret without verification.
 const secrets=[
  {mode:"live" as const,key:process.env.HEROCON_MEMBERSHIP_LIVE_WEBHOOK_SECRET},
  {mode:"test" as const,key:process.env.HEROCON_MEMBERSHIP_TEST_WEBHOOK_SECRET}
 ];
 let verified:ReturnType<typeof verifyStripeWebhook>|null=null;
 let mode:"live"|"test"|null=null;
 for(const option of secrets){
  if(!option.key?.startsWith("whsec_"))continue;
  try{
   const next=verifyStripeWebhook(eventString,request.headers.get("stripe-signature"),option.key);
   if(next.livemode===(option.mode==="live")){
    verified=next;mode=option.mode;break;
   }
  }catch{}
 }
 if(!verified||!mode)return reply({error:"Invalid Stripe signature."},400);
 if(!events.has(verified.type))return reply({received:true});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return reply({error:"Audit storage not configured."},503);
 const path="billing/memberships/v1/events/"+mode+"/"+verified.id+".json";
 try{
  const ob=verified.data.object as unknown as Record<string,unknown>;
  const record={id:verified.id,type:verified.type,mode,
   objectId:typeof ob.id==="string"?ob.id:null,
   customer:typeof ob.customer==="string"?ob.customer:null,
   status:typeof ob.status==="string"?ob.status:null,
   receivedAt:new Date().toISOString()};
  await put(path,JSON.stringify(record),{
   access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"
  });
 }catch{
  try{
   const existing=await get(path,{access:"private"});
   if(existing?.statusCode===200)return reply({received:true,duplicate:true});
  }catch{}
  return reply({error:"Unable to record signed billing event."},503);
 }
 return reply({received:true});
}
