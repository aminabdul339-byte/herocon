import "server-only";
import {queryBuckydropProduct} from "@/lib/buckydrop";
import {normalizeMarketplaceLink} from "@/lib/marketplace-links";

export type AvailabilityLine={
 marketplaceUrl:string;
 skuCode:string;
 quantity:number;
 title:string;
 status:"confirmed"|"unavailable"|"unverified";
 reason:string;
 supplierUnitCny:number|null;
 supplierSubtotalCny:number|null;
 supplierStock:number|null;
};
export type AvailabilityReport={
 verifiedAt:string;
 allConfirmed:boolean;
 checkoutReady:boolean;
 checkoutBlockers:string[];
 lines:AvailabilityLine[];
 note:string;
};
type InputLine={marketplaceUrl:string;skuCode:string;quantity:number;title:string};
const clean=(v:unknown,max=100)=>typeof v==="string"?v.trim().slice(0,max):"";
function parseLines(value:unknown):InputLine[]{
 if(!Array.isArray(value)||value.length<1||value.length>5)throw new Error("Please select 1–5 product options to verify at a time.");
 const lines:InputLine[]=[];
 for(const valueLine of value){
  if(!valueLine||typeof valueLine!=="object"||Array.isArray(valueLine))throw Error("Invalid cart option.");
  const raw=valueLine as Record<string,unknown>;
  const marketplaceUrl=normalizeMarketplaceLink(raw.marketplaceUrl);
  const skuCode=clean(raw.skuCode,80);
  const quantity=raw.quantity;
  if(!marketplaceUrl||!skuCode||typeof quantity!=="number"||!Number.isInteger(quantity)||quantity<1||quantity>99)throw Error("Each option needs a valid supplier link, SKU and quantity of 1–99.");
  lines.push({marketplaceUrl,skuCode,quantity,title:clean(raw.title,100)||"Supplier product"});
 }
 const identifiers=lines.map(l=>l.marketplaceUrl+"::"+l.skuCode);
 if(new Set(identifiers).size!==identifiers.length)throw Error("Duplicate seller variants must be combined.");
 return lines;
}

/**
 * Always check live supplier data. Browser cart prices are deliberately ignored.
 * A confirmed supplier SKU is NOT a final GBP customer retail/shipping/tax quote.
 */
export async function checkCartAvailability(value:unknown):Promise<AvailabilityReport>{
 const lines=parseLines(value);
 const results:AvailabilityLine[]=[];
 const cached=new Map<string,Awaited<ReturnType<typeof queryBuckydropProduct>>|null>();
 const errors=new Map<string,string>();
 for(const line of lines){
  if(!cached.has(line.marketplaceUrl)&&!errors.has(line.marketplaceUrl)){
   try{
    const item=await queryBuckydropProduct(line.marketplaceUrl);
    if(item.environment!=="live")throw Error("Live supplier details are not available.");
    cached.set(line.marketplaceUrl,item);
   }catch{
    errors.set(line.marketplaceUrl,"Live seller details could not be confirmed.");
   }
  }
 }
 const quantities=new Map<string,number>();
 for(const line of lines)quantities.set(line.marketplaceUrl,(quantities.get(line.marketplaceUrl)||0)+line.quantity);
 for(const line of lines){
  const item=cached.get(line.marketplaceUrl);
  const reasonUnavailable=errors.get(line.marketplaceUrl);
  const base={marketplaceUrl:line.marketplaceUrl,skuCode:line.skuCode,quantity:line.quantity,title:line.title};
  if(!item||reasonUnavailable){
   results.push({...base,status:"unverified",reason:reasonUnavailable||"Seller lookup unavailable.",supplierUnitCny:null,supplierSubtotalCny:null,supplierStock:null});
   continue;
  }
  const variant=item.variants.find(v=>v.skuCode===line.skuCode);
  const sellerPrice=variant?.price;
  const stock=variant?.stock;
  const minimum=item.moq||1;
  let reason="";
  let status:AvailabilityLine["status"]="confirmed";
  if(item.available===false){status="unavailable";reason="Supplier no longer lists this product as available.";}
  else if(!variant){status="unavailable";reason="The selected size or colour is no longer available.";}
  else if(stock!==null&&stock!==undefined&&stock<line.quantity){status="unavailable";reason="Insufficient supplier stock.";}
  else if((quantities.get(line.marketplaceUrl)||0)<minimum){status="unavailable";reason="Supplier minimum order is "+minimum+" units.";}
  else if(item.available!==true){status="unverified";reason="Supplier availability has not been confirmed.";}
  else if(stock==null){status="unverified";reason="Supplier stock count has not been confirmed.";}
  else if(sellerPrice==null||!Number.isFinite(sellerPrice)||sellerPrice<=0){status="unverified";reason="Supplier unit price has not been confirmed.";}
  else if(!item.spuCode){status="unverified";reason="Supplier product code is unavailable.";}
  results.push({...base,status,reason:reason||"SKU, supplier price and stock verified.",
   supplierUnitCny:sellerPrice!=null&&Number.isFinite(sellerPrice)?sellerPrice:null,
   supplierSubtotalCny:sellerPrice!=null&&Number.isFinite(sellerPrice)?Math.round(sellerPrice*line.quantity*100)/100:null,
   supplierStock:stock??null});
 }
 const allConfirmed=results.every(l=>l.status==="confirmed");
 return {
  verifiedAt:new Date().toISOString(),allConfirmed,checkoutReady:false,
  checkoutBlockers:[
   "Final all-in GBP selling prices are not configured.",
   "International shipping cost currency, dimensions, duties and tax treatment are not yet verified.",
   "Stripe paid-order reconciliation and BuckyDrop supplier payment/fulfilment are not yet end-to-end tested."
  ],
  lines:results,
  note:"Live supplier availability only. Supplier CNY figures are not Herocon GBP retail prices or a payment quotation."
 };
}
