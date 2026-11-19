import {NextResponse} from "next/server";
import {accountOriginValid,currentCustomer} from "@/lib/customer-auth";
import {createMembershipCheckout,enabledMembershipMode,MembershipBillingError} from "@/lib/membership-billing";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"Start checkout on Herocon."},403);
 const user=await currentCustomer();
 if(!user)return reply({error:"Sign in to your free account first."},401);
 const mode=enabledMembershipMode();
 if(!mode)return reply({error:"Membership payments are not yet enabled."},503);
 try{
  const url=await createMembershipCheckout(user,mode);
  return reply({url,testMode:mode==="test",label:mode==="test"?"Stripe test payment — no real money":"Herocon £9.99/month"});
 }catch(e){
  return reply({error:e instanceof MembershipBillingError?e.message:"Checkout is currently unavailable."},
   e instanceof MembershipBillingError?e.status:503);
 }
}
