import "server-only";
import {get,head,put,list} from "@vercel/blob";
import {getApprovedQuote,type ApprovedQuote} from "@/lib/approved-checkout";
import {partnerRefFromPayment} from "@/lib/buckydrop-order-store";

const BASE="checkout/payments/v1/";
const ACCESS="private" as const;
type StripeSession={
 id:string;livemode:boolean;mode:string;currency:string;amount_total:number;
 payment_status:string;metadata?:Record<string,string>;
 customer_email?:string|null;
 customer_details?:{email?:string|null;name?:string|null;phone?:string|null};
 shipping_details?:{name?:string|null;address?:Record<string,string|null>};
 collected_information?:{shipping_details?:{name?:string|null;address?:Record<string,string|null>}};
};
type Audit={
 version:1;quoteId:string;sessionId:string;email:string;totalPence:number;
 state:"paid_review_required"|"submitted_awaiting_merchant_payment"|"submission_uncertain";
 reason:string;recordedAt:string;partnerOrderNo:string|null;shopOrderNo:string|null;
 accessCode:string|null;customerEmailSent:boolean;merchantEmailSent:boolean;
};
const safe=(x:unknown)=>typeof x==="string"?x.trim():"";
async function write(path:string,value:unknown,overwrite=false){
 await put(BASE+path,JSON.stringify(value),{
  access:ACCESS,allowOverwrite:overwrite,addRandomSuffix:false,contentType:"application/json"
 });
}
async function read(path:string):Promise<unknown|null>{
 try{
  const found=await get(BASE+path,{access:ACCESS});
  if(!found||found.statusCode!==200||!found.stream)return null;
  const raw=await new Response(found.stream).text();
  if(raw.length>16000)return null;
  return JSON.parse(raw) as unknown;
 }catch{return null;}
}
async function sendEmail(to:string,subject:string,content:string):Promise<boolean>{
 const token=process.env.RESEND_API_KEY,from=process.env.HEROCON_ORDER_EMAIL_FROM;
 if(!token||!from)return false;
 try{
  const r=await fetch("https://api.resend.com/emails",{
   method:"POST",headers:{Authorization:"Bearer "+token,"Content-Type":"application/json"},
   body:JSON.stringify({from,to:[to],subject,text:content}),
   cache:"no-store",signal:AbortSignal.timeout(10000)
  });
  return r.ok;
 }catch{return false;}
}
async function stripeSession(id:string):Promise<StripeSession>{
 const key=process.env.STRIPE_LIVE_SECRET_KEY;
 if(!key?.startsWith("sk_live_"))throw Error("Stripe live key not configured");
 const r=await fetch("https://api.stripe.com/v1/checkout/sessions/"+encodeURIComponent(id),{
  headers:{Authorization:"Bearer "+key,"Stripe-Version":"2025-09-30.clover"},
  cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)
 });
 if(!r.ok)throw Error("Failed to verify paid Stripe session independently");
 return await r.json() as StripeSession;
}
function shippingCustomer(s:StripeSession){
 const ship=s.collected_information?.shipping_details||s.shipping_details;
 const address=ship?.address;
 const contactName=safe(ship?.name)||safe(s.customer_details?.name);
 const country=safe(address?.country);
 const city=safe(address?.city),line1=safe(address?.line1),line2=safe(address?.line2);
 const province=safe(address?.state)||city;
 const contactPhone=safe(s.customer_details?.phone);
 const email=safe(s.customer_details?.email)||safe(s.customer_email);
 if(country!=="GB"||!city||!line1||!contactName||!contactPhone||!email)return null;
 return {country:"United Kingdom",countryCode:"GB",province,city,detailAddress:[line1,line2].filter(Boolean).join(", "),
  contactName,contactPhone,postCode:safe(address?.postal_code),email};
}
function verifySession(s:StripeSession,q:ApprovedQuote,expectedId:string){
 return s.id===expectedId&&s.id.startsWith("cs_live_")&&s.livemode===true&&
  s.mode==="payment"&&s.currency==="gbp"&&s.payment_status==="paid"&&
  s.amount_total===q.totalPence&&s.metadata?.quoteId===q.id&&
  s.metadata?.purpose==="herocon_live_checkout"&&
  s.metadata?.paymentStage==="products"&&q.paymentStage==="products"&&
  q.shippingPence===0&&!!q.estimatedLaterShippingPence&&
  s.metadata?.fulfilment==="merchant_manual_supplier_payment"&&
  q.saleCurrency==="gbp"&&q.fulfilment==="bucky_manual_supplier_payment"&&
  q.customerEmail.toLowerCase()===(safe(s.customer_details?.email)||safe(s.customer_email)).toLowerCase();
}
/** Stripe webhooks can be repeated or overlap. Claim quote before supplier request. */
export async function handlePaidCheckout(sessionId:string,expectedQuoteId:string){
 if(!/^cs_live_[A-Za-z0-9]+$/.test(sessionId))return {received:true,ignored:true};
 const session=await stripeSession(sessionId);
 const quote=await getApprovedQuote(expectedQuoteId);
 if(!quote)throw Error("Paid checkout cannot be matched to approved private quote.");
 if(!verifySession(session,quote,sessionId)){
  await write("exceptions/"+sessionId+".json",{sessionId,expectedQuoteId,code:"PAID_SESSION_MISMATCH",at:new Date().toISOString()});
  throw Error("Paid Stripe session details do not match approved quote.");
 }
 const claimName="claims/"+quote.id+".json";
 const existing=await read(claimName) as {sessionId?:string}|null;
 if(existing){
  if(existing.sessionId!==sessionId){
   await write("exceptions/"+sessionId+".json",{sessionId,quoteId:quote.id,code:"MULTIPLE_PAID_SESSIONS",at:new Date().toISOString()});
   return {received:true,duplicatePayment:true,requiresRefundReview:true};
  }
  return {received:true,duplicate:true};
 }
 // An atomic immutable claim stops duplicate submissions even when Stripe
 // dispatches several verified webhook events concurrently.
 try{
  await write(claimName,{quoteId:quote.id,sessionId,at:new Date().toISOString()});
 }catch{
  try{if(await head(BASE+claimName))return {received:true,duplicate:true};}catch{}
  throw Error("Cannot reserve paid-order handling. Stripe must retry.");
 }
 const buyer=shippingCustomer(session);
 const audit:Audit={version:1,quoteId:quote.id,sessionId,email:quote.customerEmail,totalPence:quote.totalPence,
  state:"paid_review_required",reason:"",recordedAt:new Date().toISOString(),
  partnerOrderNo:null,shopOrderNo:null,accessCode:null,customerEmailSent:false,merchantEmailSent:false};
 if(!buyer)audit.reason="Stripe buyer delivery address, phone or email is missing or invalid.";
 else if(process.env.HEROCON_ORDER_SUBMISSION_ENABLED!=="true"||
  (process.env.HEROCON_INTERNAL_FULFILMENT_KEY||"").length<32||
  process.env.HEROCON_BUCKYDROP_MANUAL_PAYMENT_CONFIRMED!=="true"){
  audit.reason="Supplier handoff or manual-payment verification is disabled.";
 }else{
  const payload={
   verifiedPaymentReference:session.id,verifiedTotalGBP:quote.totalPence/100,customer:buyer,
   lines:quote.lines.map(x=>({
    marketplaceUrl:x.marketplaceUrl,skuCode:x.skuCode,quantity:x.quantity,
    verifiedSalePriceGBP:x.unitPriceGBP,maxSupplierPriceCNY:Math.round(x.supplierUnitCNY*1.02*100)/100
   }))
  };
  try{
   const res=await fetch("https://herocon.store/api/buckydrop/orders/submit",{
    method:"POST",headers:{"Content-Type":"application/json",
     "x-herocon-internal-fulfilment-key":process.env.HEROCON_INTERNAL_FULFILMENT_KEY!},
    body:JSON.stringify(payload),cache:"no-store",redirect:"error",
    signal:AbortSignal.timeout(46000)
   });
   const v=await res.json() as Record<string,unknown>;
   if(!res.ok||!v.partnerOrderNo||!v.accessCode){
    audit.reason="BuckyDrop submission failed or needs merchant attention: HTTP "+res.status;
   }else{
    audit.partnerOrderNo=safe(v.partnerOrderNo);
    audit.shopOrderNo=safe(v.shopOrderNo)||null;
    audit.accessCode=safe(v.accessCode);
    audit.state=v.state==="accepted"?"submitted_awaiting_merchant_payment":"submission_uncertain";
    audit.reason=audit.state==="submitted_awaiting_merchant_payment"?
     "Order sent to BuckyDrop; merchant must review, confirm and pay the supplier before fulfilment.":
     "Supplier order outcome uncertain. Do not submit a duplicate order; reconcile with BuckyDrop.";
   }
  }catch{audit.reason="Supplier submission outcome uncertain or timed out. Merchant must reconcile using the payment reference before retrying.";}
 }
 // Preserve the access code in PRIVATE storage for support if email delivery fails.
 await write("results/"+sessionId+".json",audit);
 const merchantAddress=process.env.HEROCON_ORDER_ALERT_EMAIL||"";
 const merchantText=[
  "HEROCON PAID ORDER — MANUAL MERCHANT ACTION",
  "Stripe session: "+sessionId,
  "Quote: "+quote.id,
  "Buyer: "+quote.customerEmail,
  "Product-stage amount paid: £"+(quote.totalPence/100).toFixed(2),
  "International shipping NOT paid. Indicative freight estimate: £"+((quote.estimatedLaterShippingPence||0)/100).toFixed(2),
  "After warehouse arrival, verify QC and packed weights and quote shipping to the buyer before any dispatch.",
  "State: "+audit.state,
  "BuckyDrop ref: "+(audit.partnerOrderNo||"Not accepted"),
  "Action: "+audit.reason,
  "Check https://herocon.store/admin/checkout and BuckyDrop's merchant portal.",
  "Do not resubmit an uncertain supplier order without reconciliation. If not fulfilled, review refund obligations."
 ].join("\n");
 audit.merchantEmailSent=merchantAddress?await sendEmail(merchantAddress,"Herocon paid order requires action — "+quote.id,merchantText):false;
 const buyerText=[
  "Thank you for your Herocon order.",
  "We've verified your first-stage product payment of £"+(quote.totalPence/100).toFixed(2)+".",
  "International shipping has NOT been paid. Estimated later freight: about £"+((quote.estimatedLaterShippingPence||0)/100).toFixed(2)+", subject to actual packed weight, destination, eligible carrier and fees.",
  "After warehouse arrival and inspection, Herocon will issue a separate international shipping quote and payment request. No additional payment is automatic.",
  audit.partnerOrderNo?"Your order reference: "+audit.partnerOrderNo:"Your order is awaiting merchant review before supplier processing.",
  audit.accessCode?"Your private tracking access code: "+audit.accessCode:"",
  audit.accessCode?"Track it at https://herocon.store/orders":"",
  "Your payment to Herocon is separate from our merchant's supplier payment to BuckyDrop.",
  "We will arrange fulfilment and contact you if an item becomes unavailable.",
  "Questions or changes? Visit https://herocon.store/contact."
 ].filter(Boolean).join("\n\n");
 audit.customerEmailSent=await sendEmail(quote.customerEmail,"Herocon payment received — "+quote.id,buyerText);
 await write("results/"+sessionId+".json",audit,true);
 return {received:true,paid:true,submitted:audit.state==="submitted_awaiting_merchant_payment",
  requiresMerchantAction:true,customerNotified:audit.customerEmailSent};
}
export async function listCheckoutReconciliation(){
 const [results,claims]=await Promise.all([
  list({prefix:BASE+"results/",limit:1000}),
  list({prefix:BASE+"claims/",limit:1000})
 ]);
 const resultBySession=new Map<string,Audit>();
 for(const blob of [...results.blobs].sort((a,b)=>
  new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime()).slice(0,100)){
  const value=await read(blob.pathname.slice(BASE.length)) as Audit|null;
  if(value&&value.version===1&&value.sessionId?.startsWith("cs_live_"))
   resultBySession.set(value.sessionId,value);
 }
 for(const blob of [...claims.blobs].sort((a,b)=>
  new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime()).slice(0,100)){
  const claim=await read(blob.pathname.slice(BASE.length)) as {quoteId?:string;sessionId?:string;at?:string}|null;
  if(!claim?.sessionId?.startsWith("cs_live_")||resultBySession.has(claim.sessionId))continue;
  resultBySession.set(claim.sessionId,{
   version:1,quoteId:claim.quoteId||"unknown",sessionId:claim.sessionId,
   email:"",totalPence:0,state:"paid_review_required",
   reason:"Payment processing was reserved but no completed result was recorded. Investigate Stripe and BuckyDrop; do not resubmit automatically.",
   recordedAt:claim.at||new Date().toISOString(),partnerOrderNo:null,shopOrderNo:null,
   accessCode:null,customerEmailSent:false,merchantEmailSent:false
  });
 }
 return [...resultBySession.values()].sort((a,b)=>b.recordedAt.localeCompare(a.recordedAt)).slice(0,60);
}

