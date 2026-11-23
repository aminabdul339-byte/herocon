import {NextResponse} from "next/server";
import {currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {enabledMembershipMode,managementMode,getMembershipStatus,canSubscribeToMembership,ownerTestAllowed,MembershipBillingError} from "@/lib/membership-billing";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
export async function GET(){
 const user=await currentCustomer();
 if(!user)return reply({authenticated:false,membershipActive:false},401);
 if(isOwnerPremiumCustomer(user)){
  // The complimentary entitlement never creates Stripe billing, but preserve
  // access to the cancellation portal if this owner paid for a subscription earlier.
  try{
   const existingMode=await managementMode(user);
   const existing=existingMode?await getMembershipStatus(user,existingMode):null;
   return reply({authenticated:true,membershipActive:true,complimentaryOwnerPremium:true,
    ownerBuyAccess:true,testMembershipActive:existingMode==="test"&&Boolean(existing?.active),
    billingReady:false,canSubscribe:false,mode:existingMode,
    status:"owner_granted",renewalAt:existing?.renewalAt||null,
    cancelAtPeriodEnd:existing?.cancelAtPeriodEnd||false,
    hasBillingAccount:Boolean(existing?.subscriptionId),paidMembershipActive:existingMode==="live"&&Boolean(existing?.active),
    priceGBP:"0.00",interval:"none"});
  }catch{
   return reply({authenticated:true,membershipActive:true,complimentaryOwnerPremium:true,
    ownerBuyAccess:true,billingReady:false,canSubscribe:false,mode:null,status:"owner_granted",
    renewalAt:null,hasBillingAccount:false,billingLookupUnavailable:true,
    priceGBP:"0.00",interval:"none"});
  }
 }
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
   hasBillingAccount:status.subscriptionId!==null,ownerLiveTest:mode==="live"&&ownerTestAllowed(user)&&process.env.HEROCON_MEMBERSHIP_LIVE_ENABLED!=="true",priceGBP:"9.99",interval:"month"});
 }catch(e){
  return reply({authenticated:true,membershipActive:false,billingReady:false,
   error:e instanceof MembershipBillingError?e.message:"Unable to verify membership."},503);
 }
}
