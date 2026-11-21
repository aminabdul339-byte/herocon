import {NextResponse} from "next/server";
import {timingSafeEqual} from "node:crypto";
import {callBucky,liveReady} from "@/lib/buckydrop-gateway";
import {queryBuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {partnerRefFromPayment,issueAccessCode,codeHash,reservePaidOrder,updatePaidOrder,storageAvailable,type PaidOrderRecord} from "@/lib/buckydrop-order-store";

export const dynamic="force-dynamic";
export const runtime="nodejs";
const error=(message:string,status:number)=>NextResponse.json({error:message},{status,headers:{"Cache-Control":"no-store"}});
const object=(input:unknown):Record<string,unknown>=>input&&typeof input==="object"&&!Array.isArray(input)?input as Record<string,unknown>:{};
const text=(input:unknown,max=200)=>typeof input==="string"?input.trim().slice(0,max):"";
const inRange=(input:unknown,max:number)=>typeof input==="number"&&Number.isInteger(input)&&input>=1&&input<=max;
const allowedCountry=/^[A-Z]{2}$/;
function authorized(secret:string,provided:string|null){
 if(!provided||provided.length!==secret.length)return false;
 return timingSafeEqual(Buffer.from(provided),Buffer.from(secret));
}
type Customer={
 country:string;countryCode:string;province:string;city:string;
 detailAddress:string;contactName:string;contactPhone:string;postCode:string;email:string;
};
function parseCustomer(value:unknown):Customer|null{
 const r=object(value);
 const person:Customer={
  country:text(r.country,200),countryCode:text(r.countryCode,2).toUpperCase(),
  province:text(r.province,200),city:text(r.city,200),
  detailAddress:text(r.detailAddress,500),contactName:text(r.contactName,100),
  contactPhone:text(r.contactPhone,50),postCode:text(r.postCode,50),email:text(r.email,120)
 };
 if(!allowedCountry.test(person.countryCode)||!person.country||!person.province||!person.city||!person.detailAddress||!person.contactName||!person.contactPhone)return null;
 if(person.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email))return null;
 return person;
}
const platformFor=(url:string)=>{
 const host=new URL(url).hostname;
 return host==="detail.1688.com"?"ALIBABA":host==="item.taobao.com"?"TB":host==="detail.tmall.com"?"TMALL":host==="weidian.com"||host==="www.weidian.com"?"WD":null;
};

/**
 * Merchant-only handoff for a future payment-verified webhook or backend.
 * This endpoint is deliberately NOT customer checkout. It is disabled until:
 * - payment is captured and webhook signature is verified by an external payment provider
 * - BuckyDrop Shop Order permissions / automation policy have been checked
 * - an independent strong HEROCON_INTERNAL_FULFILMENT_KEY is set in Vercel
 * - HEROCON_ORDER_SUBMISSION_ENABLED is explicitly true.
 * Never send this key or customer payload to browsers.
 */
