import {NextResponse} from "next/server";
import {authorizedCheckoutAdmin,getApprovedQuote,quoteIdOk,quoteIsCurrent} from "@/lib/approved-checkout";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{"Cache-Control":"no-store"}});
export async function POST(request:Request){
 if(!authorizedCheckoutAdmin(request.headers.get("x-herocon-checkout-admin")))
  return reply({error:"Unauthorized"},401);
 if(process.env.HEROCON_STRIPE_TEST_CHECKOUT_ENABLED!=="true"||
    !process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")||
    !process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_"))
  return reply({error:"Stripe sandbox test credentials and webhook have not been configured."},503);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!=="https://herocon.store")return reply({error:"Start operator tests on Herocon."},403);}
 catch{return reply({error:"Invalid origin"},403);}
 let body:unknown;
 try{const raw=await request.text();if(raw.length>200)return reply({error:"Request too long"},413);body=JSON.parse(raw);}
 catch{return reply({error:"Invalid request"},400);}
 const id=body&&typeof body==="object"&&!Array.isArray(body)?(body as Record<string,unknown>).quoteId:null;
 if(typeof id!=="string"||!quoteIdOk(id))return reply({error:"Invalid quote"},400);
 const quote=await getApprovedQuote(id);
 if(!quote||!quoteIsCurrent(quote))return reply({error:"Quote not found or expired"},404);
 const fields=new URLSearchParams();
 fields.set("mode","payment");
 fields.set("customer_email",quote.customerEmail);
 fields.set("success_url","https://herocon.store/checkout/complete?session_id={CHECKOUT_SESSION_ID}");
 fields.set("cancel_url","https://herocon.store/checkout/"+quote.id);
 fields.set("shipping_address_collection[allowed_countries][0]","GB");
 fields.set("phone_number_collection[enabled]","true");
 fields.set("payment_method_types[0]","card");
 fields.set("expires_at",String(Math.floor(Date.parse(quote.expiresAt)/1000)));
 fields.set("metadata[purpose]","herocon_checkout_quote_test");
 fields.set("metadata[quoteId]",quote.id);
 fields.set("metadata[fulfilment]","disabled");
 for(const [i,line] of quote.lines.entries()){
  fields.set("line_items["+i+"][price_data][currency]","gbp");
  fields.set("line_items["+i+"][price_data][product_data][name]",line.title);
  fields.set("line_items["+i+"][price_data][unit_amount]",String(Math.round(line.unitPriceGBP*100)));
  fields.set("line_items["+i+"][quantity]",String(line.quantity));
 }
 let index=quote.lines.length;
 for(const [label,pence] of [["Shipping",quote.shippingPence],["Applicable taxes and duties",quote.taxPence]] as const){
  if(!pence)continue;
  fields.set("line_items["+index+"][price_data][currency]","gbp");
  fields.set("line_items["+index+"][price_data][product_data][name]",label);
  fields.set("line_items["+index+"][price_data][unit_amount]",String(pence));
  fields.set("line_items["+index+"][quantity]","1");
  index++;
 }
 try{
  const r=await fetch("https://api.stripe.com/v1/checkout/sessions",{
   method:"POST",headers:{
    Authorization:"Bearer "+process.env.STRIPE_SECRET_KEY,
    "Content-Type":"application/x-www-form-urlencoded",
    "Idempotency-Key":"herocon-test-"+quote.id,
    "Stripe-Version":"2025-09-30.clover"
   },body:fields.toString(),cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)
  });
  if(!r.ok)return reply({error:"Stripe could not create the test payment page."},502);
  const v=await r.json() as Record<string,unknown>;
  if(typeof v.id!=="string"||!v.id.startsWith("cs_test_")||v.livemode!==false||
   v.currency!=="gbp"||v.amount_total!==quote.totalPence||
   typeof v.url!=="string"||!v.url.startsWith("https://checkout.stripe.com/"))
    return reply({error:"Unexpected Stripe sandbox result."},502);
  return reply({id:v.id,url:v.url,testMode:true,totalPence:quote.totalPence,
   note:"Stripe TEST payment only. No Herocon live charge or BuckyDrop supplier order."});
 }catch{return reply({error:"Stripe test service is unavailable."},502);}
}
