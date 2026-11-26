import "server-only";
import type {ShopFxRates} from "@/lib/shop-price";

/**
 * Indicative currency conversions, never final offers.
 * Reference data is refreshed every 6 hours. A dated published market-close
 * fallback keeps a GBP display when a third-party rate API is unavailable.
 */
const REFERENCE_CNY_GBP=1/8.7356; // GBP/CNY market close 20 Nov 2026
const REFERENCE_USD_GBP=1/1.3099; // GBP/USD observed 20 Nov 2026
const REFERENCE_DATE="2026-11-20";

async function reference(base:"CNY"|"USD") {
 const res=await fetch("https://api.frankfurter.dev/v2/rate/"+base+"/GBP",{
  next:{revalidate:21600},
  signal:AbortSignal.timeout(2200)
 });
 if(!res.ok)throw new Error("Reference rate unavailable: "+res.status);
 const data:unknown=await res.json();
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Invalid rate data");
 const v=data as Record<string,unknown>;
 if(v.base!==base||v.quote!=="GBP"||typeof v.rate!=="number"||!Number.isFinite(v.rate)||v.rate<0.01||v.rate>1||typeof v.date!=="string")throw new Error("Invalid exchange-rate response");
 return {rate:v.rate,date:v.date};
}

export async function getPersonalShopRates():Promise<ShopFxRates>{
 const [c,u]=await Promise.allSettled([reference("CNY"),reference("USD")]);
 return {
  cnyToGbp:c.status==="fulfilled"?c.value.rate:REFERENCE_CNY_GBP,
  usdToGbp:u.status==="fulfilled"?u.value.rate:REFERENCE_USD_GBP,
  cnyDate:c.status==="fulfilled"?c.value.date:REFERENCE_DATE,
  usdDate:u.status==="fulfilled"?u.value.date:REFERENCE_DATE,
  hasFallback:c.status!=="fulfilled"||u.status!=="fulfilled"
 };
}
