import {NextResponse} from "next/server";
import {head,put} from "@vercel/blob";
import {StripeGatewayError,verifyStripeWebhook} from "@/lib/stripe-gateway";
import {getApprovedQuote} from "@/lib/approved-checkout";

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
 if(session.metadata?.fulfilment!=="disabled"||session.mode!=="payment"||
  !session.id?.startsWith("cs_test_")||session.currency!=="gbp")
  return NextResponse.json({received:true,ignored:true},{headers:{"Cache-Control":"no-store"}});
 if(session.payment_status!=="paid")
  return NextResponse.json({received:true,waitingForFunds:true},{headers:{"Cache-Control":"no-store"}});
 const purpose=session.metadata.purpose;
 let acceptedPence=100,quoteId:string|null=null;
 if(purpose==="herocon_checkout_quote_test"){
  const id=session.metadata.quoteId||"";
  if(!/^hq_[a-f0-9]{40}$/.test(id))return NextResponse.json({error:"Invalid test quote"}, {status:400});
  const quote=await getApprovedQuote(id);
  if(!quote)return NextResponse.json({error:"Missing approved test quote"},{status:503});
  acceptedPence=quote.totalPence;
  quoteId=quote.id;
 }else if(purpose!=="herocon_integration_test")return NextResponse.json({received:true,ignored:true});
 if(session.amount_total!==acceptedPence)
  return NextResponse.json({error:"Test payment does not match the approved GBP amount"},{status:400});
 if(!process.env.BLOB_READ_WRITE_TOKEN)return NextResponse.json({error:"Test receipt storage not configured."},{status:503});
 try{
  await put("payments/stripe-test/v1/"+event.id+".json",JSON.stringify({
   version:1,eventId:event.id,eventType:event.type,checkoutId:session.id,
   quoteId,currency:"gbp",amountPence:acceptedPence,fulfilment:false,
   verifiedAt:new Date().toISOString()
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
