import "server-only";
import {randomBytes,timingSafeEqual} from "node:crypto";
import {get,put} from "@vercel/blob";
import {queryBuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {assessMerchantCheckout,type PricingAssessment} from "@/lib/order-economics";

const PREFIX="checkout/approved/v1/";
export type ApprovedLine={
 marketplaceUrl:string;skuCode:string;quantity:number;title:string;variant:string;
 unitPriceGBP:number;supplierUnitCNY:number;
};
export type ApprovedQuote={
 version:1;id:string;createdAt:string;expiresAt:string;customerEmail:string;
 deliveryCountry:"GB";lines:ApprovedLine[];productSubtotalPence:number;
 shippingPence:number;taxPence:number;serviceFeePence?:number;totalPence:number;saleCurrency:"gbp";
 paymentStage?:"products"|"all_in";estimatedLaterShippingPence?:number;
 economics?:PricingAssessment;supplierFxGBPperCNY?:number;
 fulfilment:"bucky_manual_supplier_payment"|"bucky_prepaid_auto_fulfilment";
};
export class QuoteError extends Error{constructor(public status:number,message:string){super(message);}}
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const str=(v:unknown,max=160)=>typeof v==="string"?v.trim().slice(0,max):"";
export const quoteIdOk=(s:string)=>/^hq_[a-f0-9]{40}$/.test(s);
const asPence=(v:unknown,max=100000):number=>{
 if(typeof v!=="number"||!Number.isFinite(v)||v<0||v>max/100||
    Math.abs(v*100-Math.round(v*100))>0.00001)throw new QuoteError(400,"Enter a valid GBP amount (two decimal places at most).");
 return Math.round(v*100);
};
export function authorizedCheckoutAdmin(provided:string|null):boolean{
 const secret=process.env.HEROCON_CHECKOUT_ADMIN_KEY||"";
 return secret.length>=32&&!!provided&&secret.length===provided.length&&
  timingSafeEqual(Buffer.from(secret),Buffer.from(provided));
}
export async function createApprovedQuote(input:unknown):Promise<ApprovedQuote>{
 if(!process.env.BLOB_READ_WRITE_TOKEN)throw new QuoteError(503,"Private checkout storage is unavailable.");
 const d=obj(input),email=str(d.customerEmail,150).toLowerCase();
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new QuoteError(400,"A valid customer email is required.");
 if(d.deliveryCountry!=="GB")throw new QuoteError(400,"Only UK deliveries are available in this pilot.");
 if(d.manualPricingApproved!==true)throw new QuoteError(400,"Confirm the shipping, retail and tax amounts have been reviewed.");
 if(d.paymentStage!==undefined&&d.paymentStage!=="products"&&d.paymentStage!=="all_in")throw new QuoteError(400,"Invalid payment model.");
 const allIn=d.paymentStage==="all_in";
 if(allIn&&process.env.HEROCON_ONE_PAYMENT_PILOT_QUOTES_ENABLED!=="true")
  throw new QuoteError(503,"One-payment quotes are not enabled for the merchant.");
 if(allIn&&d.allInCostApproved!==true)
  throw new QuoteError(400,"Confirm that the final GBP price includes all shipping, duties, taxes, fees and a merchant-funded overage reserve; no later shipping charge may be requested.");
 if(!Array.isArray(d.lines)||d.lines.length<1||d.lines.length>5)throw new QuoteError(400,"Enter 1–5 product options.");
 // All-in quotes charge the operator-approved shipping allowance now and forbid a
 // second freight payment. Legacy quotes retain separate warehouse-stage freight.
 const declaredShippingPence=asPence(d.shippingGBP,100000);
 if(declaredShippingPence<=0)throw new QuoteError(400,"Provide an international shipping amount.");
 const shippingPence=allIn?declaredShippingPence:0;
 const estimatedLaterShippingPence=allIn?undefined:declaredShippingPence;
 const taxPence=asPence(d.taxGBP,100000);
 // All merchant costs are mandatory, approved accounting inputs. Never accept
 // a price based on an unverified live freight currency or guessed provider fees.
 const supplierFxGBPperCNY=d.supplierFxGBPperCNY;
 if(d.supplierFxReviewed!==true||typeof supplierFxGBPperCNY!=="number"||
  !Number.isFinite(supplierFxGBPperCNY)||supplierFxGBPperCNY<0.01||supplierFxGBPperCNY>0.75)
  throw new QuoteError(400,"Enter and approve an effective supplier CNY-to-GBP purchasing rate including BuckyDrop wallet FX.");
 const buckydropFeesPence=asPence(d.buckydropFeesGBP,100000);
 const walletAndFxFeesPence=asPence(d.walletAndFxFeesGBP,100000);
 const shippingRiskReservePence=asPence(d.shippingRiskReserveGBP,100000);
 if(buckydropFeesPence<1||walletAndFxFeesPence<1||shippingRiskReservePence<50)
  throw new QuoteError(400,"Enter positive BuckyDrop and wallet/FX fee allowances, plus at least £0.50 shipping contingency. An absent fee is not free.");
 const seen=new Set<string>(),lines:ApprovedLine[]=[];
 const sources=new Map<string,Awaited<ReturnType<typeof queryBuckydropProduct>>>();
 for(const raw of d.lines){
  const row=obj(raw),marketplaceUrl=normalizeMarketplaceLink(row.marketplaceUrl);
  const skuCode=str(row.skuCode,40),quantity=row.quantity;
  if(!marketplaceUrl||!skuCode||typeof quantity!=="number"||!Number.isInteger(quantity)||quantity<1||quantity>99)
   throw new QuoteError(400,"Each row needs a supported marketplace URL, valid SKU and quantity 1–99.");
  if(seen.has(marketplaceUrl+"::"+skuCode))throw new QuoteError(400,"Combine duplicate supplier variants.");
  seen.add(marketplaceUrl+"::"+skuCode);
  const unitPence=asPence(row.unitPriceGBP,100000);
  if(unitPence<=0)throw new QuoteError(400,"Retail unit prices must exceed £0.");
  let supplier=sources.get(marketplaceUrl);
  if(!supplier){supplier=await queryBuckydropProduct(marketplaceUrl);sources.set(marketplaceUrl,supplier);}
  const sku=supplier.variants.find(v=>v.skuCode===skuCode);
  if(supplier.environment!=="live"||supplier.available!==true||!supplier.spuCode||
    !sku||sku.stock==null||sku.stock<quantity||sku.price==null||sku.price<=0)
   throw new QuoteError(409,"A supplier item is not confirmed available or its SKU/stock/price is missing.");
  const units=(d.lines as unknown[]).map(obj).filter(x=>normalizeMarketplaceLink(x.marketplaceUrl)===marketplaceUrl)
   .reduce((n,r)=>n+(typeof r.quantity==="number"?r.quantity:0),0);
  if(supplier.moq!=null&&units<supplier.moq)throw new QuoteError(409,"Supplier minimum order quantity was not met.");
  lines.push({marketplaceUrl,skuCode,quantity,title:supplier.title.slice(0,120),
   variant:sku.title.slice(0,100),unitPriceGBP:unitPence/100,supplierUnitCNY:sku.price});
 }
 const productSubtotalPence=lines.reduce((n,x)=>n+Math.round(x.unitPriceGBP*100)*x.quantity,0);
 // Mandatory 99p service fee is explicit in the checkout, Stripe line items and receipts.
 const serviceFeePence=99;
 const totalPence=productSubtotalPence+shippingPence+taxPence+serviceFeePence;
 const projectedLifetimeTotalPence=totalPence+(estimatedLaterShippingPence||0);
 const supplierCostPence=Math.ceil(lines.reduce((sum,line)=>
  sum+line.supplierUnitCNY*line.quantity,0)*supplierFxGBPperCNY*100);
 const economics=assessMerchantCheckout(projectedLifetimeTotalPence,{
  supplierCostPence,
  internationalFreightPence:declaredShippingPence,
  buckydropFeesPence,walletAndFxFeesPence,taxAndDutiesPence:taxPence,
  shippingRiskReservePence
 });
 if(!economics.priceApproved)
  throw new QuoteError(409,"This order would miss Herocon's profit reserve after BuckyDrop, Stripe and shipping costs. Raise the product price: the minimum projected customer total is £"+(economics.minimumCustomerTotalPence/100).toFixed(2)+". No checkout was created.");
 if(totalPence<50||totalPence>500000)throw new QuoteError(400,"Pilot order total must be £0.50–£5,000.");
 const id="hq_"+randomBytes(20).toString("hex");
 const quote:ApprovedQuote={version:1,id,createdAt:new Date().toISOString(),
  expiresAt:new Date(Date.now()+23*60*60*1000).toISOString(),customerEmail:email,
  deliveryCountry:"GB",lines,productSubtotalPence,shippingPence,taxPence,serviceFeePence,totalPence,
  saleCurrency:"gbp",paymentStage:allIn?"all_in":"products",estimatedLaterShippingPence,
  economics,supplierFxGBPperCNY,
  fulfilment:allIn?"bucky_prepaid_auto_fulfilment":"bucky_manual_supplier_payment"};
 try{
  await put(PREFIX+id+".json",JSON.stringify(quote),{
   access:"private",addRandomSuffix:false,allowOverwrite:false,contentType:"application/json"
  });
 }catch{throw new QuoteError(503,"Unable to save the approved quote.");}
 return quote;
}
export async function getApprovedQuote(id:string):Promise<ApprovedQuote|null>{
 if(!quoteIdOk(id)||!process.env.BLOB_READ_WRITE_TOKEN)return null;
 try{
  const result=await get(PREFIX+id+".json",{access:"private"});
  if(!result||result.statusCode!==200||!result.stream)return null;
  const raw=await new Response(result.stream).text();
  if(raw.length>20000)return null;
  const q=JSON.parse(raw) as ApprovedQuote;
  if(q?.version!==1||q.id!==id||q.saleCurrency!=="gbp"||
   !["bucky_manual_supplier_payment","bucky_prepaid_auto_fulfilment"].includes(q.fulfilment)||q.deliveryCountry!=="GB"||
   !Number.isInteger(q.totalPence)||q.totalPence<50||
   !Array.isArray(q.lines)||q.lines.length<1||q.lines.length>5||
   (!Number.isInteger(q.serviceFeePence??0)||![0,99].includes(q.serviceFeePence??0))||
   q.totalPence!==q.productSubtotalPence+q.shippingPence+q.taxPence+(q.serviceFeePence??0))return null;
  if(q.paymentStage==="all_in"){
   if(q.fulfilment!=="bucky_prepaid_auto_fulfilment"||!Number.isInteger(q.shippingPence)||
    q.shippingPence<=0||q.estimatedLaterShippingPence!==undefined)return null;
  }else if(q.paymentStage==="products"){
   if(q.fulfilment!=="bucky_manual_supplier_payment"||q.shippingPence!==0||
    !Number.isInteger(q.estimatedLaterShippingPence)||(q.estimatedLaterShippingPence||0)<=0)return null;
  }else return null;
  return q;
 }catch{return null;}
}
export const quoteIsCurrent=(q:ApprovedQuote)=>Date.parse(q.expiresAt)>Date.now()+30*60*1000;
export async function verifyApprovedQuoteStock(q:ApprovedQuote):Promise<void>{
 const fetched=new Map<string,Awaited<ReturnType<typeof queryBuckydropProduct>>>();
 for(const row of q.lines){
  let supplier=fetched.get(row.marketplaceUrl);
  if(!supplier){supplier=await queryBuckydropProduct(row.marketplaceUrl);fetched.set(row.marketplaceUrl,supplier);}
  const sku=supplier.variants.find(v=>v.skuCode===row.skuCode);
  if(supplier.environment!=="live"||supplier.available!==true||!supplier.spuCode||
   !sku||sku.price==null||sku.stock==null||sku.stock<row.quantity||
   sku.price>row.supplierUnitCNY*1.02)throw new QuoteError(409,"Supplier stock or costs have changed. Request a new quote.");
 }
}
