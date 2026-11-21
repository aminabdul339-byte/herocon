import type {PersonalShopProduct} from "@/lib/personal-shop";

/** Keep the spreadsheet's reference currency rather than invent a GBP conversion. */
export function shopPrice(p:PersonalShopProduct):string{
 if(p.priceGBP!==null&&p.priceGBP>0)return "£"+p.priceGBP.toLocaleString("en-GB",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceUSD!==null&&p.priceUSD>0)return "$"+p.priceUSD.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 if(p.priceCNY!==null&&p.priceCNY>0)return "¥"+p.priceCNY.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
 return "See source price";
}
