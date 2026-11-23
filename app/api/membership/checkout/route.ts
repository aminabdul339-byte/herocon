import {NextResponse} from "next/server";
import {accountOriginValid,currentCustomer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
import {createMembershipCheckout,enabledMembershipMode,MembershipBillingError} from "@/lib/membership-billing";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
export async function POST(request:Request){
 if(!accountOriginValid(request))return reply({error:"Start checkout on Herocon."},403);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))
  return reply({error:"Billing confirmation required."},415);
 let data:Record<string,unknown>;
 try{
  const raw=await request.text();
  if(raw.length>250)return reply({error:"Request too long."},413);
  const parsed:unknown=JSON.parse(raw);
  if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw Error("Invalid");
  data=parsed as Record<string,unknown>;
 }catch{return reply({error:"Invalid billing confirmation."},400);}
 if(data.recurringBillingAcknowledged!==true)
  return reply({error:"Please agree to recurring £9.99 monthly billing before continuing."},400);
 const user=await currentCustomer();
 if(!user)return reply({error:"Sign in to your free account first."},401);
 if(isOwnerPremiumCustomer(user))return reply({error:"Your owner premium membership is complimentary. No £9.99 subscription is required or offered to this account."},409);
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
