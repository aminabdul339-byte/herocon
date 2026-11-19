import {NextResponse} from "next/server";
import {checkCartAvailability} from "@/lib/checkout-readiness";
import {currentCustomer} from "@/lib/customer-auth";

export const runtime="nodejs";
export const dynamic="force-dynamic";
const visitors=new Map<string,{start:number;count:number}>();
const reply=(obj:unknown,status=200)=>NextResponse.json(obj,{status,headers:{"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff"}});

export async function POST(request:Request){
 if(!await currentCustomer())return reply({error:"Create a free Herocon account or sign in before requesting a supplier stock check."},401);
 if(process.env.BUCKYDROP_ENV!=="live"||process.env.BUCKYDROP_ENABLE_PRODUCT_LOOKUP!=="true")
  return reply({error:"Supplier verification is unavailable."},503);
 const origin=request.headers.get("origin");
 try{if(!origin||new URL(origin).origin!==new URL(request.url).origin)return reply({error:"Open Herocon to check your cart."},403);}
 catch{return reply({error:"Invalid origin."},403);}
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"Expected JSON."},415);
 if(Number(request.headers.get("content-length")||0)>4500)return reply({error:"Cart request is too large."},413);
 const ip=request.headers.get("x-real-ip")||request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown";
 const now=Date.now();if(visitors.size>1000)for(const [key,v] of visitors)if(now-v.start>60000)visitors.delete(key);
 const found=visitors.get(ip);
 if(found&&now-found.start<60000){found.count++;if(found.count>3)return reply({error:"Please try again after a short break."},429);}
 else visitors.set(ip,{start:now,count:1});
 let body:unknown;
 try{const raw=await request.text();if(raw.length>4500)return reply({error:"Cart request is too large."},413);body=JSON.parse(raw);}
 catch{return reply({error:"Invalid cart."},400);}
 try{
  const lines=body&&typeof body==="object"&&!Array.isArray(body)?(body as Record<string,unknown>).lines:null;
  const report=await checkCartAvailability(lines);
  return reply(report);
 }catch(e){
  const message=e instanceof Error&&/Please select|Invalid cart|Each option|Duplicate seller/.test(e.message)?e.message:"Unable to verify this cart right now.";
  return reply({error:message},message.startsWith("Unable")?502:400);
 }
}
