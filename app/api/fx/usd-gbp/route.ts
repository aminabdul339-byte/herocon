import {NextResponse} from "next/server";

export const dynamic="force-dynamic";
export async function GET(){
 try{
  const response=await fetch("https://api.frankfurter.dev/v2/rate/USD/GBP",{
   next:{revalidate:21600},
   signal:AbortSignal.timeout(8000)
  });
  if(!response.ok)throw new Error("FX rate unavailable");
  const value:unknown=await response.json();
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid FX response");
  const data=value as Record<string,unknown>;
  if(data.base!=="USD"||data.quote!=="GBP"||typeof data.rate!=="number"
   ||!Number.isFinite(data.rate)||data.rate<=0.01||data.rate>=1
   ||typeof data.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(data.date)){
    throw new Error("Invalid USD/GBP exchange rate");
  }
  return NextResponse.json({base:"USD",quote:"GBP",rate:data.rate,date:data.date,source:"Frankfurter reference rates"},{
   headers:{"Cache-Control":"public, s-maxage=1800, stale-while-revalidate=3600"}
  });
 }catch{
  return NextResponse.json({error:"GBP conversion unavailable"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
