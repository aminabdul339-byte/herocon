import {NextResponse} from "next/server";
import {accountOriginValid,currentCustomer} from "@/lib/customer-auth";
import {createMembershipPortal,managementMode,MembershipBillingError} from "@/lib/membership-billing";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"Start the billing portal on Herocon."},403);
 const user=await currentCustomer();
 if(!user)return reply({error:"Sign in to manage your billing."},401);
 const mode=await managementMode(user);
 if(!mode)return reply({error:"No membership billing profile is linked."},404);
 try{
  const url=await createMembershipPortal(user,mode);
  return reply({url});
 }catch(e){
  return reply({error:e instanceof MembershipBillingError?e.message:"The billing portal is unavailable."},
   e instanceof MembershipBillingError?e.status:503);
 }
}
