import {NextResponse} from "next/server";
import {accountOriginValid,currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(v:unknown,status=200)=>NextResponse.json(v,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});
const obj=(v:unknown):Record<string,unknown>=>v&&typeof v==="object"&&!Array.isArray(v)?v as Record<string,unknown>:{};
const str=(v:unknown)=>typeof v==="string"?v.trim():"";
let last=0;
export async function POST(req:Request){
 if(!accountOriginValid(req)||!isOwnerPremiumCustomer(await currentCustomer()))return reply({error:"Owner access required."},403);
 const key=process.env.HIOBUY_API_KEY?.trim();if(!key)return reply({error:"HioBuy API key not configured."},503);
 let input:Record<string,unknown>;try{const raw=await req.text();if(raw.length>5000)return reply({error:"Invalid request."},413);input=obj(JSON.parse(raw));}catch{return reply({error:"Invalid request."},400);}
 const action=str(input.action),id=str(input.id);
 let path="",body:Record<string,unknown>|undefined;
 if(action==="channels")path="/v1/fulfillment/shipping/channels?country_code=GB&page=1&page_size=20";
 else if(action==="preview"){
  const productId=str(input.productId),skuId=str(input.skuId),quantity=Number(input.quantity);
  const receiver=obj(input.receiver),name=str(receiver.name),mobile=str(receiver.mobile),province=str(receiver.province),city=str(receiver.city),address=str(receiver.address);
  if(!productId||productId.length>500||!skuId||skuId.length>500||!Number.isInteger(quantity)||quantity<1||quantity>99||!name||!mobile||!province||!city||!address||[name,mobile,province,city,address].some(v=>v.length>500))return reply({error:"Enter a native HioBuy product ID, SKU, quantity and confirmed test warehouse address."},400);
  path="/v1/orders/preview";body={channel:"1688",flow:"general",language:"en",receiver:{name,mobile,province,city,address},lines:[{id:productId,spec_id:skuId,quantity}]};
 }else if(["order","package","shipment","tracking"].includes(action)&&/^[A-Za-z0-9_-]{1,200}$/.test(id)){
  if(action==="order"){path="/v1/orders/detail";body={channel:"1688",order_id:id};}
  else if(action==="package")path="/v1/fulfillment/packages/"+encodeURIComponent(id);
  else path="/v1/fulfillment/shipments/"+encodeURIComponent(id)+(action==="tracking"?"/tracking":"");
 }else return reply({error:"Invalid test request."},400);
 if(Date.now()-last<2000)return reply({error:"Wait briefly before the next read."},429);last=Date.now();
 try{
  const res=await fetch("https://api.hiobuy.com"+path,{method:body?"POST":"GET",headers:{Authorization:"Bearer "+key,Language:"en",...(body?{"Content-Type":"application/json"}:{})},body:body?JSON.stringify(body):undefined,cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20000)});
  const data=obj(await res.json().catch(()=>null));const code=obj(data.error).code||data.code;
  if(!res.ok||data.success===false)return reply({error:typeof code==="string"&&/^[A-Z_]{3,80}$/.test(code)?code:"Provider request failed",requestId:res.headers.get("x-request-id")},res.status>=400&&res.status<500?res.status:502);
  // This private owner diagnostic deliberately returns only the selected
  // read-only response. Never show it to a customer or log it.
  return reply({mode:"provider_read",data,requestId:res.headers.get("x-request-id"),checkedAt:new Date().toISOString()});
 }catch{return reply({error:"HioBuy temporarily unavailable."},503);}
}