export async function listCheckoutFinancialEvents(){
 const prefix="checkout/payments/v1/financial-events/";
 const result=await list({prefix,limit:150});
 const events=await Promise.all([...result.blobs].sort((a,b)=>
  new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime()).slice(0,60)
  .map(async b=>{
   try{
    const g=await get(b.pathname,{access:"private"});
    if(!g||g.statusCode!==200||!g.stream)return null;
    const body=await new Response(g.stream).text();
    if(body.length>2000)return null;
    return JSON.parse(body) as {eventId:string;type:string;objectId:string;receivedAt:string;requiresMerchantReview:boolean};
   }catch{return null;}
  }));
 return events.filter((e):e is NonNullable<typeof e>=>Boolean(e)).slice(0,40);
}
export async function listCheckoutExceptions(){
 const prefix="checkout/payments/v1/exceptions/";
 const result=await list({prefix,limit:150});
 const events=await Promise.all([...result.blobs].sort((a,b)=>
  new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime()).slice(0,60)
  .map(async b=>{
   try{
    const g=await get(b.pathname,{access:"private"});
    if(!g||g.statusCode!==200||!g.stream)return null;
    const body=await new Response(g.stream).text();
    if(body.length>2000)return null;
    return JSON.parse(body) as {sessionId:string;quoteId?:string;expectedQuoteId?:string;code:string;at:string};
   }catch{return null;}
  }));
 return events.filter((e):e is NonNullable<typeof e>=>Boolean(e)).slice(0,40);
}
