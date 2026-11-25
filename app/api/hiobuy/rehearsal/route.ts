import {NextResponse} from "next/server";
import {currentCustomer,accountOriginValid} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {ordersFor,orderFor,createOrder,addEvent,mockPay,startTestPayment,confirmTestPayment,testReady,RehearsalError} from "@/lib/hiobuy-rehearsal";
import {shippingAmount} from "@/lib/hiobuy-rehearsal-model";
export const dynamic="force-dynamic";export const runtime="nodejs";export const maxDuration=60;
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
const fail=(e:unknown)=>reply({error:e instanceof RehearsalError?e.message:"Rehearsal storage or provider unavailable"},e instanceof RehearsalError?e.status:503);
export async function GET(){const customer=await currentCustomer();if(!customer||!isOwnerPremiumCustomer(customer))return reply({error:"Owner sign-in required"},403);try{return reply({orders:await ordersFor(customer.id),stripeTestReady:testReady()});}catch(e){return fail(e);}}
export async function POST(req:Request){
 const customer=await currentCustomer();if(!customer||!isOwnerPremiumCustomer(customer)||!accountOriginValid(req))return reply({error:"Owner sign-in required"},403);
 try{
  const raw=await req.text();if(raw.length>2000)return reply({error:"Request too large"},413);const d=JSON.parse(raw);
  if(d.action==="create")return reply({order:await createOrder(customer.id,d.id,d.mode)});
  const order=await orderFor(customer.id,d.id);if(!order)return reply({error:"Order not found"},404);
  if(["mock-pay","start-payment","confirm-payment"].includes(d.action)){
   if(d.stage!=="product"&&d.stage!=="shipping")return reply({error:"Invalid payment stage"},400);
   if(d.action==="mock-pay")return reply({order:await mockPay(order,d.stage)});
   if(d.action==="start-payment")return reply({url:await startTestPayment(order,d.stage,new URL(req.url).origin)});
   return reply({order:await confirmTestPayment(order,d.stage)});
  }
  if(d.action==="packing"){shippingAmount(d.line);return reply({order:await addEvent(order,"packing",{line:d.line})});}
  if(d.action==="arrived"||d.action==="packed"||d.action==="delivered")return reply({order:await addEvent(order,d.action)});
  return reply({error:"Unsupported action"},400);
 }catch(e){return fail(e);}
}
