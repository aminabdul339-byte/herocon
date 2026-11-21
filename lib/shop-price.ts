import type {PersonalShopProduct} from "@/lib/personal-shop";

export type ShopFxRates={
 cnyToGbp:number;usdToGbp:number;cnyDate:string;usdDate:string;hasFallback:boolean;
};

/** Currency shown to shoppers is always GBP; source currency is never relabelled. */
export function priceAmountGbp(p:PersonalShopProduct,rates:ShopFxRates):number|null{
 if(typeof p.priceGBP==="number"&&Number.isFinite(p.priceGBP)&&p.priceGBP>0)return p.priceGBP;
 if(typeof p.priceCNY==="number"&&Number.isFinite(p.priceCNY)&&p.priceCNY>0)return p.priceCNY*rates.cnyToGbp;
 if(typeof p.priceUSD==="number"&&Number.isFinite(p.priceUSD)&&p.priceUSD>0)return p.priceUSD*rates.usdToGbp;
 return null;
}
export function shopPrice(p:PersonalShopProduct,rates:ShopFxRates):string{
 const n=priceAmountGbp(p,rates);
 return n!==null?"£"+n.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2}):"GBP price unavailable";
}
export function priceIsConverted(p:PersonalShopProduct):boolean{
 return !(typeof p.priceGBP==="number"&&Number.isFinite(p.priceGBP)&&p.priceGBP>0);
}
export function ratesDisclosure(rates:ShopFxRates):string{
 const date=rates.cnyDate<rates.usdDate?rates.cnyDate:rates.usdDate;
 return "Approximate GBP conversions using reference exchange rates dated "+date+(rates.hasFallback?" (some fallback rates in use)":"")+".";
}
