import {NextResponse} from "next/server";
import {accountOriginValid,currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
let lastCheck=0;
async function check(path:string,key:string){
 try{
  const r=await fetch("https://api.hiobuy.com"+path,{headers:{Authorization:"Bearer "+key,Language:"en"},cache:"no-store",redirect:"error",signal:AbortSignal.timeout(15000)});
  const data=obj(await r.json().catch(()=>null));
  const code=obj(data.error).code||data.code;
  if(!r.ok||data.success===false)return {ok:false,status:r.status,code:typeof code==="string"&&/^[A-Z_]{3,80}$/.test(code)?code:"PROVIDER_ERROR"};
  return {ok:true,status:r.status,data};
 }catch{return {ok:false,status:503,code:"PROVIDER_UNAVAILABLE"};}
}
export async function POST(req:Request){
 if(!accountOriginValid(req)||!isOwnerPremiumCustomer(await currentCustomer()))return reply({error:"Owner access required."},403);
 const key=process.env.HIOBUY_API_KEY?.trim();
 if(!key)return reply({error:"HioBuy key is not configured."},503);
 if(Date.now()-lastCheck<60000)return reply({error:"Please wait one minute between checks."},429);
 lastCheck=Date.now();
 const [wallet,channels]=await Promise.all([check("/v1/fulfillment/balance",key),check("/v1/fulfillment/shipping/channels?country_code=GB&page=1&page_size=20",key)]);
 const balance=obj(obj(wallet.data).balance),available=obj(balance.available);
 const amount=typeof available.amount==="number"&&Number.isSafeInteger(available.amount)&&available.currency==="CNY"?available.amount:null;
 const clean=(r:Awaited<ReturnType<typeof check>>)=>({ok:r.ok,status:r.status,code:r.code||null});
 return reply({wallet:{...clean(wallet),availableCny:amount===null?null:amount/100},shipping:clean(channels),checkedAt:new Date().toISOString(),checkoutEnabled:false});
}
