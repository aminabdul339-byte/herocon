import {NextResponse} from "next/server";
import {getApprovedQuote,quoteIdOk,quoteIsCurrent,verifyApprovedQuoteStock,QuoteError} from "@/lib/approved-checkout";
import {checkoutLaunchReadiness} from "@/lib/live-checkout";
import {verifyLiveAccount} from "@/lib/stripe-live";
import {currentCustomer} from "@/lib/customer-auth";
import {checkActiveMembership} from "@/lib/membership-access";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const response=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"no-store"}});
const visits=new Map<string,{start:number;count:number}>();
function limit(ip:string){
 const now=Date.now();
 if(visits.size>1000)for(const [key,v] of visits)if(now-v.start>60000)visits.delete(key);
 const found=visits.get(ip);
 if(!found||now-found.start>60000){visits.set(ip,{start:now,count:1});return false;}
 return ++found.count>3;
}
export async function POST(request:Request){
 const customer=await currentCustomer();
 if(!customer)return response({error:"Sign in to your free Herocon account before purchasing."},401);
 if(!await checkActiveMembership(customer))
  return response({error:"An active Herocon membership (£9.99/month) is required only when purchasing products. Membership billing is not available yet."},403);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!=="https://herocon.store")return response({error:"Checkout must be started from Herocon."},403);}
 catch{return response({error:"Invalid request origin."},403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return response({error:"JSON required."},415);
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 if(limit(ip))return response({error:"Please wait before requesting another checkout session."},429);
 let body:unknown;
 try{const raw=await request.text();if(raw.length>200)return response({error:"Request too long."},413);body=JSON.parse(raw);}
 catch{return response({error:"Invalid request."},400);}
 const id=body&&typeof body==="object"&&!Array.isArray(body)?(body as Record<string,unknown>).quoteId:null;
 if(typeof id!=="string"||!quoteIdOk(id))return response({error:"Invalid quote."},400);
 const quote=await getApprovedQuote(id);
 if(!quote)return response({error:"Quote not found."},404);
 if(quote.customerEmail.toLowerCase()!==customer.email.toLowerCase())
  return response({error:"Sign in with the email address this private checkout quote was prepared for."},403);
 const stage=quote.paymentStage==="all_in"?"all_in":"products";
 if(!checkoutLaunchReadiness(stage).enabled)return response({error:"Live customer payments are not activated for this payment model."},503);
 if(stage==="products"){
  if(quote.shippingPence!==0||!quote.estimatedLaterShippingPence||
   (body as Record<string,unknown>).shippingAcknowledged!==true)
   return response({error:"Please acknowledge that international shipping is paid separately after warehouse arrival."},400);
 }else if(quote.fulfilment!=="bucky_prepaid_auto_fulfilment"||quote.shippingPence<=0||
  quote.estimatedLaterShippingPence!==undefined||
  (body as Record<string,unknown>).allInAcknowledged!==true)
  return response({error:"Confirm the final delivered GBP total and all-inclusive shipping terms."},400);
 if(!quoteIsCurrent(quote))return response({error:"This quote has expired. Request a new price."},409);
 try{
  // Do not create a charge without checking current seller SKU, stock and cost.
  await verifyApprovedQuoteStock(quote);
  const account=await verifyLiveAccount();
  if(!account.chargesEnabled||account.country!=="GB")return response({error:"Herocon's Stripe account is not ready for live charges."},503);
  const fields=new URLSearchParams();
  fields.set("mode","payment");
  fields.set("customer_email",quote.customerEmail);
  fields.set("success_url","https://herocon.store/checkout/complete?session_id={CHECKOUT_SESSION_ID}");
  fields.set("cancel_url","https://herocon.store/checkout/"+quote.id);
  fields.set("shipping_address_collection[allowed_countries][0]","GB");
  fields.set("phone_number_collection[enabled]","true");
  fields.set("consent_collection[terms_of_service]","required");
  fields.set("payment_method_types[0]","card");
  fields.set("expires_at",String(Math.floor(Date.parse(quote.expiresAt)/1000)));
  fields.set("metadata[purpose]","herocon_live_checkout");
  fields.set("metadata[paymentStage]",stage);
  fields.set("metadata[quoteId]",quote.id);
  fields.set("metadata[fulfilment]",quote.fulfilment);
  for(const [index,line] of quote.lines.entries()){
   fields.set("line_items["+index+"][price_data][currency]","gbp");
   fields.set("line_items["+index+"][price_data][product_data][name]",line.title.slice(0,120));
   fields.set("line_items["+index+"][price_data][unit_amount]",String(Math.round(line.unitPriceGBP*100)));
   fields.set("line_items["+index+"][quantity]",String(line.quantity));
  }
  let index=quote.lines.length;
  for(const [title,pence] of [["Shipping",quote.shippingPence],["Applicable taxes and duties",quote.taxPence],["Herocon service fee",quote.serviceFeePence??0]] as const){
   if(pence===0)continue;
   fields.set("line_items["+index+"][price_data][currency]","gbp");
   fields.set("line_items["+index+"][price_data][product_data][name]",title);
   fields.set("line_items["+index+"][price_data][unit_amount]",String(pence));
   fields.set("line_items["+index+"][quantity]","1");
   index++;
  }
  const key=process.env.STRIPE_LIVE_SECRET_KEY!;
  const stripe=await fetch("https://api.stripe.com/v1/checkout/sessions",{
   method:"POST",headers:{
    Authorization:"Bearer "+key,"Content-Type":"application/x-www-form-urlencoded",
    "Idempotency-Key":"herocon-"+quote.id,"Stripe-Version":"2025-09-30.clover"
   },body:fields.toString(),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)
  });
  if(!stripe.ok)return response({error:"Stripe was unable to prepare this exact approved checkout."},502);
  const session=await stripe.json() as Record<string,unknown>;
  if(typeof session.id!=="string"||!session.id.startsWith("cs_live_")||
   session.livemode!==true||session.mode!=="payment"||
   session.currency!=="gbp"||session.amount_total!==quote.totalPence||
   typeof session.url!=="string"||!session.url.startsWith("https://checkout.stripe.com/"))
   return response({error:"Stripe returned an unexpected checkout session. No redirect was issued."},502);
  return response({url:session.url});
 }catch(e){
  if(e instanceof QuoteError)return response({error:e.message},e.status);
  return response({error:"The verified checkout session could not be prepared safely."},503);
 }
}
