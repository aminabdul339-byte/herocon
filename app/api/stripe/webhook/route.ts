import {NextResponse} from "next/server";
import {head,put} from "@vercel/blob";
import {StripeGatewayError,verifyStripeWebhook} from "@/lib/stripe-gateway";

export const runtime="nodejs";
export const dynamic="force-dynamic";

/**
 * STRIPE TEST-MODE WEBHOOK ONLY.
 * Validates the raw Stripe-Signature, checks that the event/session are TEST,
 * and records a minimal proof of the event in private Vercel Blob storage.
 * Absolutely no BuckyDrop/fulfilment calls are made by this handler.
 */
export async function POST(request:Request){
 if(!process.env.STRIPE_WEBHOOK_SECRET||!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
  ||process.env.HEROCON_STRIPE_TEST_CHECKOUT_ENABLED!=="true"){
  return NextResponse.json({error:"Webhook not enabled."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
 const raw=await request.text();
 if(raw.length>400_000)return NextResponse.json({error:"Payload too large."},{status:413});
 let event;
 try{event=verifyStripeWebhook(raw,request.headers.get("stripe-signature"));}
 catch(error){
  return NextResponse.json({error:error instanceof StripeGatewayError?error.message:"Invalid webhook signature."},{status:400,headers:{"Cache-Control":"no-store"}});
 }
 // Never convert test payments into real supplier purchases.
 if(event.livemode!==false||event.data.object.livemode!==false)return NextResponse.json({error:"Live payments are not accepted here."},{status:403});
 if(!["checkout.session.completed","checkout.session.async_payment_succeeded"].includes(event.type)){
  return NextResponse.json({received:true},{headers:{"Cache-Control":"no-store"}});
 }
 const session=event.data.object;
 if(session.metadata?.purpose!=="herocon_integration_test"||session.metadata.fulfilment!=="disabled"||
  session.mode!=="payment"||!session.id?.startsWith("cs_test_"))return NextResponse.json({received:true},{headers:{"Cache-Control":"no-store"}});
 if(session.payment_status!=="paid"||session.currency!=="gbp"||session.amount_total!==100){
  return NextResponse.json({received:true},{headers:{"Cache-Control":"no-store"}});
 }
 if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:"Test receipt storage not configured."},{status:503});
 try{
  await put("payments/stripe-test/v1/"+event.id+".json",JSON.stringify({
   version:1,eventId:event.id,eventType:event.type,checkoutId:session.id,
   currency:"gbp",amountPence:100,fulfilment:false,verifiedAt:new Date().toISOString()
  }),{access:"private",allowOverwrite:false,addRandomSuffix:false,contentType:"application/json"});
 }catch{
  // A duplicate webhook event can be acknowledged. A storage outage must
  // instead return non-2xx so Stripe can retry delivery.
  try{
   const previous=await head("payments/stripe-test/v1/"+event.id+".json");
   if(previous)return NextResponse.json({received:true,duplicate:true},{headers:{"Cache-Control":"no-store"}});
  }catch{}
  return NextResponse.json({error:"Test receipt storage is unavailable."},{status:503,headers:{"Cache-Control":"no-store"}});
 }
 return NextResponse.json({received:true,recorded:true},{headers:{"Cache-Control":"no-store"}});
}
