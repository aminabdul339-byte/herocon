import {NextResponse} from "next/server";
import {head,put} from "@vercel/blob";
import {StripeGatewayError,verifyStripeWebhook} from "@/lib/stripe-gateway";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});

/**
 * Production Stripe event receiver — LIVE only, opt-in and signature-verified.
 *
 * No consumer checkout is active. No BuckyDrop purchase, refund or fulfilment
 * action is taken, regardless of event type. Connecting Stripe webhook
 * delivery is separate from authorising customer charges or supplier writes.
 */
export async function POST(request:Request){
 const secret=process.env.STRIPE_LIVE_WEBHOOK_SECRET||"";
 if(process.env.HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED!=="true"
  ||!secret.startsWith("whsec_")||!process.env.STRIPE_LIVE_SECRET_KEY?.startsWith("sk_live_"))
  return response({error:"Stripe live webhooks are not enabled."},503);
 const raw=await request.text();
 if(raw.length>400000)return response({error:"Payload too large."},413);
 let event;
 try{event=verifyStripeWebhook(raw,request.headers.get("stripe-signature"),secret);}
 catch(err){return response({error:err instanceof StripeGatewayError?err.message:"Invalid webhook signature."},400);}
 if(event.livemode!==true||event.data.object?.livemode!==true)return response({error:"Test-mode event is not permitted."},403);
 if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type))return response({received:true});
 const session=event.data.object;
 // Do not create supplier orders from an event, even if a payment was captured.
 // Future integration must verify frozen server-side intent, exact GBP amount,
 // payment status and then reconcile one protected paid-order submission.
 if(session.metadata?.purpose!=="herocon_live_checkout"
  ||session.metadata?.fulfilment!=="disabled"
  ||session.mode!=="payment"
  ||!session.id?.startsWith("cs_live_"))return response({received:true});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return response({error:"Private receipt storage unavailable."},503);
 const pathname="payments/stripe-live-audit/v1/"+event.id+".json";
 try{
  await put(pathname,JSON.stringify({
   version:1,eventId:event.id,eventType:event.type,sessionId:session.id,
   paid:session.payment_status==="paid",currency:session.currency||null,
   amountMinorUnits:session.amount_total??null,submittedForFulfilment:false,
   recordedAt:new Date().toISOString()
  }),{access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"});
 }catch{
  try{if(await head(pathname))return response({received:true,duplicate:true});}
  catch{}
  return response({error:"Unable to record a verified Stripe event. Retry required."},503);
 }
 return response({received:true,recorded:true,fulfilment:false});
}
