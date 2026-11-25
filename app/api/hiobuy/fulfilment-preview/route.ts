import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {connectionStatus,parseProduct,quoteProduct,HioError} from "@/lib/hiobuy-fulfilment";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export const maxDuration=60;
const reply=(x:unknown,status=200)=>NextResponse.json(x,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
let windowStart=0,requests=0;
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"INVALID_ORIGIN"},403);
 if(!isOwnerPremiumCustomer(await currentCustomer()))return reply({error:"OWNER_SIGN_IN_REQUIRED"},403);
 if(Date.now()-windowStart>60000){windowStart=Date.now();requests=0;}
 if(++requests>12)return reply({error:"RATE_LIMIT"},429);
 try{
  const raw=await request.text();if(raw.length>3000)return reply({error:"REQUEST_TOO_LARGE"},413);
  const d=JSON.parse(raw);
  if(d.action==="connection")return reply(await connectionStatus());
  if(d.action==="parse")return reply(await parseProduct(d.url));
  if(d.action==="quote")return reply(await quoteProduct(d.url,d.sku,d.quantity));
  return reply({error:"UNSUPPORTED_ACTION"},400);
 }catch(e){return reply({error:e instanceof HioError?e.code:"PROVIDER_CHECK_FAILED"},e instanceof HioError&&e.status>=400&&e.status<600?e.status:503);}
}
