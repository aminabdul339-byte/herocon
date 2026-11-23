import "server-only";
import {getProducts} from "@/lib/catalogue-server";
import {productId} from "@/lib/catalogue";
import {findPersonalProduct} from "@/lib/personal-shop";
import {getSavedBuckydropProduct} from "@/lib/buckydrop-cache";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";
import {calculateMinimumCustomerPrice,assessMerchantCheckout,type PricingCosts} from "@/lib/order-economics";
import type {BuckydropProduct} from "@/lib/buckydrop";

/**
 * Direct retail price calculator; zero BuckyDrop paid product queries.
 * All money-affecting estimates must be set and approved by the merchant
 * (they are intentionally not derived from a provisional API currency).
 * The initial pilot is one line, 1–3 units, with a total under £100.
 */
export class AutoPriceError extends Error{
 constructor(public status:number,message:string){super(message);}
}
const HOURS=60*60*1000;
const TWO_WEEKS=14*24*HOURS;
const asGBP=(key:string,minPence:number,maxPence=100000)=>{
 const value=process.env[key],num=typeof value==="string"&&/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(value)?Number(value):NaN;
 const pence=Math.round(num*100);
 if(!Number.isSafeInteger(pence)||pence<minPence||pence>maxPence)throw new AutoPriceError(503,"Merchant purchase-cost configuration is incomplete: "+key+".");
 return pence;
};
export type OwnerAutoSelection={productId:string;skuCode:string;quantity:number};
export type OwnerAutoComputed={
 sourceUrl:string;skuCode:string;quantity:number;title:string;variant:string;
 supplierPriceCNY:number;unitPriceGBP:number;productSubtotalPence:number;
 shippingPence:number;taxPence:number;serviceFeePence:99;totalPence:number;
 effectiveFX:number;economics:ReturnType<typeof assessMerchantCheckout>;
 snapshotSavedAt:string;
};
export function ownerAutoPilotConfigured(){
 const keys=[
 "HEROCON_OWNER_AUTOBUY_PRICING_APPROVED",
 "HEROCON_OWNER_PILOT_SHIPPING_BUDGET_APPROVED"
 ];
 const missing=keys.filter(k=>process.env[k]!=="true");
 if(!process.env.BLOB_READ_WRITE_TOKEN)missing.push("BLOB_READ_WRITE_TOKEN");
 for(const k of ["HEROCON_OWNER_PILOT_FX_GBP_PER_CNY","HEROCON_OWNER_PILOT_SHIPPING_GBP",
  "HEROCON_OWNER_PILOT_BUCKYDROP_FEES_GBP","HEROCON_OWNER_PILOT_WALLET_FEES_GBP",
  "HEROCON_OWNER_PILOT_SHIPPING_BUFFER_GBP","HEROCON_OWNER_PILOT_TAX_DUTIES_GBP"]){
  if(!process.env[k])missing.push(k);
 }
 return {enabled:missing.length===0,missing};
}
export async function computeOwnerAutoPrice(selection:OwnerAutoSelection):Promise<OwnerAutoComputed>{
 if(!ownerAutoPilotConfigured().enabled)
  throw new AutoPriceError(503,"The all-in shipping and wallet fee budgets have not yet been approved for card payments.");
 const {productId:id,skuCode,quantity}=selection;
 if(!/^[A-Za-z0-9_-]{5,100}$/.test(id)||!/^[A-Za-z0-9_-]{1,40}$/.test(skuCode)||
  !Number.isInteger(quantity)||quantity<1||quantity>3)
  throw new AutoPriceError(400,"Select one saved SKU and quantity 1–3 for the first owner purchase.");
 const products=await getProducts();
 const item=products.find(p=>productId(p)===id||p.canonicalId===id);
 const personal=item?null:findPersonalProduct(id);
 const sourceUrl=normalizeMarketplaceLink(item?.originalMarketplaceUrl||personal?.originalUrl);
 if(!sourceUrl)throw new AutoPriceError(404,"A verified original marketplace link is required.");
 let seller:BuckydropProduct|null;
 try{seller=await getSavedBuckydropProduct(sourceUrl);}catch{throw new AutoPriceError(503,"Saved supplier record cannot be read. No payment will be taken.");}
 if(!seller||seller.environment!=="live"||!seller.spuCode||
  !seller.snapshotSavedAt||Date.now()-Date.parse(seller.snapshotSavedAt)>TWO_WEEKS)
  throw new AutoPriceError(409,"A recent complete BuckyDrop supplier snapshot is required. Older or missing records cannot be sold yet.");
 const chosen=seller.variants.find(x=>x.skuCode===skuCode);
 if(!chosen||chosen.price==null||chosen.price<=0||!Number.isFinite(chosen.price)||
  chosen.stock==null||chosen.stock<quantity||seller.available!==true||
  quantity<(seller.moq||1))
  throw new AutoPriceError(409,"This saved supplier option is unavailable or does not meet seller stock/minimum order rules.");
 const fxString=process.env.HEROCON_OWNER_PILOT_FX_GBP_PER_CNY||"";
 const effectiveFX=Number(fxString);
 if(!/^(?:0|[1-9]\d*)(?:\.\d{1,6})?$/.test(fxString)||
  !Number.isFinite(effectiveFX)||effectiveFX<0.01||effectiveFX>0.75)
  throw new AutoPriceError(503,"The effective BuckyDrop CNY/GBP wallet funding rate is not approved.");
 const shippingPence=asGBP("HEROCON_OWNER_PILOT_SHIPPING_GBP",100)*quantity;
 const buckydropFeesPence=asGBP("HEROCON_OWNER_PILOT_BUCKYDROP_FEES_GBP",1)*quantity;
 const walletAndFxFeesPence=asGBP("HEROCON_OWNER_PILOT_WALLET_FEES_GBP",1)*quantity;
 const shippingRiskReservePence=asGBP("HEROCON_OWNER_PILOT_SHIPPING_BUFFER_GBP",50)*quantity;
 const taxPence=asGBP("HEROCON_OWNER_PILOT_TAX_DUTIES_GBP",0)*quantity;
 const supplierCostPence=Math.ceil(chosen.price*quantity*effectiveFX*100);
 const costs:PricingCosts={
  supplierCostPence,internationalFreightPence:shippingPence,buckydropFeesPence,
  walletAndFxFeesPence,taxAndDutiesPence:taxPence,shippingRiskReservePence
 };
 const minimumTotal=calculateMinimumCustomerPrice(costs);
 // Retail item amount may not be negative even on cheap items.
 const productSubtotalPence=Math.max(100,minimumTotal-shippingPence-taxPence-99);
 const totalPence=productSubtotalPence+shippingPence+taxPence+99;
 if(totalPence>10000)throw new AutoPriceError(409,"This product exceeds the £100 first-order safety limit.");
 const economics=assessMerchantCheckout(totalPence,costs);
 if(!economics.priceApproved)throw new AutoPriceError(503,"Herocon's planned profit reserve is insufficient.");
 if(productSubtotalPence%quantity!==0){
  // Add at most two pence to make Stripe's per-unit retail price exact.
  const retailUnit=Math.ceil(productSubtotalPence/quantity);
  return finalize({sourceUrl,skuCode,quantity,title:seller.title,variant:chosen.title,
   supplierPriceCNY:chosen.price,shippingPence,taxPence,effectiveFX,
   productSubtotalPence:retailUnit*quantity,snapshotSavedAt:seller.snapshotSavedAt,costs});
 }
 return finalize({sourceUrl,skuCode,quantity,title:seller.title,variant:chosen.title,
  supplierPriceCNY:chosen.price,shippingPence,taxPence,effectiveFX,
  productSubtotalPence,snapshotSavedAt:seller.snapshotSavedAt,costs});
}
function finalize(x:{
 sourceUrl:string;skuCode:string;quantity:number;title:string;variant:string;
 supplierPriceCNY:number;shippingPence:number;taxPence:number;effectiveFX:number;
 productSubtotalPence:number;snapshotSavedAt:string;costs:PricingCosts;
}):OwnerAutoComputed{
 const totalPence=x.productSubtotalPence+x.shippingPence+x.taxPence+99;
 if(totalPence>10000)throw new AutoPriceError(409,"The owner pilot order must be below £100.");
 const economics=assessMerchantCheckout(totalPence,x.costs);
 if(!economics.priceApproved)throw new AutoPriceError(409,"Automatic retail price does not cover expected merchant costs.");
 return {sourceUrl:x.sourceUrl,skuCode:x.skuCode,quantity:x.quantity,
  title:x.title.slice(0,120),variant:x.variant.slice(0,100),
  supplierPriceCNY:x.supplierPriceCNY,unitPriceGBP:x.productSubtotalPence/100/x.quantity,
  productSubtotalPence:x.productSubtotalPence,
  shippingPence:x.shippingPence,taxPence:x.taxPence,
  serviceFeePence:99,totalPence,effectiveFX:x.effectiveFX,
  economics,snapshotSavedAt:x.snapshotSavedAt};
}
