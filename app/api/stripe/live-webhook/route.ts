import {NextResponse} from "next/server";
import {put} from "@vercel/blob";
import {StripeGatewayError,verifyStripeWebhook} from "@/lib/stripe-gateway";
import {handlePaidCheckout} from "@/lib/checkout-handoff";

export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
/**
 * Stripe LIVE only. The signature and exact raw payload are verified before
 * looking up the paid session independently from Stripe. A successful return
 * URL or client-provided paid=true is never accepted as payment proof.
 *
 * Historical paid events remain processable when the public checkout flag
 * is turned off, but supplier writes have their own explicit disabled-by-
 * default secret, flag and manual-payment configuration.
 */
export async function POST(request:Request){
 const secret=process.env.STRIPE_LIVE_WEBHOOK_SECRET||"";
 if(process.env.HEROCON_STRIPE_LIVE_WEBHOOK_ENABLED!=="true"||
  !secret.startsWith("whsec_")||!process.env.STRIPE_LIVE_SECRET_KEY?.startsWith("sk_live_"))
  return response({error:"Live webhook is not enabled."},503);
 const raw=await request.text();
 if(raw.length>400000)return response({error:"Payload too large."},413);
 let event;
 try{event=verifyStripeWebhook(raw,request.headers.get("stripe-signature"),secret);}
 catch(e){return response({error:e instanceof StripeGatewayError?e.message:"Invalid signature."},400);}
 if(event.livemode!==true||event.data.object?.livemode!==true)
  return response({error:"Not a live event."},403);
 if(event.type==="charge.refunded"||event.type==="charge.dispute.created"||
  event.type==="charge.dispute.closed"||event.type==="checkout.session.expired"){
  if(!process.env.BLOB_READ_WRITE_TOKEN)return response({error:"Private audit storage unavailable."},503);
  try{
   await put("checkout/payments/v1/financial-events/"+event.id+".json",
    JSON.stringify({eventId:event.id,type:event.type,receivedAt:new Date().toISOString(),
     objectId:event.data.object.id,requiresMerchantReview:event.type!=="checkout.session.expired"}),
    {access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});
  }catch{
   // Stripe may retry identical event IDs. The protected ledger still prevents
   // this handler from issuing any refunds or duplicate order submissions.
  }
  return response({received:true,review:event.type!=="checkout.session.expired"});
 }
 if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type))
  return response({received:true});
 const checkout=event.data.object;
 if(checkout.metadata?.purpose!=="herocon_live_checkout"||
  !["merchant_manual_supplier_payment","bucky_manual_supplier_payment","bucky_prepaid_auto_fulfilment"].includes(checkout.metadata?.fulfilment||"")||
  checkout.mode!=="payment"||!checkout.id?.startsWith("cs_live_"))
  return response({received:true,ignored:true});
 if(checkout.payment_status!=="paid")
  return response({received:true,waitingForFunds:true});
 const quoteId=checkout.metadata?.quoteId||"";
 if(!/^hq_[a-f0-9]{40}$/.test(quoteId))
  return response({error:"Paid checkout quote metadata is invalid."},503);
 try{
  const result=await handlePaidCheckout(checkout.id,quoteId);
  return response(result);
 }catch{
  // A 5xx makes Stripe retry. An immutable per-quote claim ensures that
  // failures after supplier submission NEVER re-send the order automatically.
  return response({error:"Paid order requires reconciliation."},503);
 }
}
