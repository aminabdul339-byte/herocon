import {NextResponse} from "next/server";
import {currentCustomer} from "@/lib/customer-auth";
import {enabledMembershipMode,managementMode,getMembershipStatus,canSubscribeToMembership,MembershipBillingError} from "@/lib/membership-billing";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function GET(){
 const user=await currentCustomer();
 if(!user)return reply({authenticated:false,membershipActive:false},401);
 const mode=await managementMode(user);
 const purchaseMode=enabledMembershipMode();
 if(!mode)return reply({authenticated:true,membershipActive:false,
  billingReady:false,testMode:false,priceGBP:"9.99",interval:"month"});
 try{
  const status=await getMembershipStatus(user,mode);
  return reply({authenticated:true,membershipActive:status.active&&mode==="live",
   testMembershipActive:status.active&&mode==="test",billingReady:purchaseMode!==null&&canSubscribeToMembership(user,purchaseMode),
   canSubscribe:purchaseMode!==null&&canSubscribeToMembership(user,purchaseMode),mode,status:status.status,
   renewalAt:status.renewalAt,cancelAtPeriodEnd:status.cancelAtPeriodEnd,
   hasBillingAccount:status.subscriptionId!==null,priceGBP:"9.99",interval:"month"});
 }catch(e){
  return reply({authenticated:true,membershipActive:false,billingReady:false,
   error:e instanceof MembershipBillingError?e.message:"Unable to verify membership."},503);
 }
}
