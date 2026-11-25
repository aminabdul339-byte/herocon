import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {AUTH_ACCESS_COOKIE,AUTH_REFRESH_COOKIE,authApi,clearCustomerCookies,customerAuthConfigured,setCustomerCookies,verifyCustomerAccess} from "@/lib/customer-auth";
import {membershipEntitlement} from "@/lib/membership-access";
import type {Customer} from "@/lib/customer-auth";
import {isOwnerPremiumCustomer} from "@/lib/owner-premium";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const reply=(body:unknown,status=200)=>NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
async function accountReply(u:Customer,refreshed=false){const membership=await membershipEntitlement(u);return reply({status:"authenticated",authenticated:true,refreshed,user:{id:u.id,email:u.email,ownerPremium:isOwnerPremiumCustomer(u),...membership}});}
function expiring(token:string){try{const p=JSON.parse(Buffer.from(token.split(".")[1],"base64url").toString("utf8"));return typeof p.exp==="number"&&p.exp*1000-Date.now()<10*60*1000;}catch{return false;}}
export async function GET(){
 if(!customerAuthConfigured())return reply({status:"unavailable",authenticated:false,reason:"Free accounts will open once Herocon's authentication service is connected."},503);
 const store=await cookies();
 const access=store.get(AUTH_ACCESS_COOKIE)?.value;
 const refresh=store.get(AUTH_REFRESH_COOKIE)?.value;
 const current=access?await verifyCustomerAccess(access):null;
 if(current&&(!refresh||!expiring(access!)))return accountReply(current);
 if(!refresh)return reply({status:"guest",authenticated:false});
 try{
  const tokens=await authApi("/token?grant_type=refresh_token",{refresh_token:refresh});
  if(!tokens.access_token||!tokens.refresh_token)throw Error("No refreshed tokens.");
  const customer=await verifyCustomerAccess(tokens.access_token);
  if(!customer)throw Error("Unconfirmed identity.");
  const response=await accountReply(customer,true);
  setCustomerCookies(response,tokens);
  return response;
 }catch{
  if(current)return accountReply(current);
  const response=reply({status:"guest",authenticated:false});
  clearCustomerCookies(response);
  return response;
 }
}
