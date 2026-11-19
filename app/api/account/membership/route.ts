import {NextResponse} from "next/server";
import {currentCustomer,customerAuthConfigured} from "@/lib/customer-auth";
import {checkActiveMembership} from "@/lib/membership-access";
export const dynamic="force-dynamic";
export const runtime="nodejs";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function GET(){
 if(!customerAuthConfigured())return reply({authenticated:false,membershipActive:false,configured:false},503);
 const user=await currentCustomer();
 if(!user)return reply({authenticated:false,membershipActive:false,configured:false},401);
 const billingReady=process.env.HEROCON_MEMBERSHIP_PURCHASE_GATE_ENABLED==="true"&&
  process.env.HEROCON_STRIPE_MEMBERSHIP_BILLING_READY==="true";
 const active=billingReady&&await checkActiveMembership(user);
 return reply({authenticated:true,membershipActive:active,billingReady,
  priceGBP:"9.99",interval:"month",
  notice:active?"Membership verified.":"Creating an account and filling your cart is free. A membership is required only before making a new purchase; subscription billing is not yet live."});
}