export async function POST(request:Request){
 if(process.env.HEROCON_ORDER_SUBMISSION_ENABLED!=="true"||!liveReady()||!storageAvailable()
  ||!process.env.HEROCON_INTERNAL_FULFILMENT_KEY||process.env.HEROCON_INTERNAL_FULFILMENT_KEY.length<32){
  return error("Order submission is not enabled. Checkout and payment are not available.",503);
 }
 if(!authorized(process.env.HEROCON_INTERNAL_FULFILMENT_KEY,request.headers.get("x-herocon-internal-fulfilment-key")))return error("Not authorized.",401);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return error("Invalid request type.",415);
 let input:Record<string,unknown>;
 try{const raw=await request.text();if(raw.length>12000)return error("Payload too large.",413);input=object(JSON.parse(raw));}
 catch{return error("Invalid order payload.",400);}
 // Payment reference must be a *verified* provider event/order identifier from a trusted backend,
 // NEVER customer-entered data. The flag+secret protect against public/client invocation.
 const paymentRef=text(input.verifiedPaymentReference,180);
 const verifiedTotalGBP=input.verifiedTotalGBP;
 if(typeof verifiedTotalGBP!=="number"||!Number.isFinite(verifiedTotalGBP)||verifiedTotalGBP<=0||Math.abs(verifiedTotalGBP*100-Math.round(verifiedTotalGBP*100))>0.000001)return error("A verified GBP payment total is required.",400);
 if(paymentRef.length<12||!/^[A-Za-z0-9:_-]+$/.test(paymentRef))return error("Missing verified payment reference.",400);
 const customer=parseCustomer(input.customer);
 if(!customer)return error("Recipient details are incomplete.",400);
 const original=Array.isArray(input.lines)?input.lines:[];
 if(original.length<1||original.length>20)return error("Each paid order must contain 1–20 product lines.",400);
 const lines: {link:string;sku:string;quantity:number;salePriceGBP:number;maxSupplierPriceCNY:number}[]=[];
 for(const row of original){
  const item=object(row),link=normalizeMarketplaceLink(item.marketplaceUrl);
  const sku=text(item.skuCode,40);
  const sale=item.verifiedSalePriceGBP;
  const maxSupplierPriceCNY=item.maxSupplierPriceCNY;
  if(!link||!sku||sku.length>40||!inRange(item.quantity,999)||
    typeof sale!=="number"||!Number.isFinite(sale)||sale<=0||
    Math.abs(sale*100-Math.round(sale*100))>0.000001||
    typeof maxSupplierPriceCNY!=="number"||!Number.isFinite(maxSupplierPriceCNY)||
    maxSupplierPriceCNY<=0||maxSupplierPriceCNY>100000)
   return error("Each line must include a verified GBP price and a merchant-approved maximum supplier cost in CNY.",400);
  lines.push({link,sku,quantity:item.quantity as number,salePriceGBP:sale,maxSupplierPriceCNY});
 }
 if(new Set(lines.map(l=>l.link+"::"+l.sku)).size!==lines.length)return error("Duplicate variant lines must be combined in the cart.",400);
 const partnerOrderNo=partnerRefFromPayment(paymentRef);
 const knownProducts=new Map<string,Awaited<ReturnType<typeof queryBuckydropProduct>>>();
 const productList:Record<string,unknown>[]=[];
 // Recheck the original seller data server-side. Never trust browser title, SKU price,
 // currency, stock, marketplace or saved cart values in a paid supplier order.
 try{
  for(const line of lines){
   let seller=knownProducts.get(line.link);
   if(!seller){seller=await queryBuckydropProduct(line.link);knownProducts.set(line.link,seller);}
   if(seller.environment!=="live"||!seller.spuCode||seller.available!==true)throw Error("Seller product is no longer confirmed as available.");
   const sku=seller.variants.find(v=>v.skuCode===line.sku);
   if(!sku||sku.price==null||sku.price<=0||sku.stock==null||sku.stock<line.quantity)throw Error("SKU or stock is not available. Refresh the product before checkout.");
   if(sku.price>line.maxSupplierPriceCNY+0.00001)throw Error("Supplier price increased beyond the approved maximum. Merchant review or refund is needed.");
   if(seller.moq!=null&&line.quantity<seller.moq)throw Error("Quantity does not meet the seller minimum order.");
   const platform=platformFor(line.link);
   if(!platform)throw Error("Marketplace is not supported for live orders.");
   productList.push({
    productName:seller.title.slice(0,500),productCount:line.quantity,productImage:(sku.image||seller.images[0]||"").slice(0,300),
    skuCode:sku.skuCode,spuCode:seller.spuCode,productPrice:Number(sku.price.toFixed(2)),
    platform,productLink:line.link,productAttribute:sku.title.slice(0,400),partnerSalePrice:line.salePriceGBP
   });
  }
 }catch(e){return error(e instanceof Error?e.message:"Products could not be verified.",409);}
 const shopRequest:Record<string,unknown>={
  ...customer,partnerOrderNo,productList,partnerSaleCurrency:"GBP",orderTotalAmount:verifiedTotalGBP
 };
 if(!customer.postCode)delete shopRequest.postCode;
 if(!customer.email)delete shopRequest.email;
 const accessCode=issueAccessCode();
 const record:PaidOrderRecord={
  version:1,partnerOrderNo,paymentReferenceHash:codeHash(paymentRef),customerAccessHash:codeHash(accessCode),
  state:"sending",requestedAt:new Date().toISOString(),updatedAt:new Date().toISOString(),
  shopOrderNo:null,originalRequest:shopRequest
 };
 try{
  await reservePaidOrder(record);
 }catch{
  // Blob's allowOverwrite:false is the persistent, per-payment single-send claim.
  // An existing or uncertain order is never created again.
  return error("This payment reference has already been submitted or is being reconciled. No duplicate order was sent.",409);
 }
 let result:Record<string,unknown>;
 try{result=await callBucky("create-shop-order",shopRequest);}
 catch{
  // Network timeout / malformed write response can have occurred AFTER acceptance.
  // Keep original reference and request for reconciliation. Never auto-submit again.
  record.state="outcome_unknown";
  record.updatedAt=new Date().toISOString();
  try{await updatePaidOrder(record);}catch{}
  return NextResponse.json({partnerOrderNo,accessCode,state:"verification_required",message:"Order submission requires merchant reconciliation. Do not resubmit."},{status:202,headers:{"Cache-Control":"no-store"}});
 }
 record.state="accepted";
 record.shopOrderNo=text(result.shopOrderNo,200)||null;
 record.updatedAt=new Date().toISOString();
 try{await updatePaidOrder(record);}catch{
  // The supplier accepted the write even if record update failed.
  // Caller MUST retain original reference and never resend.
  return NextResponse.json({partnerOrderNo,accessCode,state:"accepted_record_update_pending",message:"The fulfilment partner accepted the order. Secure record update needs attention."},{status:202,headers:{"Cache-Control":"no-store"}});
 }
 return NextResponse.json({partnerOrderNo,shopOrderNo:record.shopOrderNo,accessCode,state:"accepted",message:"Order accepted by the fulfilment partner; this is not proof of purchase, payment or fulfilment."},{headers:{"Cache-Control":"no-store"}});
}
