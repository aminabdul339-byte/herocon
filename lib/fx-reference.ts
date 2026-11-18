export type FxRate={rate:number;date:string};

// Frankfurter reference-rate API. For indicative display only (not a final
// customer payment conversion, landed cost or FX guarantee).
export async function getReferenceCnyGbpRate():Promise<FxRate>{
 const response=await fetch("https://api.frankfurter.dev/v2/rate/CNY/GBP",{
  next:{revalidate:21600},
  signal:AbortSignal.timeout(8000)
 });
 if(!response.ok)throw new Error("FX rate unavailable");
 const payload:unknown=await response.json();
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Invalid FX response");
 const data=payload as Record<string,unknown>;
 if(data.base!=="CNY"||data.quote!=="GBP"||
  typeof data.rate!=="number"||!Number.isFinite(data.rate)||data.rate<=0.01||data.rate>=0.5||
  typeof data.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)){
  throw new Error("Invalid CNY to GBP reference rate");
 }
 return {rate:data.rate,date:data.date};
}