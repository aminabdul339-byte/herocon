import "server-only";
import {randomBytes,timingSafeEqual} from "node:crypto";
import {get,put} from "@vercel/blob";
import {queryBuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";

const PREFIX="checkout/approved/v1/";
export type ApprovedLine={
 marketplaceUrl:string;skuCode:string;quantity:number;title:string;variant:string;
 unitPriceGBP:number;supplierUnitCNY:number;
};
export type ApprovedQuote={
 version:1;id:string;createdAt:string;expiresAt:string;customerEmail:string;
 deliveryCountry:"GB";lines:ApprovedLine[];productSubtotalPence:number;
 shippingPence:number;taxPence:number;totalPence:number;saleCurrency:"gbp";
 paymentStage?:"products";estimatedLaterShippingPence?:number;
 fulfilment:"bucky_manual_supplier_payment";
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
 if(!Array.isArray(d.lines)||d.lines.length<1||d.lines.length>5)throw new QuoteError(400,"Enter 1–5 product options.");
 // The first charge is only for products and any applicable stage-one tax.
 // Warehouse-measured international shipping is quoted and paid separately.
 const estimatedLaterShippingPence=asPence(d.shippingGBP,100000);
 if(estimatedLaterShippingPence<=0)throw new QuoteError(400,"Provide a realistic indicative international shipping amount to disclose before product payment.");
 const shippingPence=0,taxPence=asPence(d.taxGBP,100000);
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
 const totalPence=productSubtotalPence+shippingPence+taxPence;
 if(totalPence<50||totalPence>500000)throw new QuoteError(400,"Pilot order total must be £0.50–£5,000.");
 const id="hq_"+randomBytes(20).toString("hex");
 const quote:ApprovedQuote={version:1,id,createdAt:new Date().toISOString(),
  expiresAt:new Date(Date.now()+23*60*60*1000).toISOString(),customerEmail:email,
  deliveryCountry:"GB",lines,productSubtotalPence,shippingPence,taxPence,totalPence,
  saleCurrency:"gbp",paymentStage:"products",estimatedLaterShippingPence,
  fulfilment:"bucky_manual_supplier_payment"};
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
   q.fulfilment!=="bucky_manual_supplier_payment"||q.deliveryCountry!=="GB"||
   !Number.isInteger(q.totalPence)||q.totalPence<50||
   !Array.isArray(q.lines)||q.lines.length<1||q.lines.length>5||
   q.totalPence!==q.productSubtotalPence+q.shippingPence+q.taxPence)return null;
  // Legacy one-payment quotes are not valid for the two-stage checkout.
  if(q.paymentStage!=="products"||q.shippingPence!==0||
   !Number.isInteger(q.estimatedLaterShippingPence)||
   (q.estimatedLaterShippingPence||0)<=0)return null;
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
